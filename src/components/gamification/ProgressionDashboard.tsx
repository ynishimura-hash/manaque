"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useGamificationStore } from '@/store/useGamificationStore';
import { CHARACTER_DATA, getStatsForLevel } from './characterData';
import { Trophy, Star, TrendingUp, Shield, Zap, Wind } from 'lucide-react';
import confetti from 'canvas-confetti';

interface StatSnapshot {
    hp: number;
    atk: number;
    def: number;
    spd: number;
}

interface LevelUpBannerData {
    newLevel: number;
    prevStats: StatSnapshot;
    newStats: StatSnapshot;
    stageName: string;
}

export function ProgressionDashboard() {
    const { selectedCharacterId, exp, level } = useGamificationStore();
    const prevLevelRef = useRef(level);
    const [levelUpBanner, setLevelUpBanner] = useState<LevelUpBannerData | null>(null);
    const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (level > prevLevelRef.current && selectedCharacterId) {
            const prevLevel = prevLevelRef.current;
            // Lv5・Lv10がクラスチェンジ（EvolutionAlertModalが担当）
            const isClassChange = level === 5 || level === 10;

            if (isClassChange) {
                // クラスチェンジ: 強めのconfetti（モーダルはEvolutionAlertModalが担当）
                const duration = 4000;
                const animationEnd = Date.now() + duration;
                const defaults = { startVelocity: 35, spread: 360, ticks: 80, zIndex: 100 };
                const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
                const interval: any = setInterval(() => {
                    const timeLeft = animationEnd - Date.now();
                    if (timeLeft <= 0) return clearInterval(interval);
                    const particleCount = 60 * (timeLeft / duration);
                    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
                    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
                }, 250);
            } else {
                // 通常レベルアップ: 軽いconfetti + ステータス変化バナーを表示
                confetti({ particleCount: 60, spread: 80, origin: { y: 0.6 }, zIndex: 100 });

                const character = CHARACTER_DATA[selectedCharacterId as keyof typeof CHARACTER_DATA];
                const stageName = character.stages.slice().reverse().find(s => level >= s.level)?.name ?? '';
                const prevStats = getStatsForLevel(selectedCharacterId, prevLevel);
                const newStats = getStatsForLevel(selectedCharacterId, level);

                // 既存バナータイマーをクリア（連続レベルアップの場合）
                if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
                setLevelUpBanner({ newLevel: level, prevStats, newStats, stageName });
                bannerTimerRef.current = setTimeout(() => setLevelUpBanner(null), 4000);
            }
        }
        prevLevelRef.current = level;
    }, [level, selectedCharacterId]);

    if (!selectedCharacterId) return null;

    const character = CHARACTER_DATA[selectedCharacterId];
    const currentStage = character.stages.slice().reverse().find(s => level >= s.level) || character.stages[0];
    const nextStage = character.stages.find(s => s.level > level) || null;

    const currentLevelExp = (level - 1) * 100;
    const nextLevelExp = level * 100;

    let progressPercentage = 100;
    if (level < 10) {
        progressPercentage = ((exp - currentLevelExp) / (nextLevelExp - currentLevelExp)) * 100;
    }

    const Icon = character.icon;

    const statItems = [
        { label: 'HP', icon: <TrendingUp size={12} />, color: 'text-emerald-500' },
        { label: 'ATK', icon: <Zap size={12} />, color: 'text-rose-500' },
        { label: 'DEF', icon: <Shield size={12} />, color: 'text-blue-500' },
        { label: 'SPD', icon: <Wind size={12} />, color: 'text-amber-500' },
    ] as const;

    return (
        <>
            {/* レベルアップ通知バナー（通常レベルアップ時のみ） */}
            {levelUpBanner && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
                    <div className="bg-slate-900 text-white rounded-2xl shadow-2xl px-4 sm:px-6 py-4 flex flex-col items-center gap-3 w-[calc(100vw-2rem)] max-w-[320px] sm:min-w-[280px] border border-slate-700">
                        <div className="flex items-center gap-2">
                            <Star size={18} className="text-yellow-400" fill="currentColor" />
                            <span className="font-black text-lg tracking-tight">
                                LEVEL UP!&nbsp;
                                <span className="text-yellow-400">Lv.{levelUpBanner.newLevel}</span>
                                &nbsp;{levelUpBanner.stageName}
                            </span>
                            <Star size={18} className="text-yellow-400" fill="currentColor" />
                        </div>
                        <div className="grid grid-cols-4 gap-2 w-full">
                            {statItems.map(({ label, icon, color }) => {
                                const prev = levelUpBanner.prevStats[label.toLowerCase() as keyof StatSnapshot];
                                const next = levelUpBanner.newStats[label.toLowerCase() as keyof StatSnapshot];
                                const diff = next - prev;
                                return (
                                    <div key={label} className="bg-slate-800 rounded-xl p-2 text-center flex flex-col items-center gap-1">
                                        <span className={`flex items-center gap-0.5 text-[10px] font-black ${color}`}>
                                            {icon}{label}
                                        </span>
                                        <span className="text-white font-black text-sm">{next}</span>
                                        {diff > 0 && (
                                            <span className="text-emerald-400 text-[10px] font-bold">+{diff}</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-white rounded-3xl shadow-xl mt-4 sm:mt-8 border border-slate-100 flex flex-col md:flex-row gap-6 sm:gap-8 items-center cursor-default">
                {/* Character Display */}
                <div className="flex-shrink-0 flex flex-col items-center justify-center bg-slate-50 p-4 sm:p-8 rounded-2xl w-full md:w-1/3 relative overflow-hidden shadow-sm transition-all duration-700">
                    <div className={`absolute top-0 right-0 w-32 h-32 rounded-full opacity-20 -mr-8 -mt-8 ${currentStage.bg}`} />
                    <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-4 z-10 shadow-md ${currentStage.bg} ${currentStage.color} transition-all duration-700 hover:scale-105`}>
                        {(currentStage as any).imageUrl ? (
                            <img src={(currentStage as any).imageUrl} alt={currentStage.name} className="w-28 h-28 object-contain drop-shadow-md" />
                        ) : (
                            <Icon size={(currentStage as any).size as number} />
                        )}
                    </div>
                    <div className="flex items-center gap-2 mb-1 z-10">
                        <Star className="text-yellow-500" size={20} fill="currentColor" />
                        <h3 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">Lv.{level} {currentStage.name}</h3>
                    </div>
                    <p className="text-slate-500 font-bold z-10">{character.name}</p>
                </div>

                {/* Progress Display */}
                <div className="flex-grow w-full flex flex-col gap-6">
                    <div>
                        <div className="flex justify-between items-end mb-2">
                            <span className="font-bold text-slate-700">経験値 (EXP)</span>
                            <span className="text-2xl font-black text-blue-600 tracking-tighter">
                                {exp}{' '}
                                <span className="text-sm font-bold text-slate-400 tracking-normal">
                                    / {level < 10 ? nextLevelExp : 'MAX'}
                                </span>
                            </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-5 overflow-hidden shadow-inner border border-slate-200">
                            <div
                                className="bg-gradient-to-r from-blue-400 to-blue-600 h-full rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-2"
                                style={{ width: `${Math.min(Math.max(progressPercentage, 0), 100)}%` }}
                            >
                                {progressPercentage > 10 && <div className="w-2 h-3 bg-white rounded-full opacity-40 shadow-sm" />}
                            </div>
                        </div>
                        {level < 10 && nextStage && (
                            <p className="text-right text-xs font-bold text-slate-500 mt-2">
                                次の進化（{nextStage.name}）まで、あと{' '}
                                <span className="text-blue-600">{nextStage.level * 100 - 100 - exp} EXP</span>
                            </p>
                        )}
                        {level === 10 && (
                            <p className="text-right text-sm font-bold text-amber-500 mt-2 flex items-center justify-end gap-1">
                                <Trophy size={16} /> 最大レベルに到達しました！
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
