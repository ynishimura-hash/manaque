
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listUsers() {
    const { data: users, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, user_type');

    if (error) {
        console.error('Error fetching users:', error);
        return;
    }

    console.log('--- Users ---');
    console.table(users);
}

listUsers();
