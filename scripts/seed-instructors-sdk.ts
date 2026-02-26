import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function seedInstructors() {
    console.log('Seeding instructors (Safe Mode)...');
    const instructors = [
        {
            display_name: '西村 勇二',
            bio: '愛媛のDX推進とデジタル人材育成に注力。EIS LLC代表。',
            specialization: 'DX戦略・キャリアデザイン',
            status: 'approved',
            is_official: true
        },
        {
            display_name: '佐藤 美咲',
            bio: 'SNSマーケティングの専門家として、地方企業のブランディングを支援。',
            specialization: 'SNSマーケティング・広報',
            status: 'approved',
            is_official: true
        },
        {
            display_name: '中村 健一',
            bio: 'フルスタックエンジニア。最新のAI技術を活用した業務効率化を提唱。',
            specialization: 'AI活用・Web開発',
            status: 'approved',
            is_official: true
        }
    ];

    for (const inst of instructors) {
        // Check if exists by name
        const { data: existing } = await supabase
            .from('instructors')
            .select('id')
            .eq('display_name', inst.display_name)
            .single();

        if (existing) {
            console.log(`Instructor ${inst.display_name} already exists. Skipping.`);
            continue;
        }

        // We need a user_id from profiles to create an instructor
        // Let's find an admin user or just create a dummy if needed, but profiles are restricted.
        // Usually instructors correspond to real users.
        // Let's try to find an existing profile use for this dummy data.
        const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .limit(1)
            .single();

        if (!profile) {
            console.error('No profiles found. Cannot link instructor.');
            return;
        }

        // Wait, instructors table has UNIQUE(user_id). I can't link all 3 to the same profile.
        // I need 3 profiles.
        console.log('Inserting instructor with profile ID:', profile.id);

        // This seed script is getting complex because of RLS and FKs.
        // Given the constraints, I'll inform the user.
    }
}
seedInstructors();
