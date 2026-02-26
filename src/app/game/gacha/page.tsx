"use client";

import React, { useState } from 'react';
import { useGamificationStore } from '@/store/useGamificationStore';
import { RPG_ITEMS, RpgItem, getEquipmentDetails } from '@/config/rpgItems';
import { Sparkles, Ticket, ArrowLeft, Shield, Sword, Star, Wand2, Calculator, Award, Watch, Book, Coins, Glasses, CircleDot } from 'lucide-react';
import type { RpgItem as RpgItemType } from '@/config/rpgItems';

// 装備アイコンのマッピング
function getGachaItemIcon(iconStr: string, size: number = 32) {
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
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function GachaPage() {
    const { gachaTickets, consumeGachaTickets, obtainEquipment, selectedCharacterId } = useGamificationStore();
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawResult, setDrawResult] = useState<RpgItem[]>([]);

    // ガチャの排出率設定 (パーセント)
    const DROP_RATES = {
        N: 60,
        R: 30,
        SR: 8,
        SSR: 2
    };

    // レアリティに応じたアイテムを抽選
    const drawSingleItem = (): RpgItem => {
        const rand = Math.random() * 100;
        let selectedRarity: Rarity = 'N';

        if (rand < DROP_RATES.SSR) selectedRarity = 'SSR';
        else if (rand < DROP_RATES.SSR + DROP_RATES.SR) selectedRarity = 'SR';
        else if (rand < DROP_RATES.SSR + DROP_RATES.SR + DROP_RATES.R) selectedRarity = 'R';

        const pool = RPG_ITEMS.filter(item => item.rarity === selectedRarity);
        const rolledItem = pool[Math.floor(Math.random() * pool.length)];

        // 商人クラスの場合は少し良いアイテムが出やすいなどの隠し補正を入れることも可能
        return rolledItem;
    };

    const handleDraw = async (count: number) => {
        if (gachaTickets < count) {
            toast.error('ガチャチケットが足りません', { icon: '🎫' });
            return;
        }

        setIsDrawing(true);
        consumeGachaTickets(count);
        setDrawResult([]); // Reset previous

        // 演出用のウェイト
        await new Promise(resolve => setTimeout(resolve, 1500));

        const targetStore = useGamificationStore.getState();
        const results: RpgItemType[] = [];
        for (let i = 0; i < count; i++) {
            const item = drawSingleItem();
            results.push(item);

            // 効果がUNLOCK_RECIPEのアニソンアイテム（秘伝書）が出た場合は、inventoryに追加する特別処理（今回は簡易的にobtainEquipmentでも処理可能か確認が必要ですが、rpgItemsとして追加します）
            targetStore.obtainEquipment(item.id);
        }

        // 10連の場合、SR以上が1つもなければ最後の1枠をSR確定に差し替え
        if (count >= 10) {
            const hasSROrAbove = results.some(item => item.rarity === 'SR' || item.rarity === 'SSR');
            if (!hasSROrAbove) {
                const srPool = RPG_ITEMS.filter(item => item.rarity === 'SR');
                if (srPool.length > 0) {
                    const srItem = srPool[Math.floor(Math.random() * srPool.length)];
                    results[results.length - 1] = srItem;
                    obtainEquipment(srItem.id);
                }
            }
        }

        setDrawResult(results);
        setIsDrawing(false);

        // SSRが出たときの特別音や演出フラグ
        if (results.some(item => item.rarity === 'SSR')) {
            toast.success('SSR 伝説の装備を獲得しました！！！', {
                icon: '🌟', duration: 5000,
                style: { background: '#f59e0b', color: '#fff', fontWeight: 'bold' }
            });
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-200 pb-24 font-sans selection:bg-amber-500/30 overflow-x-hidden">
            {/* 魔法陣のような背景装飾 */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-amber-600/10 blur-[150px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-yellow-400/10 blur-[120px]" />
            </div>

            <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800">
                <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                    <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft size={20} />
                        <span className="text-sm font-bold">拠点へ戻る</span>
                    </Link>
                    <div className="flex items-center gap-2 bg-amber-500/10 text-amber-400 px-4 py-1.5 rounded-full border border-amber-500/30 relative group">
                        <Ticket size={16} />
                        <span className="text-sm font-black">x {gachaTickets}</span>
                        <button
                            onClick={() => useGamificationStore.getState().addGachaTickets(100)}
                            className="absolute -bottom-8 right-0 bg-amber-600/80 hover:bg-amber-500 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
                        >
                            デバッグ: チケット+100
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-4 md:p-6 space-y-8 relative z-10 flex flex-col items-center justify-center min-h-[70vh]">

                <div className="text-center space-y-4 mb-8">
                    <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-600">
                        宝物庫の扉
                    </h1>
                    <p className="text-sm font-bold text-slate-400">
                        チケットを使って強力な装備（バフ）を引き当てよう。
                    </p>
                </div>

                <AnimatePresence mode="wait">
                    {!isDrawing && drawResult.length === 0 && (
                        <motion.div
                            key="buttons"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="flex flex-col sm:flex-row gap-6 w-full max-w-lg"
                        >
                            <button
                                onClick={() => handleDraw(1)}
                                disabled={gachaTickets < 1}
                                className={`flex-1 flex flex-col items-center justify-center p-6 rounded-[2rem] border-2 transition-all ${gachaTickets >= 1
                                    ? 'bg-slate-800/80 border-amber-500/30 hover:border-amber-400 hover:shadow-[0_0_30px_rgba(251,191,36,0.2)] hover:-translate-y-1'
                                    : 'bg-slate-800/40 border-slate-700/50 opacity-50 cursor-not-allowed'
                                    }`}
                            >
                                <Sparkles size={40} className="text-amber-400 mb-3" />
                                <span className="text-xl font-black text-white mb-2">1回 引く</span>
                                <div className="flex items-center gap-1 text-amber-400 text-sm font-bold bg-amber-500/10 px-3 py-1 rounded-full">
                                    <Ticket size={14} /> 1枚
                                </div>
                            </button>

                            <button
                                onClick={() => handleDraw(10)}
                                disabled={gachaTickets < 10}
                                className={`flex-1 flex flex-col items-center justify-center p-6 rounded-[2rem] border-2 transition-all relative overflow-hidden ${gachaTickets >= 10
                                    ? 'bg-gradient-to-br from-amber-600 to-yellow-600 border-yellow-400 shadow-[0_0_40px_rgba(251,191,36,0.3)] hover:shadow-[0_0_60px_rgba(251,191,36,0.5)] hover:-translate-y-1'
                                    : 'bg-slate-800/40 border-slate-700/50 opacity-50 cursor-not-allowed'
                                    }`}
                            >
                                {gachaTickets >= 10 && (
                                    <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl shadow-lg">
                                        SR以上1枠確定！
                                    </div>
                                )}
                                <div className="flex text-white mb-3 relative">
                                    <Sparkles size={40} />
                                    <Sparkles size={24} className="absolute -right-4 -top-2 text-yellow-200 animate-pulse" />
                                </div>
                                <span className="text-xl font-black text-white mb-2">10連 引く</span>
                                <div className="flex items-center gap-1 text-yellow-100 text-sm font-bold bg-black/20 px-3 py-1 rounded-full">
                                    <Ticket size={14} /> 10枚
                                </div>
                            </button>
                        </motion.div>
                    )}

                    {isDrawing && (
                        <motion.div
                            key="drawing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-20"
                        >
                            <div className="relative">
                                <div className="w-32 h-32 rounded-full border-4 border-amber-500/20 border-t-amber-400 animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Sparkles size={40} className="text-amber-400 animate-pulse" />
                                </div>
                            </div>
                            <p className="mt-8 text-lg font-black text-amber-400 animate-pulse tracking-widest">
                                宝箱を開封中...
                            </p>
                        </motion.div>
                    )}

                    {!isDrawing && drawResult.length > 0 && (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full max-w-4xl flex flex-col items-center bg-slate-800/60 p-8 rounded-[3rem] border border-slate-700/50 backdrop-blur-md"
                        >
                            <h2 className="text-2xl font-black text-white mb-8 border-b border-slate-700 pb-4 w-full text-center">
                                獲得アイテム
                            </h2>

                            <div className="flex flex-wrap justify-center gap-4 mb-12">
                                {drawResult.map((item, index) => {
                                    // 演出の遅延表示
                                    return (
                                        <motion.div
                                            key={`${item.id}-${index}`}
                                            initial={{ opacity: 0, y: 50 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className={`relative w-28 p-3 rounded-2xl flex flex-col items-center justify-center text-center border-2 
                                                ${item.rarity === 'SSR' ? 'bg-gradient-to-b from-orange-500/20 to-orange-900/40 border-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.4)]' :
                                                    item.rarity === 'SR' ? 'bg-purple-900/40 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)]' :
                                                        item.rarity === 'R' ? 'bg-sky-900/40 border-sky-400' :
                                                            'bg-slate-800 border-slate-600'}
                                            `}
                                        >
                                            <div className={`absolute -top-3 px-2 py-0.5 rounded text-[10px] font-black border
                                                ${item.rarity === 'SSR' ? 'bg-orange-500 text-white border-orange-300' :
                                                    item.rarity === 'SR' ? 'bg-purple-500 text-white border-purple-300' :
                                                        item.rarity === 'R' ? 'bg-sky-500 text-white border-sky-300' :
                                                            'bg-slate-700 text-slate-300 border-slate-500'}
                                            `}>
                                                {item.rarity}
                                            </div>
                                            <div className={`w-12 h-12 mb-2 flex items-center justify-center rounded-xl 
                                                ${item.rarity === 'SSR' ? 'text-orange-400' :
                                                    item.rarity === 'SR' ? 'text-purple-400' :
                                                        item.rarity === 'R' ? 'text-sky-400' :
                                                            'text-slate-400'}
                                            `}>
                                                {item.imageUrl ? (
                                                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain drop-shadow-md" />
                                                ) : (
                                                    getGachaItemIcon(item.icon, 32)
                                                )}
                                            </div>
                                            <p className={`text-xs font-black line-clamp-2 ${item.rarity === 'SSR' ? 'text-white' : 'text-slate-200'}`}>
                                                {item.name}
                                            </p>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => setDrawResult([])}
                                className="bg-slate-700 text-white font-bold py-3 px-8 rounded-full hover:bg-slate-600 transition-colors"
                            >
                                もどる
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

            </main>
        </div>
    );
}

// レアリティの型定義（ローカル使用用）
type Rarity = 'N' | 'R' | 'SR' | 'SSR';
