import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqmqhhdtdxfuitkwsqxz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxbXFoaGR0ZHhmdWl0a3dzcXh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjEzODg4MSwiZXhwIjoyMDUxNzE0ODgxfQ.TfAstLdP0TxD1POH18xn0tZylJlbPQ-d8K1Hb3WOkrg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log('Testing connection to ALT project:', supabaseUrl);
    const { data, error } = await supabase.from('instructors').select('*').limit(1);
    if (error) console.log('Error:', error.message);
    else console.log('Instructors found:', data.length);
}
test();
