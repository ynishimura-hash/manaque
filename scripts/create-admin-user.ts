
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

async function createAdminUser() {
    const email = 'verification_admin@example.com';
    const password = 'password123';

    console.log(`Creating user: ${email}`);

    // 1. Create User in Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
    });

    if (authError) {
        console.error('Error creating auth user:', authError);
        // If user already exists, try to find it
        if (authError.message.includes('already registered')) {
            console.log('User might already exist. Fetching ID...');
            // We can't easily get ID by email from client sdk admin api in one shot if create fails, 
            // but we can list users.
            const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
            if (listError) {
                console.error('Failed to list users:', listError);
                return;
            }
            const existingUser = usersData.users.find(u => u.email === email);
            if (existingUser) {
                console.log(`Found existing user ID: ${existingUser.id}`);
                await promoteProfile(existingUser.id, email);
            } else {
                console.error('Could not find existing user.');
            }
        }
        return;
    }

    const userId = authData.user.id;
    console.log(`User created with ID: ${userId}`);

    await promoteProfile(userId, email);
}

async function promoteProfile(userId: string, email: string) {
    console.log(`Updating profile for ${userId}...`);

    // 2. Upsert Profile with admin type
    // Check if profile exists first (it should be created by triggers usually, but maybe not in this env)
    const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    // If we rely on triggers, we might need to wait or insert manually.
    // Let's force upsert just in case.
    const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
            id: userId,
            email: email,
            user_type: 'admin',
            full_name: 'Verification Admin',
            updated_at: new Date().toISOString()
        })
        .select();

    if (profileError) {
        console.error('Error updating profile:', profileError);
    } else {
        console.log('Successfully configured admin profile.');
    }
}

createAdminUser();
