import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
    console.log('--- Final Verification Report ---');

    // 1. Check instructors
    const { data: insts, error: instErr } = await supabase.from('instructors').select('*');
    if (instErr) console.error('Instructor load error:', instErr.message);
    else console.log(`Instructors: ${insts.length} found.`);
    insts?.forEach(i => console.log(`  - [${i.id}] ${i.display_name} (${i.specialization})`));

    // 2. Check events
    const { data: events, error: eventErr } = await supabase.from('reskill_events').select('*, instructors(display_name)');
    if (eventErr) console.error('Event load error:', eventErr.message);
    else console.log(`Events: ${events.length} found.`);
    events?.forEach(e => console.log(`  - [${e.event_type}] ${e.title} (By: ${e.instructors?.display_name})`));

    console.log('--- End of Report ---');
}
verify();
