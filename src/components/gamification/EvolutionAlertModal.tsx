"use client";

import React, { useEffect, useState } from 'react';
import { useGamificationStore } from '@/store/useGamificationStore';
import { CHARACTER_DATA, getStatsForLevel } from './characterData';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Shield } from 'lucide-react';

export function EvolutionAlertModal() {
    const { isEvolutionReady, clearEvolutionReady, selectedCharacterId, level } = useGamificationStore();
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (isEvolutionReady && selectedCharacterId) {
            setShow(true);
        }
    }, [isEvolutionReady, selectedCharacterId]);

    const handleClose = () => {
        setShow(false);
        // 少し遅延させてストアのフラグを下げる（アニメーション用）
        setTimeout(() => clearEvolutionReady(), 300);
    };

    if (!selectedCharacterId) return null;

    const characterInfo = CHARACTER_DATA[selectedCharacterId as keyof typeof CHARACTER_DATA];
    if (!characterInfo) return null;

    // 現在のレベルに対応するステージの情報
    const currentStage = characterInfo.stages.slice().reverse().find(s => level >= s.level) || characterInfo.stages[0];

    // 進化前のステージ（レベル5の時はレベル1のステージ等）
    const previousStageIndex = characterInfo.stages.findIndex(s => s.level === currentStage.level) - 1;
    const previousStage = previousStageIndex >= 0 ? characterInfo.stages[previousStageIndex] : characterInfo.stages[0];

    // ステータスの比較用
    const currentStats = getStatsForLevel(selectedCharacterId, level);
    const previousLevel = currentStage.level === 5 ? 4 : currentStage.level === 10 ? 9 : Math.max(1, level - 1);
    const previousStats = getStatsForLevel(selectedCharacterId, previousLevel);

    return (
        <AnimatePresence>
            {show && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-900/95 backdrop-blur-md"
                        onClick={handleClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 30 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative z-10 bg-gradient-to-br from-slate-800 to-slate-900 w-full max-w-lg rounded-[2rem] border border-indigo-500/30 p-8 shadow-[0_0_80px_rgba(79,70,229,0.3)] text-center overflow-hidden"
                    >
                        {/* 背景の装飾光 */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/20 blur-[80px] rounded-full pointer-events-none" />

                        <motion.div
                            initial={{ scale: 0.5, rotate: -20, opacity: 0 }}
                            animate={{ scale: 1, rotate: 0, opacity: 1 }}
                            transition={{ delay: 0.2, type: "spring" }}
                            className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-500/20 text-indigo-400 mb-4 ring-4 ring-indigo-500/30 shadow-[0_0_30px_rgba(79,70,229,0.5)]"
                        >
                            <Sparkles size={32} />
                        </motion.div>

                        <h2 className="text-3xl font-black text-white mb-1 tracking-tight">CLASS UP!</h2>
                        <p className="text-indigo-400 font-bold mb-8">キャラクターが進化しました！</p>

                        <div className="flex items-center justify-center gap-4 mb-8">
                            {/* 進化前 */}
                            <div className="flex flex-col items-center opacity-60 grayscale scale-90">
                                <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center mb-2 overflow-hidden shadow-inner">
                                    <img src={previousStage.imageUrl} alt="Before" className="w-20 h-20 object-contain drop-shadow-md" />
                                </div>
                                <span className="text-sm font-bold text-slate-400">{previousStage.name}</span>
                            </div>

                            <ArrowRight className="text-indigo-500" size={32} />

                            {/* 進化後 */}
                            <motion.div
                                initial={{ scale: 0.8, x: -20, opacity: 0 }}
                                animate={{ scale: 1.1, x: 0, opacity: 1 }}
                                transition={{ delay: 0.4, type: "spring" }}
                                className="flex flex-col items-center"
                            >
                                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500/30 to-slate-800 border-4 border-indigo-500 flex items-center justify-center mb-2 overflow-hidden shadow-[0_0_40px_rgba(79,70,229,0.4)] relative p-2">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                        className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(79,70,229,0.5)_360deg)] rounded-full mix-blend-screen"
                                    />
                                    <img src={currentStage.imageUrl} alt="After" className="w-full h-full object-contain relative z-10 drop-shadow-xl" />
                                </div>
                                <span className="text-lg font-black text-indigo-300 drop-shadow-md">{currentStage.name}</span>
                            </motion.div>
                        </div>

                        {/* ステータス変化 */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700 mx-8"
                        >
                            <h3 className="text-xs font-black text-slate-400 mb-3 tracking-widest text-left pl-1">STATUS INCREASE</h3>
                            <div className="grid grid-cols-2 gap-3 text-sm font-black">
                                <div className="flex justify-between items-center bg-slate-900 p-2 rounded-xl">
                                    <span className="text-slate-500 text-xs">HP</span>
                                    <span className="text-emerald-400">{previousStats.hp} <ArrowRight className="inline mx-1 opacity-50" size={12} /> {currentStats.hp}</span>
                                </div>
                                <div className="flex justify-between items-center bg-slate-900 p-2 rounded-xl">
                                    <span className="text-slate-500 text-xs">ATK</span>
                                    <span className="text-rose-400">{previousStats.atk} <ArrowRight className="inline mx-1 opacity-50" size={12} /> {currentStats.atk}</span>
                                </div>
                                <div className="flex justify-between items-center bg-slate-900 p-2 rounded-xl">
                                    <span className="text-slate-500 text-xs">DEF</span>
                                    <span className="text-blue-400">{previousStats.def} <ArrowRight className="inline mx-1 opacity-50" size={12} /> {currentStats.def}</span>
                                </div>
                                <div className="flex justify-between items-center bg-slate-900 p-2 rounded-xl">
                                    <span className="text-slate-500 text-xs">SPD</span>
                                    <span className="text-amber-400">{previousStats.spd} <ArrowRight className="inline mx-1 opacity-50" size={12} /> {currentStats.spd}</span>
                                </div>
                            </div>
                        </motion.div>

                        <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1 }}
                            onClick={handleClose}
                            className="mt-8 bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 px-12 rounded-2xl shadow-lg shadow-indigo-500/20 transition-all hover:scale-105"
                        >
                            冒険を続ける
                        </motion.button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
