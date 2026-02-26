
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

async function promoteToAdmin() {
    const targetEmail = 'test_company@example.com';

    const { data, error } = await supabase
        .from('profiles')
        .update({ user_type: 'admin' })
        .eq('email', targetEmail)
        .select();

    if (error) {
        console.error('Error updating user:', error);
        return;
    }

    console.log(`Successfully promoted ${targetEmail} to admin.`);
    console.log(data);
}

promoteToAdmin();
