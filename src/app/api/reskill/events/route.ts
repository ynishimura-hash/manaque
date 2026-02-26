import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const instructor_id = searchParams.get('instructor_id');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const sort = searchParams.get('sort') || 'asc'; // default to asc

    let query = supabase
        .from('reskill_events')
        .select(`
            *,
            instructor:instructors(*)
        `)
        .order('start_at', { ascending: sort === 'asc' });

    if (type && type !== 'all') {
        query = query.eq('event_type', type);
    }
    if (instructor_id) {
        query = query.eq('instructor_id', instructor_id);
    }
    if (from) {
        query = query.gte('start_at', from);
    }
    if (to) {
        // Add one day to include the end date fully if it's just a date string, 
        // usually 'to' from a date picker is YYYY-MM-DD. 
        // If we want inclusive, we might need to handle time. 
        // Assuming simple YYYY-MM-DD comparison for now or ISO string.
        query = query.lte('start_at', to);
    }

    const { data, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const {
        title,
        description,
        event_type,
        start_at,
        end_at,
        instructor_id,
        capacity,
        location,
        web_url,
        status,
        image_url
    } = await request.json();

    const { data, error } = await supabase
        .from('reskill_events')
        .insert([{
            title,
            description,
            event_type,
            start_at,
            end_at,
            instructor_id,
            capacity,
            location,
            web_url,
            status,
            image_url
        }])
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}
