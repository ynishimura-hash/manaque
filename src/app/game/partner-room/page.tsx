"use client";

import React, { useState, useEffect } from 'react';
import { useGamificationStore } from '@/store/useGamificationStore';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowLeft, Ticket, Star, Shield, Sword, Lock, BookOpen, X, ChevronRight, ArrowDown } from 'lucide-react';
import { RPG_ITEMS, getEquipmentDetails } from '@/config/rpgItems';
import toast from 'react-hot-toast';

export default function PartnerRoomPage() {
    const {
        eggTickets,
        eggTicketFragments,
        consumeEggTickets,
        selectedPartnerId,
        selectPartner,
        eggGachaCount,
        incrementEggGachaCount,
        partnerInventory,
        addPartnersToInventory,
        mergePartners,
        evolvePartner,
        convertPartnersToFragments,
        equipment, // 追加: 装備（アイテム所持）チェック用
    } = useGamificationStore();

    // 未実装の所持パートナーリスト（今回はStoreへの保存が未実装のため仮のモックデータまたは全パートナーを保持している体で進める）
    // 理想はStoreに unlockedPartners を持たせることですが、今回はシンプルにtd-configの全パートナーリストから選べるようにするか、ガチャで当てるモックにします。

    const [config, setConfig] = useState<any>(null);
    const [view, setView] = useState<'room' | 'gacha' | 'merge' | 'convert'>('room');
    const [gachaResults, setGachaResults] = useState<any[]>([]);
    const [isPulling, setIsPulling] = useState(false);
    const [highlightIndex, setHighlightIndex] = useState<number | null>(null);

    const [sortOrder, setSortOrder] = useState<'acquired' | 'rarity' | 'character'>('acquired');
    const [mergeBaseId, setMergeBaseId] = useState<string | null>(null);
    const [mergeMaterialIds, setMergeMaterialIds] = useState<string[]>([]);
    const [convertIds, setConvertIds] = useState<string[]>([]);
    const [showRecipeModal, setShowRecipeModal] = useState(false);
    const [showConvertConfirm, setShowConvertConfirm] = useState(false);
    const [mergeResult, setMergeResult] = useState<{
        name: string;
        imageUrl: string;
        rarity: string;
        beforeLevel: number;
        afterLevel: number;
        beforeLimitBreak: number;
        afterLimitBreak: number;
        materialCount: number;
        isEvolution?: boolean;
        evolutionName?: string;
        evolutionImageUrl?: string;
    } | null>(null);
    const [missingRecipeInfo, setMissingRecipeInfo] = useState<{
        recipeName: string;
        evolutionName: string;
        evolutionImageUrl: string;
    } | null>(null);

    // 名前変更用
    const [isEditingName, setIsEditingName] = useState(false);
    const [editingName, setEditingName] = useState("");
    const { renamePartner } = useGamificationStore();

    useEffect(() => {
        fetch('/data/td-config.json')
            .then(res => res.json())
            .then(data => setConfig(data))
            .catch(e => console.error(e));
    }, []);

    if (!config) {
        return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;
    }

    const partners = config.partners?.list || [];
    const eggConfig = config.partners?.eggGacha || { cost: 1, rates: { N: 60, R: 30, SR: 9, SSR: 1 } };

    const rarityValues = { SSR: 4, SR: 3, R: 2, N: 1 };
    const sortedInventory = [...partnerInventory].sort((a, b) => {
        if (sortOrder === 'rarity') {
            const aData = partners.find((p: any) => p.id === a.partnerId);
            const bData = partners.find((p: any) => p.id === b.partnerId);
            const aRarity = aData ? rarityValues[aData.rarity as keyof typeof rarityValues] : 0;
            const bRarity = bData ? rarityValues[bData.rarity as keyof typeof rarityValues] : 0;
            if (aRarity !== bRarity) return bRarity - aRarity;
            // レアリティが同じ場合はレベル順
            if (a.level !== b.level) return b.level - a.level;
        } else if (sortOrder === 'character') {
            const aData = partners.find((p: any) => p.id === a.partnerId);
            const bData = partners.find((p: any) => p.id === b.partnerId);
            // 名前の文字列でソート
            const nameCompare = (aData?.name || '').localeCompare(bData?.name || '');
            if (nameCompare !== 0) return nameCompare;
            // 同じキャラの場合はレベル順
            if (a.level !== b.level) return b.level - a.level;
            // さらにレアリティ順
            const aRarity = aData ? rarityValues[aData.rarity as keyof typeof rarityValues] : 0;
            const bRarity = bData ? rarityValues[bData.rarity as keyof typeof rarityValues] : 0;
            if (aRarity !== bRarity) return bRarity - aRarity;
        }
        return b.acquiredAt - a.acquiredAt;
    });

    const handlePullGacha = async (count: number) => {
        const totalCost = eggConfig.cost * count;
        if (eggTickets < totalCost) {
            toast.error(`チケットが足りません（必要: ${totalCost}枚）`);
            return;
        }

        setIsPulling(true);
        setGachaResults([]);

        const results = [];
        let currentCount = eggGachaCount;

        for (let i = 0; i < count; i++) {
            currentCount++;
            let rarity = 'N';

            // 天井判定 (100の倍数でSSR, 30の倍数でSR)
            if (currentCount % 100 === 0) {
                rarity = 'SSR';
            } else if (currentCount % 30 === 0) {
                rarity = 'SR';
            } else {
                // 通常確率
                const rand = Math.random() * 100;
                let acc = 0;
                if (rand < (acc += eggConfig.rates.SSR)) rarity = 'SSR';
                else if (rand < (acc += eggConfig.rates.SR)) rarity = 'SR';
                else if (rand < (acc += eggConfig.rates.R)) rarity = 'R';
            }

            // 特殊融合専用パートナーはガチャから除外
            const excludedIds = ['13', '14', '15'];
            const pool = partners.filter((p: any) => p.rarity === rarity && !excludedIds.includes(p.id));
            const winPartner = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : partners.filter((p: any) => !excludedIds.includes(p.id))[0];
            results.push(winPartner);
        }

        // 演出ウェイト
        await new Promise(r => setTimeout(r, 1500));

        incrementEggGachaCount(count);
        consumeEggTickets(totalCost);
        setGachaResults(results);
        setIsPulling(false);

        // 当選結果にSR/SSRが含まれる場合は初回のハイライトインデックスを設定
        const firstHighlight = results.findIndex(r => r.rarity === 'SSR' || r.rarity === 'SR');

        addPartnersToInventory(results.map(r => r.id));

        if (firstHighlight !== -1) {
            setHighlightIndex(firstHighlight);
        } else {
            setHighlightIndex(null);
            if (count === 1) toast.success(`${results[0].name} を仲間にした！`);
            else toast.success(`${count}体のパートナーを仲間にした！`);
        }
    };

    const activeInstance = partnerInventory.find(i => i.instanceId === selectedPartnerId);
    const activePartnerData = activeInstance ? partners.find((p: any) => p.id === activeInstance.partnerId) : null;
    const activePartnerName = activeInstance?.customName || activePartnerData?.name || '未設定';

    const handleRename = () => {
        if (!selectedPartnerId) return;
        renamePartner(selectedPartnerId, editingName);
        setIsEditingName(false);
        toast.success('名前を変更しました！');
    };

    const getMaxLevel = (rarity: string, limitBreak: number = 0) => {
        let baseMax = 25;
        if (rarity === 'SSR') baseMax = 40;
        else if (rarity === 'SR') baseMax = 35;
        else if (rarity === 'R') baseMax = 30;
        return baseMax + limitBreak;
    };

    const getRarityRank = (rarity: string) => {
        return { 'SSR': 4, 'SR': 3, 'R': 2, 'N': 1 }[rarity] || 1;
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 pb-20 font-sans selection:bg-rose-500/30">
            {/* ヘッダー */}
            <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800">
                <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                    <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft size={20} />
                        <span className="text-sm font-bold">拠点へ戻る</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-full relative group">
                            <Ticket size={16} className="text-pink-400" />
                            <span className="text-sm font-black text-white">{eggTickets}</span>
                            <span className="text-xs font-bold text-pink-300 ml-1">(かけら: {eggTicketFragments}/5)</span>
                            {/* デバッグ用ボタン */}
                            <button
                                onClick={() => useGamificationStore.getState().addEggTickets(1000)}
                                className="absolute -bottom-8 right-0 bg-rose-600/80 hover:bg-rose-500 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
                            >
                                デバッグ: チケット+1000
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 pt-8 shrink-0">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-400 flex items-center gap-2">
                            <Sparkles className="text-rose-400" />
                            パートナーの部屋
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">卵を孵化させて頼れる相棒を見つけよう</p>
                    </div>
                    <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
                        <button
                            onClick={() => setView('room')}
                            className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${view === 'room' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            編成
                        </button>
                        <button
                            onClick={() => {
                                setView('merge');
                                setMergeBaseId(null);
                                setMergeMaterialIds([]);
                            }}
                            className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${view === 'merge' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            融合
                        </button>
                        <button
                            onClick={() => {
                                setView('convert');
                                setConvertIds([]);
                            }}
                            className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${view === 'convert' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            お別れ
                        </button>
                        <button
                            onClick={() => setView('gacha')}
                            className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${view === 'gacha' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            卵ガチャ
                        </button>
                    </div>
                </div>

                {view === 'room' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                        {/* 現在のパートナー */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row items-center gap-8">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 blur-[100px] pointer-events-none" />
                            <div className="w-32 h-32 md:w-48 md:h-48 shrink-0 relative">
                                {activePartnerData?.stages[0]?.imageUrl ? (
                                    <img src={activePartnerData.stages[0].imageUrl} alt="パートナー" className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(244,63,94,0.3)] animate-pulse" style={{ animationDuration: '3s' }} />
                                ) : (
                                    <div className="w-full h-full rounded-2xl bg-slate-800 border-2 border-slate-700 flex items-center justify-center">
                                        <Sparkles size={48} className="text-slate-600" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <h2 className="text-sm font-bold text-rose-400 mb-1">現在のお供</h2>

                                {isEditingName ? (
                                    <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
                                        <input
                                            type="text"
                                            value={editingName}
                                            onChange={(e) => setEditingName(e.target.value)}
                                            maxLength={15}
                                            className="bg-slate-800 text-white px-3 py-1 rounded border border-slate-600 focus:outline-none focus:border-rose-400"
                                            autoFocus
                                        />
                                        <button onClick={handleRename} className="bg-rose-600 text-white px-3 py-1 rounded text-sm font-bold">保存</button>
                                        <button onClick={() => setIsEditingName(false)} className="bg-slate-700 text-white px-3 py-1 rounded text-sm font-bold">ｷｬﾝｾﾙ</button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 mb-2 justify-center md:justify-start group">
                                        <h3 className="text-2xl font-black text-white">{activePartnerName}</h3>
                                        {activeInstance && (
                                            <button
                                                onClick={() => {
                                                    setEditingName(activePartnerName);
                                                    setIsEditingName(true);
                                                }}
                                                className="text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                                            </button>
                                        )}
                                    </div>
                                )}

                                {activePartnerData && activeInstance ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-center md:justify-start gap-3">
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold shadow-sm
                                                ${activePartnerData.rarity === 'SSR' ? 'bg-[length:200%_200%] bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-600 text-slate-900 border-2 border-yellow-200 animate-gradient' :
                                                    activePartnerData.rarity === 'SR' ? 'bg-[length:200%_200%] bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-500 text-white border border-purple-300 animate-gradient' :
                                                        activePartnerData.rarity === 'R' ? 'bg-blue-500/30 text-blue-300 border border-blue-500/50' : 'bg-slate-700 text-slate-300 border border-slate-600'}`}>
                                                {activePartnerData.rarity}
                                            </span>
                                            <span className="text-sm font-bold text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                                                Lv.{activeInstance.level} / {getMaxLevel(activePartnerData.rarity, activeInstance.limitBreak ?? 0)}
                                            </span>
                                            {(activeInstance.limitBreak ?? 0) > 0 && (
                                                <div className="flex gap-1 ml-2">
                                                    {Array.from({ length: 5 }).map((_, i) => (
                                                        <div key={i} className={`w-2 h-2 rotate-45 transform rounded-[1px] ${i < activeInstance.limitBreak ? 'bg-rose-500 shadow-[0_0_5px_rgba(244,63,94,0.8)]' : 'bg-slate-700'}`} />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-center md:justify-start gap-4 text-sm font-bold text-slate-400">
                                            <span className="flex items-center gap-1"><Sword size={16} /> ATK {Math.floor(activePartnerData.stages[0]?.stats.atk * (1 + (activeInstance.level - 1) * 0.1))}</span>
                                            <span className="flex items-center gap-1"><Shield size={16} /> DEF {Math.floor(activePartnerData.stages[0]?.stats.def * (1 + (activeInstance.level - 1) * 0.1))}</span>
                                        </div>
                                        <p className="text-xs text-slate-500">{activePartnerData.description}</p>

                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-500">下のリストからパートナーを選択してください。</p>
                                )}
                            </div>
                        </div>

                        {/* パートナーリスト */}
                        <div>
                            <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4">
                                <h3 className="text-lg font-black text-white flex items-center gap-2">
                                    <Star className="text-amber-400" />
                                    所持パートナー一覧 ({sortedInventory.length})
                                </h3>
                                <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-lg">
                                    <button
                                        onClick={() => setSortOrder('acquired')}
                                        className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${sortOrder === 'acquired' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                                    >入手順</button>
                                    <button
                                        onClick={() => setSortOrder('rarity')}
                                        className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${sortOrder === 'rarity' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                                    >レアリティ順</button>
                                    <button
                                        onClick={() => setSortOrder('character')}
                                        className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${sortOrder === 'character' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                                    >キャラ順</button>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                                {/* 「外す」ボタン */}
                                <button
                                    onClick={() => selectPartner(null)}
                                    className={`relative p-2 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-colors min-h-[100px]
                                        ${!selectedPartnerId ? 'bg-rose-600/20 border-rose-500' : 'bg-slate-900 border-slate-800 hover:border-slate-600'}`}
                                >
                                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                                        <ArrowLeft className="text-slate-400" size={16} />
                                    </div>
                                    <span className="text-[10px] font-black text-slate-300">お供を外す</span>
                                </button>

                                {/* パートナー一覧（所持しているインスタンス） */}
                                {sortedInventory.map((instance: any) => {
                                    const p = partners.find((p: any) => p.id === instance.partnerId);
                                    if (!p) return null;
                                    const isSelected = instance.instanceId === selectedPartnerId;
                                    const stage = p.stages[0];
                                    const displayName = instance.customName || p.name;
                                    return (
                                        <button
                                            key={instance.instanceId}
                                            onClick={() => selectPartner(instance.instanceId)}
                                            className={`relative p-2 rounded-xl border flex flex-col items-center gap-1 transition-all text-left overflow-hidden group
                                                ${isSelected ? 'bg-rose-600/20 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]' : 'bg-slate-900 border-slate-800 hover:border-slate-600 hover:bg-slate-800/80'}`}
                                        >
                                            <div className="w-full aspect-square rounded-lg flex items-center justify-center bg-slate-950 p-1 mb-1 relative z-10">
                                                {stage?.imageUrl ? (
                                                    <img src={stage.imageUrl} alt={displayName} className={`w-full h-full object-contain group-hover:scale-110 transition-transform ${p.rarity === 'SSR' ? 'drop-shadow-[0_0_10px_rgba(250,204,21,0.6)]' : p.rarity === 'SR' ? 'drop-shadow-[0_0_8px_rgba(192,132,252,0.5)]' : ''}`} />
                                                ) : (
                                                    <Sparkles size={24} className="text-slate-700" />
                                                )}
                                                <div className={`absolute bottom-1 left-1 px-1 rounded text-[8px] font-black z-20
                                                    ${p.rarity === 'SSR' ? 'bg-yellow-500 text-slate-900 border border-yellow-300' :
                                                        p.rarity === 'SR' ? 'bg-purple-500 text-white border border-purple-400' :
                                                            p.rarity === 'R' ? 'bg-blue-500 text-white border border-blue-400' : 'bg-slate-700 text-slate-300 border border-slate-600'}`}>
                                                    {p.rarity}
                                                </div>
                                                <div className="absolute bottom-1 right-1 bg-black/60 px-1 rounded text-[8px] font-bold text-white z-20 flex items-center gap-1">
                                                    Lv.{instance.level}
                                                    {(instance.limitBreak ?? 0) > 0 && (
                                                        <span className="text-rose-400 flex items-center gap-[2px]">
                                                            {Array.from({ length: instance.limitBreak }).map((_, i) => (
                                                                <span key={i} className="w-[4px] h-[4px] bg-rose-500 rotate-45 transform rounded-[0.5px] inline-block shadow-[0_0_3px_rgba(244,63,94,0.8)]" />
                                                            ))}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* 背景エフェクト層 */}
                                            {p.rarity === 'SSR' && <div className="absolute inset-0 bg-yellow-500/10 pointer-events-none rounded-xl" />}
                                            {p.rarity === 'SR' && <div className="absolute inset-0 bg-purple-500/10 pointer-events-none rounded-xl" />}
                                            <div className="w-full z-20 mt-1">
                                                <div className="text-[10px] sm:text-xs font-bold text-white truncate w-full text-center">{displayName}</div>
                                            </div>
                                            {isSelected && (
                                                <div className="absolute inset-0 border-2 border-rose-500 rounded-xl pointer-events-none z-30" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                )}

                {view === 'gacha' && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-12">

                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-black text-white mb-2">不思議な卵ガチャ</h2>
                            <p className="text-slate-400">チケットを消費して新しいパートナーを見つけよう！</p>
                            <div className="mt-4 flex items-center justify-center gap-4 text-sm font-bold bg-slate-900/50 inline-flex px-4 py-2 rounded-full border border-slate-800">
                                <span className="text-slate-300">排出率:</span>
                                <span className="text-yellow-500">SSR {eggConfig.rates.SSR}%</span>
                                <span className="text-purple-400">SR {eggConfig.rates.SR}%</span>
                                <span className="text-blue-400">R {eggConfig.rates.R}%</span>
                                <span className="text-slate-500">N {eggConfig.rates.N}%</span>
                            </div>
                        </div>

                        {/* ガチャ演出エリア */}
                        <div className="w-full relative flex flex-col items-center justify-center mb-8 min-h-[250px]">
                            <AnimatePresence mode="wait">
                                {gachaResults.length === 0 && !isPulling && (
                                    <motion.div key="egg-standby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center">
                                        <div className="w-32 h-40 bg-gradient-to-br from-slate-100 to-slate-400 rounded-[50%_50%_50%_50%/60%_60%_40%_40%] shadow-[0_10px_30px_rgba(0,0,0,0.5)] border-4 border-slate-200 relative overflow-hidden flex items-center justify-center mb-4">
                                            <span className="text-5xl">🥚</span>
                                        </div>
                                    </motion.div>
                                )}

                                {isPulling && (
                                    <motion.div key="egg-shake"
                                        animate={{
                                            rotate: [0, -15, 15, -15, 15, 0],
                                            scale: [1, 1.1, 1.1, 1.1, 1]
                                        }}
                                        transition={{ duration: 1.5, ease: "easeInOut" }}
                                        className="w-32 h-40 bg-gradient-to-br from-rose-100 to-rose-400 rounded-[50%_50%_50%_50%/60%_60%_40%_40%] shadow-[0_0_40px_rgba(244,63,94,0.6)] border-4 border-white flex items-center justify-center"
                                    >
                                        <span className="text-5xl animate-pulse">🥚</span>
                                    </motion.div>
                                )}

                                {gachaResults.length > 0 && !isPulling && highlightIndex !== null && gachaResults[highlightIndex] ? (
                                    <motion.div key="highlight" initial={{ scale: 0.5, opacity: 0, rotate: -10 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} transition={{ type: "spring", damping: 12 }} className="w-full flex flex-col items-center">
                                        <div className="mb-6 flex flex-col items-center relative">
                                            <div className="absolute inset-0 bg-yellow-500/30 blur-[60px] rounded-full w-[120%] h-[120%] -translate-x-[10%] -translate-y-[10%] animate-pulse pointer-events-none" />
                                            <h3 className={`text-2xl font-black mb-6 animate-bounce
                                                ${gachaResults[highlightIndex].rarity === 'SSR' ? 'text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]' : 'text-fuchsia-400 drop-shadow-[0_0_15px_rgba(217,70,239,0.8)]'}`}>
                                                ✨ レアパートナー出現！ ✨
                                            </h3>

                                            <div className={`p-2 rounded-3xl bg-gradient-to-br shadow-2xl relative
                                                ${gachaResults[highlightIndex].rarity === 'SSR' ? 'from-yellow-300 via-yellow-500 to-amber-600 shadow-[0_0_80px_rgba(250,204,21,0.6)] animate-gradient bg-[length:200%_200%]' : 'from-fuchsia-400 via-purple-500 to-indigo-600 shadow-[0_0_60px_rgba(192,132,252,0.6)] animate-gradient bg-[length:200%_200%]'}`}>
                                                <div className="bg-slate-950 p-6 rounded-2xl flex flex-col items-center relative overflow-hidden">
                                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,transparent_70%)]" />
                                                    {gachaResults[highlightIndex].stages[0]?.imageUrl ? (
                                                        <img src={gachaResults[highlightIndex].stages[0].imageUrl} alt="Highlight" className={`w-48 h-48 md:w-64 md:h-64 object-contain relative z-10
                                                            ${gachaResults[highlightIndex].rarity === 'SSR' ? 'drop-shadow-[0_0_30px_rgba(250,204,21,1)]' : 'drop-shadow-[0_0_20px_rgba(217,70,239,1)]'}`} />
                                                    ) : (
                                                        <div className="w-48 h-48 bg-slate-800 rounded-full flex items-center justify-center text-7xl">✨</div>
                                                    )}

                                                    <div className="mt-6 flex flex-col items-center relative z-10 w-full">
                                                        <div className={`px-4 py-1 rounded-full font-black text-sm mb-2 shadow-lg border-2
                                                            ${gachaResults[highlightIndex].rarity === 'SSR' ? 'bg-gradient-to-r from-yellow-300 to-amber-600 text-slate-900 border-yellow-200' : 'bg-gradient-to-r from-purple-400 to-indigo-600 text-white border-purple-300'}`}>
                                                            {gachaResults[highlightIndex].rarity}
                                                        </div>
                                                        <h3 className="text-2xl font-black text-white px-2 text-center w-full">
                                                            {gachaResults[highlightIndex].name}
                                                        </h3>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => {
                                                const nextIdx = gachaResults.findIndex((r, idx) => idx > highlightIndex && (r.rarity === 'SSR' || r.rarity === 'SR'));
                                                if (nextIdx !== -1) {
                                                    setHighlightIndex(nextIdx);
                                                } else {
                                                    setHighlightIndex(null);
                                                    if (gachaResults.length === 1) toast.success(`${gachaResults[0].name} を仲間にした！`);
                                                    else toast.success(`${gachaResults.length}体のパートナーを仲間にした！`);
                                                }
                                            }}
                                            className="px-8 py-3 rounded-full text-lg font-bold text-white bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-600 shadow-xl"
                                        >
                                            {gachaResults.findIndex((r, idx) => idx > highlightIndex && (r.rarity === 'SSR' || r.rarity === 'SR')) !== -1 ? '次のレアへ' : '結果一覧へ'}
                                        </button>
                                    </motion.div>
                                ) : gachaResults.length > 0 && !isPulling && highlightIndex === null ? (
                                    <motion.div key="result" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", damping: 15 }} className="w-full max-w-2xl">
                                        <div className={`grid gap-4 justify-center ${gachaResults.length === 1 ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5'}`}>
                                            {gachaResults.map((result, idx) => (
                                                <motion.div
                                                    key={idx}
                                                    initial={{ opacity: 0, y: 30, scale: 0.8 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    transition={{ delay: idx * 0.15, type: "spring", damping: 12 }}
                                                    className={`text-center relative rounded-2xl p-1 bg-gradient-to-b overflow-hidden
                                                        ${result.rarity === 'SSR' ? 'from-yellow-300 via-yellow-500 to-amber-600 p-[3px] shadow-[0_0_40px_rgba(250,204,21,0.6)] animate-pulse' :
                                                            result.rarity === 'SR' ? 'from-fuchsia-400 via-purple-500 to-indigo-600 p-[2px] shadow-[0_0_20px_rgba(192,132,252,0.5)]' :
                                                                result.rarity === 'R' ? 'from-blue-400 to-indigo-500 p-[1px]' : 'from-slate-600 to-slate-800 p-[1px]'}`}
                                                    style={{ animationDuration: result.rarity === 'SSR' ? '2s' : 'auto' }}
                                                >
                                                    <div className="w-full h-full bg-slate-900 rounded-[14px] flex flex-col items-center p-2 relative">
                                                        {/* 背景 뒷광 */}
                                                        {result.rarity === 'SSR' && <div className="absolute inset-0 bg-yellow-500/20 blur-[20px] rounded-full" />}
                                                        {result.rarity === 'SR' && <div className="absolute inset-0 bg-purple-500/20 blur-[15px] rounded-full" />}

                                                        {result.stages[0]?.imageUrl ? (
                                                            <motion.img
                                                                initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ delay: idx * 0.15 + 0.2, type: 'spring' }}
                                                                src={result.stages[0].imageUrl} alt="New Partner"
                                                                className={`w-28 h-28 sm:w-32 sm:h-32 object-contain mx-auto relative z-10
                                                                    ${result.rarity === 'SSR' ? 'drop-shadow-[0_0_25px_rgba(255,255,255,0.8)]' :
                                                                        result.rarity === 'SR' ? 'drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]' : 'drop-shadow-lg'}`}
                                                            />
                                                        ) : (
                                                            <div className="w-28 h-28 bg-slate-800 rounded-full border-2 border-slate-600 flex items-center justify-center mx-auto relative z-10 text-5xl">
                                                                ✨
                                                            </div>
                                                        )}

                                                        <div className="mt-3 relative z-10 w-full">
                                                            <div className={`inline-block px-3 py-0.5 rounded-full font-black mb-1 text-[10px] sm:text-xs shadow-md border
                                                                ${result.rarity === 'SSR' ? 'bg-[length:200%_200%] bg-gradient-to-r from-yellow-300 via-yellow-500 to-amber-600 text-slate-900 border-yellow-200 animate-gradient' :
                                                                    result.rarity === 'SR' ? 'bg-[length:200%_200%] bg-gradient-to-r from-purple-400 via-fuchsia-500 to-indigo-500 text-white border-purple-300 animate-gradient' :
                                                                        result.rarity === 'R' ? 'bg-blue-500 text-white border-blue-400' : 'bg-slate-700 text-white border-slate-600'}`}>
                                                                {result.rarity}
                                                            </div>
                                                            <h3 className={`text-xs sm:text-sm font-black truncate w-full px-1
                                                                ${result.rarity === 'SSR' ? 'text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]' :
                                                                    result.rarity === 'SR' ? 'text-fuchsia-300 drop-shadow-[0_0_5px_rgba(217,70,239,0.8)]' : 'text-white'}`}>
                                                                {result.name}
                                                            </h3>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </motion.div>
                                ) : null}
                            </AnimatePresence>
                        </div>

                        {/* ガチャボタン */}
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <button
                                onClick={() => handlePullGacha(1)}
                                disabled={isPulling || highlightIndex !== null}
                                className={`group relative px-6 py-3 rounded-full font-black text-base flex items-center gap-2 overflow-hidden shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all
                                    ${isPulling || highlightIndex !== null ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-slate-800 text-white border border-slate-600 hover:border-slate-400'}`}
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    1回引く (卵 <Ticket size={16} /> {eggConfig.cost})
                                </span>
                            </button>
                            <button
                                onClick={() => handlePullGacha(10)}
                                disabled={isPulling || highlightIndex !== null}
                                className={`group relative px-8 py-4 rounded-full font-black text-lg flex items-center gap-3 overflow-hidden shadow-[0_0_20px_rgba(244,63,94,0.3)] hover:shadow-[0_0_30px_rgba(244,63,94,0.5)] hover:scale-105 active:scale-95 transition-all
                                    ${isPulling || highlightIndex !== null ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-rose-500 via-pink-500 to-orange-500 text-white border-2 border-rose-300'}`}
                            >
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
                                <span className="relative z-10 flex items-center gap-2">
                                    10連ガチャ (卵 <Ticket size={18} /> {eggConfig.cost * 10})
                                </span>
                            </button>
                        </div>
                        <p className="text-xs font-bold text-slate-500 mt-4">所持卵チケット: {eggTickets}枚</p>

                    </motion.div>
                )}

                {view === 'merge' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-black text-white">パートナー融合</h2>
                                <button
                                    onClick={() => setShowRecipeModal(true)}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/40 hover:text-white rounded-full text-xs font-bold transition-colors border border-indigo-500/30"
                                >
                                    <BookOpen size={14} />
                                    <span className="hidden sm:inline">特殊融合レシピ</span>
                                    <span className="sm:hidden">レシピ</span>
                                </button>
                            </div>
                            <p className="text-sm text-slate-400 mb-6">同じ種類のパートナーを素材にして、レベルを上げよう！</p>

                            {!mergeBaseId ? (
                                <div>
                                    <div className="flex flex-col sm:flex-row items-center justify-between mb-3 gap-2">
                                        <h3 className="text-sm font-bold text-rose-400">ベースにするパートナーを選択</h3>
                                        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-lg">
                                            <button
                                                onClick={() => setSortOrder('acquired')}
                                                className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${sortOrder === 'acquired' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                                            >入手順</button>
                                            <button
                                                onClick={() => setSortOrder('rarity')}
                                                className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${sortOrder === 'rarity' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                                            >レアリティ順</button>
                                            <button
                                                onClick={() => setSortOrder('character')}
                                                className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${sortOrder === 'character' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                                            >キャラ順</button>
                                        </div>
                                    </div>
                                    {sortedInventory.length === 0 ? (
                                        <p className="text-sm text-slate-500">パートナーを持っていません。</p>
                                    ) : (
                                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                                            {sortedInventory.map((instance: any) => {
                                                const pData = partners.find((p: any) => p.id === instance.partnerId);
                                                if (!pData) return null;
                                                return (
                                                    <button
                                                        key={`base-${instance.instanceId}`}
                                                        onClick={() => setMergeBaseId(instance.instanceId)}
                                                        className="relative p-2 rounded-xl border border-slate-700 bg-slate-800 hover:border-rose-400 flex flex-col items-center gap-1 transition-all group"
                                                    >
                                                        <div className="w-full aspect-square rounded-lg flex items-center justify-center bg-slate-950 p-1 mb-1">
                                                            {pData?.stages[0]?.imageUrl ? <img src={pData.stages[0].imageUrl} alt={pData.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform" /> : <Sparkles size={16} className="text-slate-700" />}
                                                        </div>
                                                        <div className="text-[10px] font-bold text-slate-300 flex items-center justify-center gap-1 w-full">
                                                            Lv.{instance.level}
                                                            {(instance.limitBreak ?? 0) > 0 && (
                                                                <span className="text-rose-400 flex items-center gap-[2px]">
                                                                    {Array.from({ length: instance.limitBreak }).map((_, i) => (
                                                                        <span key={i} className="w-[4px] h-[4px] bg-rose-500 rotate-45 transform rounded-[0.5px] inline-block shadow-[0_0_3px_rgba(244,63,94,0.8)]" />
                                                                    ))}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-[10px] sm:text-xs font-bold text-white truncate w-full text-center">{instance.customName || pData.name}</div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            ) : (() => {
                                const base = partnerInventory.find(i => i.instanceId === mergeBaseId);
                                const baseData = partners.find((p: any) => p.id === base?.partnerId);
                                const availableMaterials = sortedInventory.filter(i => i.instanceId !== mergeBaseId);

                                // おまかせ選択ロジック（同じキャラを優先的に上限まで選択し、その後適当なN素材を選ぶ）
                                const handleAutoSelect = () => {
                                    if (!base || !baseData) return;

                                    const currentMaxLevel = getMaxLevel(baseData.rarity, base.limitBreak || 0);
                                    let remainingLevelsNeeded = currentMaxLevel - base.level;
                                    let remainingLimitBreaksPossible = 5 - (base.limitBreak || 0);

                                    let autoSelectedIds: string[] = [];

                                    // 1. 同キャラを限界突破のために優先選択（Lv.1のみ、レベルが低い順）
                                    const sameCharMats = availableMaterials.filter(m => {
                                        const mData = partners.find((p: any) => p.id === m.partnerId);
                                        return mData?.name === baseData.name && !autoSelectedIds.includes(m.instanceId) && m.level <= 1;
                                    }).sort((a, b) => a.level - b.level);

                                    for (const mat of sameCharMats) {
                                        if (autoSelectedIds.length >= 20) break;
                                        if (remainingLimitBreaksPossible > 0 || remainingLevelsNeeded > 0) {
                                            autoSelectedIds.push(mat.instanceId);
                                            // 限界突破の見込み（ざっくり100%想定で計算）
                                            const mData = partners.find((p: any) => p.id === mat.partnerId);
                                            const diff = getRarityRank(mData?.rarity || 'N') - getRarityRank(baseData.rarity);
                                            if (diff >= 0 && remainingLimitBreaksPossible > 0) {
                                                remainingLimitBreaksPossible--;
                                                remainingLevelsNeeded++; // 上限が1上がるのでレベルアップ枠も1増える
                                            }
                                            remainingLevelsNeeded--; // 経験値としても1レベル分消費
                                        }
                                    }

                                    // 2. まだレベル上限に達していない場合、不要なNキャラ（レベルが低い順）を経験値のために選択
                                    if (remainingLevelsNeeded > 0) {
                                        const otherMats = availableMaterials.filter(m => {
                                            const mData = partners.find((p: any) => p.id === m.partnerId);
                                            // Lv.1のNキャラのみを経験値素材として選択（育成済みキャラは除外）
                                            return mData?.rarity === 'N' && !autoSelectedIds.includes(m.instanceId) && mData?.name !== baseData.name && m.level <= 1;
                                        }).sort((a, b) => a.level - b.level);

                                        for (const mat of otherMats) {
                                            if (autoSelectedIds.length >= 20) break;
                                            if (remainingLevelsNeeded > 0) {
                                                autoSelectedIds.push(mat.instanceId);
                                                remainingLevelsNeeded--;
                                            } else {
                                                break;
                                            }
                                        }
                                    }

                                    if (autoSelectedIds.length > 0) {
                                        setMergeMaterialIds(autoSelectedIds);
                                        toast.success(`おまかせで ${autoSelectedIds.length} 体の素材を選択しました！`);
                                    } else {
                                        toast.error("おまかせで選べる素材がありませんでした");
                                    }
                                };

                                let expectedLimitBreaks = 0;
                                let limitBreakChances: number[] = [];
                                let expLevels = mergeMaterialIds.length;

                                mergeMaterialIds.forEach(id => {
                                    const mat = partnerInventory.find(i => i.instanceId === id);
                                    const matData = partners.find((p: any) => p.id === mat?.partnerId);
                                    if (matData && baseData && matData.name === baseData.name && (base?.limitBreak || 0) + expectedLimitBreaks < 5) {
                                        const diff = getRarityRank(matData.rarity) - getRarityRank(baseData.rarity);
                                        if (diff >= 0) {
                                            // 同等以上のレアリティの同キャラなら100%上限突破（ダイヤ追加）
                                            expectedLimitBreaks++;
                                        } else if (diff === -1) {
                                            limitBreakChances.push(50);
                                        } else {
                                            limitBreakChances.push(30);
                                        }
                                    }
                                });

                                const currentMax = getMaxLevel(baseData?.rarity || 'N', base?.limitBreak || 0);
                                const projectedMax = getMaxLevel(baseData?.rarity || 'N', Math.min((base?.limitBreak || 0) + expectedLimitBreaks, 5));
                                const projectedLevel = Math.min((base?.level || 1) + expLevels, projectedMax);

                                return (
                                    <div className="space-y-6">
                                        <div className="flex gap-4 justify-between items-center">
                                            <button onClick={() => { setMergeBaseId(null); setMergeMaterialIds([]); }} className="text-sm font-bold text-slate-400 hover:text-white flex items-center gap-1"><ArrowLeft size={16} />ベースを選び直す</button>
                                            <div className="flex items-center gap-2">
                                                {mergeMaterialIds.length > 0 && (
                                                    <button
                                                        onClick={() => setMergeMaterialIds([])}
                                                        className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                                                    >
                                                        <X size={16} />
                                                        選択解除
                                                    </button>
                                                )}
                                                <button
                                                    onClick={handleAutoSelect}
                                                    className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg transition-colors flex items-center gap-2"
                                                >
                                                    <Sparkles size={16} />
                                                    おまかせ選択
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                                            {/* ベース表示 */}
                                            <div className="flex flex-col items-center bg-slate-800 p-4 rounded-xl border border-rose-500/50 relative min-w-[140px]">
                                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">ベース</div>
                                                <div className="w-24 h-24 mb-2">
                                                    {baseData?.stages[0]?.imageUrl ? <img src={baseData.stages[0].imageUrl} alt="Base" className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(244,63,94,0.4)]" /> : null}
                                                </div>
                                                <div className="text-sm font-black text-white">{base?.customName || baseData?.name}</div>
                                                <div className="text-xs font-bold text-slate-300 mt-1">
                                                    Lv.{base?.level || 1} <span className="text-slate-500">/</span> {currentMax}
                                                    {expLevels > 0 && <span className="text-rose-400 font-black ml-1">→ {projectedLevel}</span>}
                                                </div>
                                                <div className="flex gap-1 mt-2">
                                                    {Array.from({ length: 5 }).map((_, i) => (
                                                        <div key={i} className={`w-2 h-2 rotate-45 transform rounded-[1px] ${(base?.limitBreak || 0) > i
                                                            ? 'bg-rose-500 shadow-[0_0_5px_rgba(244,63,94,0.8)]'
                                                            : expectedLimitBreaks + (base?.limitBreak || 0) > i
                                                                ? 'bg-orange-400/80 shadow-[0_0_5px_rgba(251,146,60,0.8)] animate-pulse'
                                                                : 'bg-slate-700'
                                                            }`} />
                                                    ))}
                                                </div>
                                                {limitBreakChances.length > 0 && (
                                                    <div className="text-[10px] mt-2 font-bold text-orange-400 bg-orange-500/10 px-2 py-1 rounded w-full text-center border border-orange-500/20">
                                                        上限解放チャンス！<br />
                                                        {limitBreakChances.map((c, i) => <span key={i} className="inline-block mx-0.5 bg-orange-500 text-white px-1 rounded">{c}%</span>)}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="text-4xl text-slate-600 font-bold">+</div>

                                            {/* 素材表示プレビュー */}
                                            <div className="flex flex-col items-center bg-slate-800/50 p-4 rounded-xl border border-slate-700 border-dashed min-w-[140px]">
                                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full w-max">素材 x {mergeMaterialIds.length}</div>
                                                <div className="w-24 h-24 flex flex-wrap gap-1 items-center justify-center pt-2">
                                                    {mergeMaterialIds.map((id, idx) => {
                                                        const mat = partnerInventory.find(i => i.instanceId === id);
                                                        const mData = partners.find((p: any) => p.id === mat?.partnerId);
                                                        return idx < 4 ? <div key={id} className="w-10 h-10 bg-slate-950 rounded flex items-center justify-center border border-slate-600 relative overflow-hidden">
                                                            {mData?.stages[0]?.imageUrl && <img src={mData.stages[0].imageUrl} className="w-8 h-8 opacity-50" />}
                                                            {mData?.name === baseData?.name && <div className="absolute inset-0 border-2 border-orange-500/50 rounded pointer-events-none" />}
                                                        </div> : null;
                                                    })}
                                                    {mergeMaterialIds.length > 4 && <div className="text-xs text-slate-400 font-bold">+{mergeMaterialIds.length - 4}</div>}
                                                    {mergeMaterialIds.length === 0 && <span className="text-xs text-slate-500 text-center">素材未選択</span>}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-center">
                                            <button
                                                disabled={mergeMaterialIds.length === 0}
                                                onClick={() => {
                                                    if (mergeBaseId && mergeMaterialIds.length > 0) {
                                                        const allInstances = [base, ...mergeMaterialIds.map(id => partnerInventory.find(i => i.instanceId === id))].filter(Boolean) as any[];
                                                        const areAllMax = allInstances.every(inst => {
                                                            const data = partners.find((p: any) => p.id === inst.partnerId);
                                                            if (!data) return false;
                                                            return inst.level === getMaxLevel(data.rarity, inst.limitBreak || 0) && (inst.limitBreak || 0) === 5;
                                                        });

                                                        const countIds = (id: string) => allInstances.filter(inst => inst.partnerId === id).length;
                                                        let evolutionTargetId: string | null = null;
                                                        let requiredRecipeId: string | null = null;

                                                        if (areAllMax) {
                                                            if (countIds('11') === 2 && countIds('12') === 2 && allInstances.length === 4) {
                                                                evolutionTargetId = '13';
                                                                requiredRecipeId = 'recipe_earth_titan';
                                                            }
                                                            if (countIds('8') === 1 && countIds('9') === 1 && countIds('10') === 1 && allInstances.length === 3) {
                                                                evolutionTargetId = '14';
                                                                requiredRecipeId = 'recipe_yin_yang_beast';
                                                            }
                                                            if (countIds('5') === 1 && countIds('6') === 1 && countIds('7') === 1 && allInstances.length === 3) {
                                                                evolutionTargetId = '15';
                                                                requiredRecipeId = 'recipe_elemental_king';
                                                            }
                                                        }

                                                        if (evolutionTargetId && requiredRecipeId) {
                                                            // レシピ所持判定 (Inventoryのequipmentを見る、もしくはstoreに追加済みのレシピ配列を見るなど)
                                                            // 今回はアイテム（equipment）の所持判定が useGamificationStore() の inventory (string[]) で管理されていると推測
                                                            const storeInventory = useGamificationStore.getState().inventory || [];
                                                            const hasRecipe = storeInventory.includes(requiredRecipeId);

                                                            if (!hasRecipe) {
                                                                // レシピ名と進化先情報を特定
                                                                const evoData = partners.find((p: any) => p.id === evolutionTargetId);
                                                                const recipeNames: Record<string, string> = {
                                                                    'recipe_earth_titan': '大地の巨神の秘伝書',
                                                                    'recipe_yin_yang_beast': '陰陽の獣の秘伝書',
                                                                    'recipe_elemental_king': '虹の精霊王の秘伝書',
                                                                };
                                                                setMissingRecipeInfo({
                                                                    recipeName: recipeNames[requiredRecipeId] || requiredRecipeId,
                                                                    evolutionName: evoData?.name || '',
                                                                    evolutionImageUrl: evoData?.stages[0]?.imageUrl || '',
                                                                });
                                                                return;
                                                            }

                                                            evolvePartner(mergeBaseId, mergeMaterialIds, evolutionTargetId);
                                                            const evoData = partners.find((p: any) => p.id === evolutionTargetId);
                                                            setMergeResult({
                                                                name: base?.customName || baseData?.name || '',
                                                                imageUrl: baseData?.stages[0]?.imageUrl || '',
                                                                rarity: evoData?.rarity || 'SSR',
                                                                beforeLevel: base?.level || 1,
                                                                afterLevel: 1,
                                                                beforeLimitBreak: base?.limitBreak || 0,
                                                                afterLimitBreak: 0,
                                                                materialCount: mergeMaterialIds.length,
                                                                isEvolution: true,
                                                                evolutionName: evoData?.name || '',
                                                                evolutionImageUrl: evoData?.stages[0]?.imageUrl || '',
                                                            });
                                                            setMergeBaseId(null);
                                                            setMergeMaterialIds([]);
                                                            return;
                                                        }

                                                        // ベースが完全MAX（レベル＆限界突破5）なら通常融合は不可
                                                        const baseMaxLevel = getMaxLevel(baseData?.rarity || 'N', base?.limitBreak || 0);
                                                        if ((base?.level || 1) >= baseMaxLevel && (base?.limitBreak || 0) >= 5) {
                                                            toast.error('このパートナーはレベル・限界突破ともにMAXです。これ以上強化できません。', { icon: '⚠️', duration: 4000 });
                                                            return;
                                                        }

                                                        // 通常融合の処理
                                                        let actualAddedLimitBreak = 0;
                                                        limitBreakChances.forEach(prob => {
                                                            if ((base?.limitBreak || 0) + expectedLimitBreaks + actualAddedLimitBreak < 5) {
                                                                if (Math.random() * 100 <= prob) actualAddedLimitBreak++;
                                                            }
                                                        });

                                                        // 100%の限界突破（同キャラ合成）は確実に加算
                                                        actualAddedLimitBreak += expectedLimitBreaks;
                                                        if ((base?.limitBreak || 0) + actualAddedLimitBreak > 5) {
                                                            actualAddedLimitBreak = 5 - (base?.limitBreak || 0);
                                                        }

                                                        const actualMax = getMaxLevel(baseData?.rarity || 'N', (base?.limitBreak || 0) + actualAddedLimitBreak);
                                                        const rawExpectedLevel = (base?.level || 1) + expLevels;
                                                        const actualFinalLevel = Math.min(rawExpectedLevel, actualMax);
                                                        const actualAddedLevel = Math.max(0, actualFinalLevel - (base?.level || 1));

                                                        mergePartners(mergeBaseId, mergeMaterialIds, actualAddedLevel, actualAddedLimitBreak);

                                                        setMergeResult({
                                                            name: base?.customName || baseData?.name || '',
                                                            imageUrl: baseData?.stages[0]?.imageUrl || '',
                                                            rarity: baseData?.rarity || 'N',
                                                            beforeLevel: base?.level || 1,
                                                            afterLevel: (base?.level || 1) + actualAddedLevel,
                                                            beforeLimitBreak: base?.limitBreak || 0,
                                                            afterLimitBreak: (base?.limitBreak || 0) + actualAddedLimitBreak,
                                                            materialCount: mergeMaterialIds.length,
                                                        });

                                                        setMergeBaseId(null);
                                                        setMergeMaterialIds([]);
                                                        if (selectedPartnerId && mergeMaterialIds.includes(selectedPartnerId)) {
                                                            selectPartner(mergeBaseId);
                                                        }
                                                    }
                                                }}
                                                className={`px-8 py-3 rounded-full font-black shadow-lg transition-all ${mergeMaterialIds.length > 0 ? 'bg-gradient-to-r from-rose-500 to-orange-500 text-white hover:scale-105 active:scale-95' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
                                            >
                                                融合する
                                            </button>
                                        </div>

                                        <hr className="border-slate-800" />

                                        <div>
                                            <div className="flex flex-col sm:flex-row items-center justify-between mb-3 gap-2">
                                                <h3 className="text-sm font-bold text-rose-400">素材にするパートナーを選択</h3>
                                                <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-lg">
                                                    <button
                                                        onClick={() => setSortOrder('acquired')}
                                                        className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${sortOrder === 'acquired' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                                                    >入手順</button>
                                                    <button
                                                        onClick={() => setSortOrder('rarity')}
                                                        className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${sortOrder === 'rarity' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                                                    >レアリティ順</button>
                                                    <button
                                                        onClick={() => setSortOrder('character')}
                                                        className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${sortOrder === 'character' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                                                    >キャラ順</button>
                                                </div>
                                            </div>
                                            {availableMaterials.length === 0 ? (
                                                <p className="text-sm text-slate-500">素材にできるパートナーがいません。</p>
                                            ) : (
                                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                                                    {availableMaterials.map((instance: any) => {
                                                        const pData = partners.find((p: any) => p.id === instance.partnerId);
                                                        const isSelected = mergeMaterialIds.includes(instance.instanceId);
                                                        return (
                                                            <button
                                                                key={`mat-${instance.instanceId}`}
                                                                onClick={() => {
                                                                    setMergeMaterialIds(prev => {
                                                                        if (!isSelected && prev.length >= 20) {
                                                                            toast.error("1回で選択できる素材は20体までです");
                                                                            return prev;
                                                                        }
                                                                        return isSelected ? prev.filter(id => id !== instance.instanceId) : [...prev, instance.instanceId];
                                                                    });
                                                                }}
                                                                className={`relative p-2 rounded-xl border flex flex-col items-center gap-1 transition-all
                                                                    ${isSelected ? 'bg-rose-900/30 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]' : 'border-slate-700 bg-slate-800 hover:border-slate-500'}`}
                                                            >
                                                                <div className="w-full aspect-square rounded-lg flex items-center justify-center bg-slate-950 p-1 mb-1 relative overflow-hidden">
                                                                    {pData?.stages[0]?.imageUrl ? <img src={pData.stages[0].imageUrl} alt="" className={`w-full h-full object-contain ${isSelected ? 'opacity-50' : ''}`} /> : <Sparkles size={16} className="text-slate-700" />}
                                                                    {pData?.name === baseData?.name && <div className="absolute top-0 right-0 bg-orange-500 text-white text-[8px] font-black px-1 rounded-bl-lg">同キャラ</div>}
                                                                </div>
                                                                <div className="text-[10px] font-bold text-slate-300 flex items-center justify-center gap-1 w-full">
                                                                    Lv.{instance.level}
                                                                    {(instance.limitBreak ?? 0) > 0 && (
                                                                        <span className="text-rose-400 flex items-center gap-[2px]">
                                                                            {Array.from({ length: instance.limitBreak }).map((_: any, i: number) => (
                                                                                <span key={i} className="w-[4px] h-[4px] bg-rose-500 rotate-45 transform rounded-[0.5px] inline-block shadow-[0_0_3px_rgba(244,63,94,0.8)]" />
                                                                            ))}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {isSelected && <div className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center font-black text-xs z-10">✓</div>}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </motion.div>
                )}

                {view === 'convert' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                            <h2 className="text-xl font-black text-rose-400 mb-4 flex items-center gap-2">
                                <Sparkles size={20} />
                                お別れ（ガチャのかけらへ変換）
                            </h2>
                            <p className="text-sm text-slate-400 mb-6">
                                お別れしたパートナーは「ガチャのかけら」に変換されます。<br />
                                <span className="text-pink-300 font-bold">かけら5個で卵チケット1枚</span>になります。（N:1個, R:2個, SR:5個, SSR:10個）<br />
                                <span className="text-rose-500 font-bold">※変換したパートナーは戻ってきません。慎重に選んでください。</span>
                            </p>

                            <div className="flex flex-col md:flex-row gap-6 mb-8">
                                <div className="flex-1">
                                    <div className="flex flex-col sm:flex-row items-center justify-between mb-3 gap-2">
                                        <h3 className="text-sm font-bold text-slate-400">パートナー一覧</h3>
                                        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-lg">
                                            <button
                                                onClick={() => setSortOrder('acquired')}
                                                className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${sortOrder === 'acquired' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                                            >入手順</button>
                                            <button
                                                onClick={() => setSortOrder('rarity')}
                                                className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${sortOrder === 'rarity' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                                            >レアリティ順</button>
                                            <button
                                                onClick={() => setSortOrder('character')}
                                                className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${sortOrder === 'character' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                                            >キャラ順</button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-3 h-96 overflow-y-auto pr-2 custom-scrollbar">
                                        {sortedInventory.map((instance: any) => {
                                            const pData = partners.find((p: any) => p.id === instance.partnerId);
                                            const isSelected = convertIds.includes(instance.instanceId);
                                            const isCurrentPartner = instance.instanceId === selectedPartnerId;

                                            return (
                                                <button
                                                    key={`conv-${instance.instanceId}`}
                                                    onClick={() => {
                                                        if (isCurrentPartner) {
                                                            toast.error("現在編成中のお供はお別れできません");
                                                            return;
                                                        }
                                                        setConvertIds(prev =>
                                                            prev.includes(instance.instanceId) ? prev.filter(id => id !== instance.instanceId) : [...prev, instance.instanceId]
                                                        );
                                                    }}
                                                    className={`relative p-2 rounded-xl border flex flex-col items-center gap-1 transition-all h-max
                                                        ${isCurrentPartner ? 'opacity-30 cursor-not-allowed border-slate-800 bg-slate-900' :
                                                            isSelected ? 'bg-rose-900/40 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]' : 'border-slate-700 bg-slate-800 hover:border-slate-500'}`}
                                                >
                                                    <div className="w-full aspect-square rounded-lg flex items-center justify-center bg-slate-950 p-1 mb-1 relative overflow-hidden">
                                                        {pData?.stages[0]?.imageUrl ? <img src={pData.stages[0].imageUrl} alt="" className={`w-full h-full object-contain ${isSelected ? 'opacity-50' : ''}`} /> : <Sparkles size={16} className="text-slate-700" />}
                                                    </div>
                                                    <div className={`px-1 rounded text-[8px] font-black
                                                        ${pData?.rarity === 'SSR' ? 'bg-gradient-to-r from-yellow-300 to-amber-500 text-slate-900' :
                                                            pData?.rarity === 'SR' ? 'bg-gradient-to-r from-purple-400 to-indigo-500 text-white' :
                                                                pData?.rarity === 'R' ? 'bg-blue-500/50 text-blue-200' :
                                                                    'bg-slate-700 text-slate-300'}`}>
                                                        {pData?.rarity}
                                                    </div>
                                                    <div className="text-[10px] font-bold text-slate-300 flex items-center justify-center gap-1 w-full px-1">
                                                        Lv.{instance.level}
                                                        {(instance.limitBreak ?? 0) > 0 && (
                                                            <span className="text-rose-400 flex items-center gap-[2px]">
                                                                {Array.from({ length: instance.limitBreak }).map((_, i) => (
                                                                    <span key={i} className="w-[4px] h-[4px] bg-rose-500 rotate-45 transform rounded-[0.5px] inline-block shadow-[0_0_3px_rgba(244,63,94,0.8)]" />
                                                                ))}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {isCurrentPartner && <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center text-xs font-black text-rose-500">編成中</div>}
                                                    {isSelected && <div className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center font-black text-xs z-10">✓</div>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="w-full md:w-64 shrink-0 flex flex-col gap-4">
                                    <div className="bg-slate-950 p-4 rounded-xl border border-rose-500/30">
                                        <h3 className="text-sm font-bold text-slate-300 mb-4 border-b border-slate-800 pb-2">変換予定</h3>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs text-slate-400">選択中</span>
                                            <span className="text-lg font-black text-white">{convertIds.length} <span className="text-xs text-slate-500">体</span></span>
                                        </div>
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-xs text-slate-400">獲得かけら</span>
                                            <span className="text-xl font-black text-pink-400">+ {
                                                convertIds.reduce((sum, id) => {
                                                    const inst = partnerInventory.find(i => i.instanceId === id);
                                                    const pData = partners.find((p: any) => p.id === inst?.partnerId);
                                                    const rarityKey = (pData?.rarity as string) || 'N';
                                                    const v = ({ SSR: 10, SR: 5, R: 2, N: 1 } as Record<string, number>)[rarityKey] || 1;
                                                    return sum + v;
                                                }, 0)
                                            } <span className="text-xs text-slate-500">個</span></span>
                                        </div>

                                        <button
                                            disabled={convertIds.length === 0}
                                            onClick={() => setShowConvertConfirm(true)}
                                            className={`w-full py-3 rounded-xl font-black shadow-lg transition-all ${convertIds.length > 0 ? 'bg-rose-600 text-white hover:bg-rose-500 active:scale-95' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
                                        >
                                            お別れする
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* お別れ確認モーダル */}
                <AnimatePresence>
                    {showConvertConfirm && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                            onClick={() => setShowConvertConfirm(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-slate-900 border border-rose-500/50 p-6 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto"
                            >
                                <h2 className="text-xl font-black text-rose-400 mb-2 flex items-center gap-2">
                                    ⚠️ 本当にお別れしますか？
                                </h2>
                                <p className="text-sm text-slate-400 mb-4">以下のパートナーは「ガチャのかけら」に変換されます。<span className="text-rose-400 font-bold">この操作は取り消せません。</span></p>

                                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 mb-6">
                                    {convertIds.map(id => {
                                        const inst = partnerInventory.find(i => i.instanceId === id);
                                        const pData = partners.find((p: any) => p.id === inst?.partnerId);
                                        return (
                                            <div key={id} className="flex flex-col items-center bg-slate-800 p-2 rounded-lg border border-slate-700">
                                                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-slate-950 p-1 mb-1">
                                                    {pData?.stages[0]?.imageUrl ? <img src={pData.stages[0].imageUrl} alt="" className="w-full h-full object-contain" /> : <Sparkles size={12} className="text-slate-700" />}
                                                </div>
                                                <div className={`px-1 rounded text-[7px] font-black mb-0.5
                                                    ${pData?.rarity === 'SSR' ? 'bg-gradient-to-r from-yellow-300 to-amber-500 text-slate-900' :
                                                        pData?.rarity === 'SR' ? 'bg-gradient-to-r from-purple-400 to-indigo-500 text-white' :
                                                            pData?.rarity === 'R' ? 'bg-blue-500/50 text-blue-200' :
                                                                'bg-slate-700 text-slate-300'}`}>
                                                    {pData?.rarity}
                                                </div>
                                                <div className="text-[9px] font-bold text-slate-300 truncate w-full text-center">{inst?.customName || pData?.name}</div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="bg-slate-950 rounded-lg p-3 mb-6 border border-slate-800">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-400">合計獲得かけら</span>
                                        <span className="text-lg font-black text-pink-400">+ {
                                            convertIds.reduce((sum, id) => {
                                                const inst = partnerInventory.find(i => i.instanceId === id);
                                                const pData = partners.find((p: any) => p.id === inst?.partnerId);
                                                const rarityKey = (pData?.rarity as string) || 'N';
                                                const v = ({ SSR: 10, SR: 5, R: 2, N: 1 } as Record<string, number>)[rarityKey] || 1;
                                                return sum + v;
                                            }, 0)
                                        } 個</span>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowConvertConfirm(false)}
                                        className="flex-1 py-3 rounded-xl font-black bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
                                    >
                                        キャンセル
                                    </button>
                                    <button
                                        onClick={() => {
                                            const materials = convertIds.map(id => {
                                                const inst = partnerInventory.find(i => i.instanceId === id);
                                                const pData = partners.find((p: any) => p.id === inst?.partnerId);
                                                return { instanceId: id, rarity: pData?.rarity || 'N' };
                                            });
                                            convertPartnersToFragments(materials);
                                            toast.success(`${convertIds.length}体とお別れしました。`);
                                            setConvertIds([]);
                                            setShowConvertConfirm(false);
                                        }}
                                        className="flex-1 py-3 rounded-xl font-black bg-rose-600 text-white hover:bg-rose-500 active:scale-95 transition-all shadow-lg"
                                    >
                                        お別れする
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* レシピ不足モーダル */}
                <AnimatePresence>
                    {missingRecipeInfo && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                            onClick={() => setMissingRecipeInfo(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-slate-900 border border-amber-500/40 p-6 rounded-2xl shadow-2xl w-full max-w-sm text-center"
                            >
                                <div className="text-4xl mb-3">📖</div>
                                <h2 className="text-xl font-black text-amber-400 mb-2">レシピが必要です</h2>
                                <p className="text-sm text-slate-400 mb-4">この特殊進化を行うには<br />専用のレシピアイテムが必要です。</p>

                                {missingRecipeInfo.evolutionImageUrl && (
                                    <div className="w-20 h-20 mx-auto mb-3 opacity-40">
                                        <img src={missingRecipeInfo.evolutionImageUrl} className="w-full h-full object-contain" />
                                    </div>
                                )}

                                <div className="bg-slate-800 rounded-lg p-3 mb-4 border border-slate-700">
                                    <div className="text-xs text-slate-500 mb-1">必要なレシピ</div>
                                    <div className="text-base font-black text-amber-300">{missingRecipeInfo.recipeName}</div>
                                    <div className="text-xs text-slate-400 mt-1">→ {missingRecipeInfo.evolutionName} に進化</div>
                                </div>

                                <p className="text-xs text-slate-500 mb-4">
                                    💡 レシピは<span className="text-indigo-400 font-bold">アイテムガチャ</span>から入手できます！
                                </p>

                                <button
                                    onClick={() => setMissingRecipeInfo(null)}
                                    className="w-full py-3 rounded-xl font-black bg-slate-700 text-white hover:bg-slate-600 active:scale-95 transition-all"
                                >
                                    閉じる
                                </button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 融合結果モーダル */}
                <AnimatePresence>
                    {mergeResult && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
                            onClick={() => setMergeResult(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0, y: 30 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.8, opacity: 0, y: 30 }}
                                transition={{ type: 'spring', duration: 0.6 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/40 p-6 rounded-2xl shadow-[0_0_40px_rgba(245,158,11,0.15)] w-full max-w-md"
                            >
                                {mergeResult.isEvolution ? (
                                    /* 特殊進化結果 */
                                    <div className="text-center">
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                                            className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-500 mb-4"
                                        >
                                            ✨ 特別な進化！ ✨
                                        </motion.div>
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.4 }}
                                            className="mb-4"
                                        >
                                            <div className="w-32 h-32 mx-auto mb-3 relative">
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                                                    className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-500/20 via-amber-500/20 to-orange-500/20"
                                                />
                                                {mergeResult.evolutionImageUrl && <img src={mergeResult.evolutionImageUrl} className="w-full h-full object-contain relative z-10 drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]" />}
                                            </div>
                                            <div className="text-2xl font-black text-white mb-1">{mergeResult.evolutionName}</div>
                                            <div className="inline-block px-2 py-0.5 rounded text-xs font-black bg-gradient-to-r from-yellow-300 to-amber-500 text-slate-900">
                                                {mergeResult.rarity}
                                            </div>
                                        </motion.div>
                                        <p className="text-sm text-slate-400 mb-6">{mergeResult.materialCount + 1}体の素材から誕生しました！</p>
                                    </div>
                                ) : (
                                    /* 通常融合結果 */
                                    <div className="text-center">
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                                            className="text-2xl font-black text-amber-400 mb-4"
                                        >
                                            🔥 融合完了！
                                        </motion.div>
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 }}
                                        >
                                            <div className="w-24 h-24 mx-auto mb-3">
                                                {mergeResult.imageUrl && <img src={mergeResult.imageUrl} className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(244,63,94,0.4)]" />}
                                            </div>
                                            <div className="text-xl font-black text-white mb-3">{mergeResult.name}</div>
                                        </motion.div>

                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.5 }}
                                            className="bg-slate-800/80 rounded-xl p-4 mb-4 space-y-3"
                                        >
                                            {/* レベル変化 */}
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-slate-400 font-bold">レベル</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg font-black text-slate-400">Lv.{mergeResult.beforeLevel}</span>
                                                    <span className="text-amber-400 font-black">→</span>
                                                    <span className="text-lg font-black text-amber-400">Lv.{mergeResult.afterLevel}</span>
                                                    {mergeResult.afterLevel > mergeResult.beforeLevel && (
                                                        <span className="text-xs font-bold text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded">+{mergeResult.afterLevel - mergeResult.beforeLevel}</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* 限界突破変化 */}
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-slate-400 font-bold">上限解放</span>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex gap-0.5">
                                                        {Array.from({ length: 5 }).map((_, i) => (
                                                            <div key={`before-${i}`} className={`w-2.5 h-2.5 rotate-45 transform rounded-[1px] ${mergeResult.beforeLimitBreak > i ? 'bg-rose-500 shadow-[0_0_4px_rgba(244,63,94,0.8)]' : 'bg-slate-700'}`} />
                                                        ))}
                                                    </div>
                                                    <span className="text-amber-400 font-black">→</span>
                                                    <div className="flex gap-0.5">
                                                        {Array.from({ length: 5 }).map((_, i) => (
                                                            <div key={`after-${i}`} className={`w-2.5 h-2.5 rotate-45 transform rounded-[1px] ${mergeResult.afterLimitBreak > i
                                                                ? mergeResult.beforeLimitBreak > i
                                                                    ? 'bg-rose-500 shadow-[0_0_4px_rgba(244,63,94,0.8)]'
                                                                    : 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)] animate-pulse'
                                                                : 'bg-slate-700'}`} />
                                                        ))}
                                                    </div>
                                                    {mergeResult.afterLimitBreak > mergeResult.beforeLimitBreak && (
                                                        <span className="text-xs font-bold text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded">+{mergeResult.afterLimitBreak - mergeResult.beforeLimitBreak}</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="text-xs text-slate-500 pt-1 border-t border-slate-700">
                                                素材 {mergeResult.materialCount}体を消費しました
                                            </div>
                                        </motion.div>
                                    </div>
                                )}

                                <button
                                    onClick={() => setMergeResult(null)}
                                    className="w-full py-3 rounded-xl font-black bg-amber-600 text-white hover:bg-amber-500 active:scale-95 transition-all shadow-lg"
                                >
                                    OK
                                </button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {showRecipeModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                            onClick={() => setShowRecipeModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-slate-900 border border-slate-700 p-6 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
                            >
                                <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
                                    <h2 className="text-2xl font-black text-white flex items-center gap-2">
                                        <BookOpen className="text-indigo-400" />
                                        特殊融合レシピ
                                    </h2>
                                    <button
                                        onClick={() => setShowRecipeModal(false)}
                                        className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <p className="text-sm text-slate-300 mb-6">特定のパートナーを「<span className="text-rose-400 font-bold">レベルMAX</span>」かつ「<span className="text-rose-400 font-bold">限界突破MAX (◆×5)</span>」まで育てて融合させると、新たな強力なパートナーに進化します！ただし、<span className="text-indigo-300 font-bold">進化には対応する「秘伝書」を所持している必要</span>があります。</p>

                                <div className="space-y-6">
                                    {/* 大地の巨神 */}
                                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex flex-col md:flex-row items-center gap-4 relative">
                                        {!useGamificationStore.getState().inventory.includes('recipe_earth_titan') && (
                                            <div className="absolute top-2 right-2 bg-slate-900/90 text-slate-400 text-xs font-bold px-2 py-1 rounded border border-slate-700 flex items-center gap-1 z-10">
                                                <Lock size={12} /> 未所持
                                            </div>
                                        )}
                                        {useGamificationStore.getState().inventory.includes('recipe_earth_titan') && (
                                            <div className="absolute top-2 right-2 bg-indigo-900/90 text-indigo-300 text-xs font-bold px-2 py-1 rounded border border-indigo-500/30 flex items-center gap-1 z-10">
                                                <BookOpen size={12} /> 所持済み
                                            </div>
                                        )}
                                        <div className="flex-1 w-full grid grid-cols-2 gap-2">
                                            <div className="bg-slate-900 p-2 rounded border border-slate-700 flex flex-col items-center text-center">
                                                <img src="/images/partner/rock.png" className="w-10 h-10 mb-1" />
                                                <span className="text-[10px] text-slate-300">岩のゴーレム(N)</span>
                                                <span className="text-[10px] text-rose-400 font-bold">Lv.Max×<span className="text-sm">2</span></span>
                                            </div>
                                            <div className="bg-slate-900 p-2 rounded border border-slate-700 flex flex-col items-center text-center">
                                                <img src="/images/partner/soil.png" className="w-10 h-10 mb-1" />
                                                <span className="text-[10px] text-slate-300">土のスピリット(N)</span>
                                                <span className="text-[10px] text-rose-400 font-bold">Lv.Max×<span className="text-sm">2</span></span>
                                            </div>
                                        </div>
                                        <div className="text-slate-500 hidden md:block"><ChevronRight size={24} /></div>
                                        <div className="text-slate-500 md:hidden"><ArrowDown size={24} /></div>
                                        <div className="flex-1 w-full bg-indigo-900/30 border border-indigo-500/50 p-2 rounded-xl flex items-center justify-center gap-4">
                                            <img src="/images/partner/earth_titan.png" className="w-16 h-16 drop-shadow-xl" />
                                            <div>
                                                <div className="text-xs text-indigo-300 font-bold">進化先</div>
                                                <div className="text-lg font-black text-white leading-tight">大地の巨神 <span className="text-xs text-amber-400 font-normal border border-amber-400/50 px-1 rounded ml-1">SR</span></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 陰陽の獣 */}
                                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex flex-col md:flex-row items-center gap-4 relative">
                                        {!useGamificationStore.getState().inventory.includes('recipe_yin_yang_beast') && (
                                            <div className="absolute top-2 right-2 bg-slate-900/90 text-slate-400 text-xs font-bold px-2 py-1 rounded border border-slate-700 flex items-center gap-1 z-10">
                                                <Lock size={12} /> 未所持
                                            </div>
                                        )}
                                        {useGamificationStore.getState().inventory.includes('recipe_yin_yang_beast') && (
                                            <div className="absolute top-2 right-2 bg-indigo-900/90 text-indigo-300 text-xs font-bold px-2 py-1 rounded border border-indigo-500/30 flex items-center gap-1 z-10">
                                                <BookOpen size={12} /> 所持済み
                                            </div>
                                        )}
                                        <div className="flex-1 w-full grid grid-cols-3 gap-2">
                                            <div className="bg-slate-900 p-2 rounded border border-slate-700 flex flex-col items-center text-center">
                                                <img src="/images/partner/white.png" className="w-10 h-10 mb-1" />
                                                <span className="text-[10px] text-slate-300">白の聖獣(R)</span>
                                                <span className="text-[10px] text-rose-400 font-bold">Lv.Max×<span className="text-sm">1</span></span>
                                            </div>
                                            <div className="bg-slate-900 p-2 rounded border border-slate-700 flex flex-col items-center text-center">
                                                <img src="/images/partner/black.png" className="w-10 h-10 mb-1" />
                                                <span className="text-[10px] text-slate-300">黒の幻獣(R)</span>
                                                <span className="text-[10px] text-rose-400 font-bold">Lv.Max×<span className="text-sm">1</span></span>
                                            </div>
                                            <div className="bg-slate-900 p-2 rounded border border-slate-700 flex flex-col items-center text-center">
                                                <img src="/images/partner/purple.png" className="w-10 h-10 mb-1" />
                                                <span className="text-[10px] text-slate-300">紫の魔獣(R)</span>
                                                <span className="text-[10px] text-rose-400 font-bold">Lv.Max×<span className="text-sm">1</span></span>
                                            </div>
                                        </div>
                                        <div className="text-slate-500 hidden md:block"><ChevronRight size={24} /></div>
                                        <div className="text-slate-500 md:hidden"><ArrowDown size={24} /></div>
                                        <div className="flex-1 w-full bg-indigo-900/30 border border-indigo-500/50 p-2 rounded-xl flex items-center justify-center gap-4">
                                            <img src="/images/partner/yin_yang_beast.png" className="w-16 h-16 drop-shadow-xl" />
                                            <div>
                                                <div className="text-xs text-indigo-300 font-bold">進化先</div>
                                                <div className="text-lg font-black text-white leading-tight">陰陽の獣 <span className="text-xs text-amber-400 font-normal border border-amber-400/50 px-1 rounded ml-1">SR</span></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 虹の精霊王 */}
                                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex flex-col md:flex-row items-center gap-4 relative">
                                        {!useGamificationStore.getState().inventory.includes('recipe_elemental_king') && (
                                            <div className="absolute top-2 right-2 bg-slate-900/90 text-slate-400 text-xs font-bold px-2 py-1 rounded border border-slate-700 flex items-center gap-1 z-10">
                                                <Lock size={12} /> 未所持
                                            </div>
                                        )}
                                        {useGamificationStore.getState().inventory.includes('recipe_elemental_king') && (
                                            <div className="absolute top-2 right-2 bg-rose-900/90 text-rose-300 text-xs font-bold px-2 py-1 rounded border border-rose-500/30 flex items-center gap-1 z-10">
                                                <BookOpen size={12} /> 所持済み
                                            </div>
                                        )}
                                        <div className="flex-1 w-full grid grid-cols-3 gap-2">
                                            <div className="bg-slate-900 p-2 rounded border border-slate-700 flex flex-col items-center text-center">
                                                <img src="/images/partner/red.png" className="w-10 h-10 mb-1" />
                                                <span className="text-[10px] text-slate-300">赤の精霊(SR)</span>
                                                <span className="text-[10px] text-rose-400 font-bold">Lv.Max×<span className="text-sm">1</span></span>
                                            </div>
                                            <div className="bg-slate-900 p-2 rounded border border-slate-700 flex flex-col items-center text-center">
                                                <img src="/images/partner/blue.png" className="w-10 h-10 mb-1" />
                                                <span className="text-[10px] text-slate-300">青の精霊(SR)</span>
                                                <span className="text-[10px] text-rose-400 font-bold">Lv.Max×<span className="text-sm">1</span></span>
                                            </div>
                                            <div className="bg-slate-900 p-2 rounded border border-slate-700 flex flex-col items-center text-center">
                                                <img src="/images/partner/green.png" className="w-10 h-10 mb-1" />
                                                <span className="text-[10px] text-slate-300">緑の精霊(SR)</span>
                                                <span className="text-[10px] text-rose-400 font-bold">Lv.Max×<span className="text-sm">1</span></span>
                                            </div>
                                        </div>
                                        <div className="text-slate-500 hidden md:block"><ChevronRight size={24} /></div>
                                        <div className="text-slate-500 md:hidden"><ArrowDown size={24} /></div>
                                        <div className="flex-1 w-full bg-rose-900/30 border border-rose-500/50 p-2 rounded-xl flex items-center justify-center gap-4">
                                            <img src="/images/partner/elemental_king.png" className="w-16 h-16 drop-shadow-xl" />
                                            <div>
                                                <div className="text-xs text-rose-300 font-bold">進化先</div>
                                                <div className="text-lg font-black text-white leading-tight">虹の精霊王 <span className="text-xs text-yellow-300 font-normal border border-yellow-300/50 px-1 rounded ml-1">SSR</span></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-center mt-8">
                                        <button onClick={() => setShowRecipeModal(false)} className="px-8 py-3 bg-slate-700 hover:bg-slate-600 rounded-full text-white font-bold transition-colors">
                                            閉じる
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div >
    );
}
