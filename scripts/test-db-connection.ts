import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    try {
        console.log('Testing connection to:', supabaseUrl);

        // 1. Check instructors table
        const { data: instructors, error: instError } = await supabase
            .from('instructors')
            .select('*')
            .limit(1);

        if (instError) {
            console.log('Instructors table error (might not exist):', instError.message);
        } else {
            console.log('Instructors table exists. Found:', instructors?.length);
        }

        // 2. Check reskill_events table
        const { data: events, error: eventError } = await supabase
            .from('reskill_events')
            .select('*')
            .limit(1);

        if (eventError) {
            console.log('Reskill_events table error (might not exist):', eventError.message);
        } else {
            console.log('Reskill_events table exists. Found:', events?.length);
        }
    } catch (err) {
        console.error('Test failed:', err);
    }
}

testConnection();
