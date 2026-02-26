import { createAdminClient } from '@/utils/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function POST(request: NextRequest) {
    try {
        // 1. 管理者認証チェック
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                },
            }
        );

        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const adminClient = createAdminClient();

        // プロフィールで管理者確認
        const { data: adminProfile } = await adminClient
            .from('profiles')
            .select('user_type')
            .eq('id', session.user.id)
            .single();

        if (!adminProfile || adminProfile.user_type !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 2. リクエスト解析
        const { data } = await request.json();

        if (!data || !Array.isArray(data)) {
            return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
        }

        const results = [];
        let successCount = 0;
        let errorCount = 0;

        for (const row of data) {
            const {
                email,
                full_name,
                company_name,
                website_url,
                password
            } = row;

            if (!email || !company_name) {
                results.push({ email, status: 'error', message: 'Email and Company Name are required' });
                errorCount++;
                continue;
            }

            try {
                // 仮パスワードの生成（指定がない場合）
                const tempPassword = password || Math.random().toString(36).slice(-10) + 'A1!';

                // 1. Auth ユーザー作成
                const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
                    email,
                    password: tempPassword,
                    email_confirm: true,
                    user_metadata: {
                        full_name: full_name || company_name,
                        user_type: 'company'
                    }
                });

                if (authError) throw authError;
                const userId = authData.user.id;

                // 2. Profiles テーブルに登録（トリガーで作成されている可能性を考慮して upsert）
                const { error: profileError } = await adminClient
                    .from('profiles')
                    .upsert({
                        id: userId,
                        email,
                        full_name: full_name || company_name,
                        user_type: 'company',
                        company_name: company_name
                    });

                if (profileError) throw profileError;

                // 3. Organizations テーブルの作成
                const { data: orgData, error: orgError } = await adminClient
                    .from('organizations')
                    .insert({
                        name: company_name,
                        type: 'company',
                        website_url: website_url || null,
                        user_id: userId // 担当者と紐付け
                    })
                    .select()
                    .single();

                if (orgError) throw orgError;

                // 4. Organization Members への登録
                const { error: memberError } = await adminClient
                    .from('organization_members')
                    .insert({
                        organization_id: orgData.id,
                        user_id: userId,
                        role: 'admin',
                        status: 'active'
                    });

                if (memberError) throw memberError;

                results.push({ email, company_name, status: 'success' });
                successCount++;

            } catch (err: any) {
                console.error(`Bulk import failed for ${email}:`, err);
                results.push({ email, status: 'error', message: err.message });
                errorCount++;
            }
        }

        return NextResponse.json({
            success: true,
            summary: {
                total: data.length,
                success: successCount,
                error: errorCount
            },
            results
        });

    } catch (error: any) {
        console.error('Bulk import general error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
