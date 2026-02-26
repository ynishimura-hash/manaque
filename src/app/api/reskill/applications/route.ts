import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const event_id = searchParams.get('event_id');

    if (!event_id) {
        return NextResponse.json({ error: 'event_id is required' }, { status: 400 });
    }

    const { data, error } = await supabase
        .from('reskill_event_applications')
        .select(`
            *,
            user:profiles(*)
        `)
        .eq('event_id', event_id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const body = await request.json();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
        .from('reskill_event_applications')
        .upsert([{
            event_id: body.event_id,
            user_id: user.id,
            status: 'applied',
            updated_at: new Date().toISOString()
        }])
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

export async function PATCH(request: NextRequest) {
    const supabase = await createClient();
    const body = await request.json();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    console.log(`PATCH applications: User ${user.id} updating. Body:`, body);

    let query = supabase
        .from('reskill_event_applications')
        .update({
            status: body.status,
            attended: body.attended,
            updated_at: new Date().toISOString()
        });

    if (body.id) {
        // Admin update by Application ID
        console.log(`Updating by ID: ${body.id}`);
        query = query.eq('id', body.id);
    } else {
        // User self-update
        console.log(`Updating by event_id: ${body.event_id} and user_id: ${user.id}`);
        query = query.eq('event_id', body.event_id).eq('user_id', user.id);
    }

    const { data, error } = await query.select().single();

    if (error) {
        console.error('Update failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Update successful:', data);
    return NextResponse.json(data);
}
