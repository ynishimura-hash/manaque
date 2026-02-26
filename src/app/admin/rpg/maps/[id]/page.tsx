import React from 'react';
import { createClient } from '@/utils/supabase/server';
import MapEditor from '@/rpg/components/Admin/MapEditor';
import { notFound } from 'next/navigation';

export default async function MapEditorPage({ params }: { params: { id: string } }) {
    const { id } = await params;
    const supabase = await createClient();

    // Fetch Map Data
    const { data: mapData, error } = await supabase
        .from('rpg_maps')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !mapData) {
        notFound();
    }

    // Fetch Collisions
    const { data: collisions } = await supabase
        .from('rpg_map_collisions')
        .select('*')
        .eq('map_id', id);

    // Fetch Objects
    const { data: objects } = await supabase
        .from('rpg_map_objects')
        .select('*')
        .eq('map_id', id);

    return (
        <div className="h-[calc(100vh-64px)] overflow-hidden">
            <MapEditor
                initialMap={mapData}
                initialCollisions={collisions || []}
                initialObjects={objects || []}
            />
        </div>
    );
}
