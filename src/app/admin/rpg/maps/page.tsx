"use client";
import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

export default function RPGMapListPage() {
    const [maps, setMaps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchMaps() {
            try {
                console.log('Fetching maps client-side...');
                const supabase = createClient();
                const { data, error } = await supabase.from('rpg_maps').select('*').order('created_at', { ascending: true });
                if (error) throw error;
                setMaps(data || []);
            } catch (e: any) {
                console.error(e);
                setError(e.message);
            } finally {
                setLoading(false);
            }
        }
        fetchMaps();
    }, []);

    if (loading) return <div className="p-8">Loading maps...</div>;
    if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

    return (
        <div className="container py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">RPGマップ管理</h1>
                <Button asChild>
                    <Link href="/admin/rpg/maps/new">新規マップ作成</Link>
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {maps.map((map) => (
                    <Link href={`/admin/rpg/maps/${map.id}`} key={map.id}>
                        <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer flex flex-col gap-2 h-full">
                            <div className="aspect-video relative bg-slate-100 rounded overflow-hidden border">
                                {map.base_image_url ? (
                                    <img
                                        src={map.base_image_url}
                                        alt={map.name}
                                        className="object-cover w-full h-full pixelated"
                                        style={{ imageRendering: 'pixelated' }}
                                    />
                                ) : (
                                    <div className="flex items-center justify-center w-full h-full text-slate-400">No Image</div>
                                )}
                            </div>
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-lg">{map.name}</h3>
                                    <p className="text-xs text-muted-foreground font-mono">{map.key}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs bg-slate-200 px-2 py-1 rounded">{map.width}x{map.height}</span>
                                </div>
                            </div>
                        </Card>
                    </Link>
                ))}
            </div>

            {maps.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    マップがまだありません。移行スクリプトを実行するか、新規作成してください。
                </div>
            )}
        </div>
    );
}
