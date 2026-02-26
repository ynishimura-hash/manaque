"use client";

import React, { useMemo } from 'react';
import { useGamificationStore } from '@/store/useGamificationStore';
import { Flame, Calendar as CalendarIcon, Award, ChevronRight, Info } from 'lucide-react';
import { isFeatureEnabled } from '@/config/features';

export function HabitTracker() {
    const { streakCount, learningHistory, exp } = useGamificationStore();

    // Generate last 30 days for the heatmap
    const days = useMemo(() => {
        const result = [];
        const today = new Date();
        // 直近30日分を作成
        for (let i = 29; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];

            // 履歴から該当日のデータを引っ張る
            const record = learningHistory.find(h => h.date === dateStr);
            const expGained = record ? record.expGained : 0;

            // 獲得EXP量に応じてヒートマップの濃度を決定 (0, 1-49, 50-99, 100-199, 200+)
            let intensity = 0;
            if (expGained > 0 && expGained < 50) intensity = 1;
            else if (expGained >= 50 && expGained < 100) intensity = 2;
            else if (expGained >= 100 && expGained < 200) intensity = 3;
            else if (expGained >= 200) intensity = 4;

            result.push({
                date: d,
                dateStr,
                expGained,
                intensity
            });
        }
        return result;
    }, [learningHistory]);

    // UI表示色 (GitHubスタイルのグリーン系)
    const intensityColors = [
        'bg-slate-100',       // 0: 空白
        'bg-green-200',       // 1: 少し
        'bg-green-400',       // 2: 普通
        'bg-green-600',       // 3: 多い
        'bg-green-800'        // 4: とても多い
    ];

    const showStreak = isFeatureEnabled('STREAK_BONUS');
    const showHeatmap = isFeatureEnabled('LEARNING_HEATMAP');

    if (!showStreak && !showHeatmap) return null;

    return (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center justify-between uppercase tracking-tight">
                <div className="flex items-center gap-2">
                    <CalendarIcon className="text-green-500" size={20} />
                    学習の記録
                </div>
                <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md">
                    <Info size={12} /> 毎日続けてボーナスGET
                </div>
            </h2>

            <div className="flex flex-col md:flex-row gap-6">

                {/* 1. Streak Widget */}
                {showStreak && (
                    <div className="flex-1 md:max-w-[200px] bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-5 border border-orange-100 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                        <Flame
                            size={48}
                            className={`mb-2 transition-transform duration-500 ${streakCount > 0 ? 'text-orange-500 animate-pulse' : 'text-slate-300'}`}
                            style={{ filter: streakCount > 0 ? 'drop-shadow(0 0 10px rgba(249, 115, 22, 0.4))' : 'none' }}
                        />
                        <div className="text-3xl font-black text-orange-600 leading-none mb-1">
                            {streakCount} <span className="text-sm">Days</span>
                        </div>
                        <p className="text-[10px] font-bold text-orange-700/60 uppercase tracking-widest">連続学習記録</p>

                        {streakCount > 0 && (
                            <div className="absolute top-2 right-2 flex gap-1 isolate">
                                {[...Array(Math.min(streakCount, 3))].map((_, i) => (
                                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-ping" style={{ animationDelay: `${i * 200}ms` }} />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* 2. Heatmap Widget */}
                {showHeatmap && (
                    <div className="flex-1 flex flex-col justify-end">
                        <div className="flex-1 grid grid-cols-10 md:[grid-template-columns:repeat(15,minmax(0,1fr))] gap-1.5 md:gap-2 mb-3">
                            {days.map((day, i) => (
                                <div
                                    key={day.dateStr}
                                    className={`aspect-square rounded-sm md:rounded-md transition-all duration-300 hover:scale-125 hover:z-10 cursor-help ${intensityColors[day.intensity]} ring-1 ring-black/5 hover:ring-orange-400 hover:shadow-lg`}
                                    title={`${day.dateStr}: ${day.expGained} EXP`}
                                />
                            ))}
                        </div>

                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                            <span className="uppercase tracking-widest">30 Days Activity</span>
                            <div className="flex items-center gap-1.5">
                                <span>Less</span>
                                <div className="flex gap-1">
                                    {intensityColors.map((color, i) => (
                                        <div key={i} className={`w-2.5 h-2.5 rounded-sm ${color} ring-1 ring-black/5`} />
                                    ))}
                                </div>
                                <span>More</span>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
