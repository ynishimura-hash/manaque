"use client";

import React, { useState } from 'react';
import { useAppStore } from '@/lib/appStore';
import { useGamificationStore } from '@/store/useGamificationStore';
import { RPG_ITEMS, getEquipmentDetails } from '@/config/rpgItems';
import { ArrowLeft, Sword, Shield, Star, Info } from 'lucide-react';
import Link from 'next/link';
import { Wand2, Calculator, Book, Award, Glasses, Coins, Watch, CircleDot } from 'lucide-react';

function getEquipmentIcon(iconStr: string, size: number = 24) {
    switch (iconStr) {
        case 'sword': case 'sword-lightning': case 'sword-holy':
            return <Sword size={size} />;
        case 'wand': case 'staff': case 'scepter':
            return <Wand2 size={size} />;
        case 'calculator': case 'monitor':
            return <Calculator size={size} />;
        case 'shield': case 'shield-dragon': case 'armor': case 'armor-shiny':
            return <Shield size={size} />;
        case 'shirt':
            return <Book size={size} />;
        case 'amulet': case 'badge':
            return <Award size={size} />;
        case 'glasses':
            return <Glasses size={size} />;
        case 'coin':
            return <Coins size={size} />;
        case 'pocket-watch': case 'hourglass':
            return <Watch size={size} />;
        case 'book':
            return <Book size={size} />;
        case 'ring':
            return <CircleDot size={size} />;
        default:
            return <Star size={size} />;
    }
}

