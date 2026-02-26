import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { MAPS } from '@/rpg/data/maps';

// Initialize Supabase Admin Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET() {
    try {
        if (!supabaseUrl || !supabaseServiceKey) {
            return NextResponse.json({ error: 'Supabase URL or Service Role Key is missing.' }, { status: 500 });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });

        console.log('Starting Seed via Supabase API...');

        // Seed Data
        for (const mapKey in MAPS) {
            const map = MAPS[mapKey];
            console.log(`Processing map: ${map.name}`);

            // 1. Upsert Map
            const { data: mapData, error: mapError } = await supabase
                .from('rpg_maps')
                .upsert({
                    key: map.id,
                    name: map.name,
                    width: map.width,
                    height: map.height,
                    base_image_url: map.baseImage,
                    encounters_enabled: map.encounters
                }, { onConflict: 'key' })
                .select()
                .single();

            if (mapError) throw new Error(`Map Upsert Error: ${mapError.message}`);
            const mapId = mapData.id;

            // 2. Clear existing objects (optional, or rely on clean slate)
            await supabase.from('rpg_map_objects').delete().eq('map_id', mapId);
            await supabase.from('rpg_map_collisions').delete().eq('map_id', mapId);

            // 3. Insert Portals
            const portalsToInsert = map.portals.map(p => ({
                map_id: mapId,
                type: 'portal',
                x: p.x,
                y: p.y,
                name: `Portal to ${p.targetMapId}`,
                target_map_id: p.targetMapId,
                target_x: p.targetX,
                target_y: p.targetY
            }));

            if (portalsToInsert.length > 0) {
                const { error: pError } = await supabase.from('rpg_map_objects').insert(portalsToInsert);
                if (pError) throw new Error(`Portal Insert Error: ${pError.message}`);
            }

            // 4. Insert Entities
            const entitiesToInsert = map.entities.map(e => ({
                map_id: mapId,
                type: e.type,
                x: e.x,
                y: e.y,
                name: e.name,
                sprite_url: e.sprite,
                scenario_id: e.scenarioId
            }));

            if (entitiesToInsert.length > 0) {
                const { error: eError } = await supabase.from('rpg_map_objects').insert(entitiesToInsert);
                if (eError) throw new Error(`Entity Insert Error: ${eError.message}`);
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Seeding completed successfully via Supabase API. (Ensure tables were created manually!)'
        });

    } catch (e: any) {
        console.error('Seeding failed:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
