
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('Checking schema for reskill_event_applications...');

    // Try to select the 'attended' column
    const { data, error } = await supabase
        .from('reskill_event_applications')
        .select('attended')
        .limit(1);

    if (error) {
        console.error('Error selecting attended column:', error);
    } else {
        console.log('Successfully selected attended column. Data:', data);
    }
}

checkSchema();
