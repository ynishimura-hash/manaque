
import React from 'react';
import MapEditor from '@/rpg/components/Admin/MapEditor'; // Adjust path if needed

export default function NewMapPage() {
    const newId = crypto.randomUUID();
    const initialMap = {
        id: newId,
        key: `map_${Date.now()}`,
        name: '新規マップ',
        width: 20,
        height: 15,
        base_image_url: '',
        encounters_enabled: false,
        tile_data: []
    };

    return (
        <div className="h-[calc(100vh-64px)] overflow-hidden">
            <MapEditor
                initialMap={initialMap}
                initialCollisions={[]}
                initialObjects={[]}
                isNewMap={true}
            />
        </div>
    );
}