export default function EquipmentPage() {
    const { equipment, inventory, equipItem, selectedCharacterId } = useGamificationStore();
    const [selectedSlot, setSelectedSlot] = useState<'weapon' | 'armor' | 'accessory'>('weapon');

    // インベントリから現在選択中のスロットに該当するアイテムだけを抽出
    const availableItems = inventory
        .map(id => getEquipmentDetails(id))
        .filter(item => item !== null && item.type === selectedSlot);

    // 重複をまとめる処理（同じIDのアイテムをいくつ持っているか）
    const groupedItems = availableItems.reduce((acc, item) => {
        if (!item) return acc;
        if (!acc[item.id]) {
            acc[item.id] = { ...item, count: 1 };
        } else {
            acc[item.id].count += 1;
        }
        return acc;
    }, {} as Record<string, any>);

    const displayItems = Object.values(groupedItems);

    const handleEquip = (itemId: string) => {
        equipItem(selectedSlot, itemId);
    };

    const handleUnequip = () => {
        equipItem(selectedSlot, null);
    };

    const currentEquippedId = equipment[selectedSlot];
    const currentEquippedDetails = getEquipmentDetails(currentEquippedId);

    const isEquippable = (item: any) => {
        if (!item.requiredClass || item.requiredClass.length === 0) return true;
        return item.requiredClass.includes(selectedCharacterId);
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-200 pb-24 font-sans selection:bg-indigo-500/30">
            <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800">
                <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                    <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft size={20} />
                        <span className="text-sm font-bold">拠点へ戻る</span>
                    </Link>
                    <h1 className="text-base font-black text-white">装備の変更</h1>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-4 md:p-6 space-y-6 relative z-10">

                {/* スロット選択タブ */}
                <div className="flex bg-slate-800 rounded-2xl p-1 shadow-inner border border-slate-700">
                    <button
                        onClick={() => setSelectedSlot('weapon')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-black text-sm
                            ${selectedSlot === 'weapon' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}
                    >
                        <Sword size={18} /> 武器
                    </button>
                    <button
                        onClick={() => setSelectedSlot('armor')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-black text-sm
                            ${selectedSlot === 'armor' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}
                    >
                        <Shield size={18} /> 防具
                    </button>
                    <button
                        onClick={() => setSelectedSlot('accessory')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-black text-sm
                            ${selectedSlot === 'accessory' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}
                    >
                        <Star size={18} /> 装飾品
                    </button>
                </div>

                {/* 現在装備中のアイテム表示 */}
                <div className="bg-slate-800/60 p-6 rounded-[2rem] border border-indigo-500/30 shadow-[0_0_20px_rgba(79,70,229,0.1)] relative overflow-hidden">
                    <h2 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-4">ただいまの装備</h2>

                    {currentEquippedDetails ? (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                            <div className={`w-24 h-24 rounded-2xl flex flex-shrink-0 items-center justify-center border-2
                                ${currentEquippedDetails.rarity === 'SSR' ? 'bg-orange-900/40 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.3)] text-orange-400' :
                                    currentEquippedDetails.rarity === 'SR' ? 'bg-purple-900/40 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)] text-purple-400' :
                                        currentEquippedDetails.rarity === 'R' ? 'bg-sky-900/40 border-sky-500 text-sky-400' :
                                            'bg-slate-800 border-slate-600 text-slate-400'}
                            `}>
                                {getEquipmentIcon(currentEquippedDetails.icon, 40)}
                            </div>
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-3">
                                    <span className={`px-2 py-1 rounded text-[10px] font-black
                                        ${currentEquippedDetails.rarity === 'SSR' ? 'bg-orange-500 text-white' :
                                            currentEquippedDetails.rarity === 'SR' ? 'bg-purple-500 text-white' :
                                                currentEquippedDetails.rarity === 'R' ? 'bg-sky-500 text-white' :
                                                    'bg-slate-600 text-white'}
                                    `}>
                                        {currentEquippedDetails.rarity}
                                    </span>
                                    <h3 className="text-xl font-black text-white">{currentEquippedDetails.name}</h3>
                                </div>
                                <p className="text-sm text-slate-300">{currentEquippedDetails.description}</p>
                                <div className="inline-flex items-center gap-1.5 bg-indigo-500/20 text-indigo-300 text-xs font-bold px-3 py-1.5 rounded-lg border border-indigo-500/30">
                                    <Info size={14} />
                                    {currentEquippedDetails.effectType === 'EXP_BOOST' ? `全EXP獲得量 +${currentEquippedDetails.effectValue}%` :
                                        currentEquippedDetails.effectType === 'TIME_SLOW' ? `敵の進行速度を ${currentEquippedDetails.effectValue}% 遅延` :
                                            currentEquippedDetails.effectType === 'SHIELD' ? `誤答ペナルティを ${currentEquippedDetails.effectValue} 回無効化` :
                                                currentEquippedDetails.effectType === 'QUICK_KILL' ? `開幕時に敵を即死させる強力な一撃` :
                                                    currentEquippedDetails.effectType === 'TICKET_DROP' ? `ガチャチケットのドロップ率UP` :
                                                        '特別な効果はありません'}
                                </div>
                            </div>
                            <button
                                onClick={handleUnequip}
                                className="w-full sm:w-auto px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-colors"
                            >
                                外す
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-700 rounded-2xl">
                            <p className="text-slate-500 font-bold">この部位には何も装備していません</p>
                        </div>
                    )}
                </div>

                {/* 所持アイテムリスト */}
                <div>
                    <h2 className="text-sm font-black text-slate-300 mb-4 flex items-center justify-between">
                        <span>所持している{selectedSlot === 'weapon' ? '武器' : selectedSlot === 'armor' ? '防具' : '装飾品'}</span>
                        <span className="text-xs text-slate-500">{displayItems.length} 種類</span>
                    </h2>

                    {displayItems.length === 0 ? (
                        <div className="bg-slate-800/40 rounded-2xl p-12 text-center border border-slate-700/50">
                            <p className="text-slate-500 font-bold mb-4">アイテムをまだ持っていません</p>
                            <Link href="/game/gacha" className="inline-block bg-amber-600 text-white font-black py-2 px-6 rounded-full hover:bg-amber-500 transition-colors shadow-lg shadow-amber-900/20">
                                ガチャを引きに行く
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {displayItems.map((item) => (
                                <div
                                    key={item.id}
                                    className={`bg-slate-800 p-4 rounded-2xl border ${currentEquippedId === item.id ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-700'} hover:bg-slate-700/80 transition-colors flex flex-col justify-between`}
                                >
                                    <div>
                                        <div className="flex items-start justify-between mb-3">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border
                                                ${item.rarity === 'SSR' ? 'bg-orange-900/40 border-orange-500 text-orange-400' :
                                                    item.rarity === 'SR' ? 'bg-purple-900/40 border-purple-500 text-purple-400' :
                                                        item.rarity === 'R' ? 'bg-sky-900/40 border-sky-500 text-sky-400' :
                                                            'bg-slate-700 border-slate-600 text-slate-400'}
                                            `}>
                                                {getEquipmentIcon(item.icon, 24)}
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black
                                                    ${item.rarity === 'SSR' ? 'bg-orange-500 text-white' :
                                                        item.rarity === 'SR' ? 'bg-purple-500 text-white' :
                                                            item.rarity === 'R' ? 'bg-sky-500 text-white' :
                                                                'bg-slate-600 text-white'}
                                                `}>
                                                    {item.rarity}
                                                </span>
                                                {item.count > 1 && (
                                                    <span className="text-[10px] font-bold text-slate-400">所持: {item.count}</span>
                                                )}
                                            </div>
                                        </div>
                                        <h4 className="text-sm font-black text-white mb-1 line-clamp-1">{item.name}</h4>
                                        <p className="text-[10px] text-slate-400 line-clamp-2 mb-3 h-8">{item.description}</p>
                                    </div>

                                    {currentEquippedId === item.id ? (
                                        <button
                                            disabled
                                            className="w-full py-2 bg-indigo-500/20 text-indigo-400 font-bold text-xs rounded-lg border border-indigo-500/30 cursor-default"
                                        >
                                            装備中
                                        </button>
                                    ) : isEquippable(item) ? (
                                        <button
                                            onClick={() => handleEquip(item.id)}
                                            className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs rounded-lg transition-colors"
                                        >
                                            装備する
                                        </button>
                                    ) : (
                                        <button
                                            disabled
                                            className="w-full py-2 bg-slate-800 text-slate-500 font-bold text-xs rounded-lg border border-slate-700 cursor-not-allowed"
                                        >
                                            他クラス専用
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </main>
        </div>
    );
}
