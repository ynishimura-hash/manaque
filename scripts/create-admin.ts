
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function createAdmin() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(url, key);

    const email = 'admin@example.com';
    const password = 'password123';

    console.log(`Creating/Updating Admin: ${email}`);

    // Check if exists
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const existing = users.find(u => u.email === email);

    if (existing) {
        console.log('Updating existing admin password...');
        await supabase.auth.admin.updateUserById(existing.id, {
            password: password,
            user_metadata: { user_type: 'admin', full_name: 'System Admin' }
        });
        // Update profile
        await supabase.from('profiles').upsert({
            id: existing.id,
            user_type: 'admin',
            full_name: 'System Admin'
        });
    } else {
        console.log('Creating new admin...');
        const { data: user, error } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { user_type: 'admin', full_name: 'System Admin' }
        });
        if (error) {
            console.error(error);
            return;
        }
        if (user.user) {
            await supabase.from('profiles').upsert({
                id: user.user.id,
                user_type: 'admin',
                full_name: 'System Admin'
            });
        }
    }
    console.log('Admin ready.');
}

createAdmin();
