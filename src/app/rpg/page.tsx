"use client";

import React from 'react';
import { useRPGStore } from '@/rpg/store/rpgStore';
import MapEngine from '@/rpg/components/Map/MapEngine';
import NovelEngine from '@/rpg/components/Novel/NovelEngine';
import BattleEngine from '@/rpg/components/Battle/BattleEngine';
import MenuScreen from '@/rpg/components/UI/MenuScreen';

export default function RPGPage() {
    const { mode } = useRPGStore();

    return (
        <div className="fixed inset-0 bg-black overflow-hidden select-none">
            {/* 画面切り替え */}
            {mode === 'map' && <MapEngine />}
            {mode === 'novel' && <NovelEngine />}
            {mode === 'battle' && <BattleEngine />}
            {mode === 'menu' && <MenuScreen />}

            {/* ローディングやオーバーレイ */}
            <div className="absolute top-4 right-4 bg-black/50 text-white p-2 text-xs font-mono rounded">
                Mode: {mode.toUpperCase()}
            </div>
        </div>
    );
}
