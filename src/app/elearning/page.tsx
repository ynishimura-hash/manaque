"use client";

import React, { useEffect, useState } from 'react';
import { useGamificationStore } from '@/store/useGamificationStore';
import { DailyMissions } from '@/components/gamification/DailyMissions';
import { LessonList } from '@/components/gamification/LessonList';
import { CHARACTER_DATA } from '@/components/gamification/characterData';
import { useRouter } from 'next/navigation';
import { Flame, X, Star } from 'lucide-react';

export default function ELearningPage() {
    const { selectedCharacterId, exp, level, lastLoginDate, lastDailyQuizDate, lastExpGoalRewardDate } = useGamificationStore();
    const router = useRouter();
    const [showMissions, setShowMissions] = useState(false);

    useEffect(() => {
        if (!selectedCharacterId) {
            router.push('/dashboard');
        }
    }, [selectedCharacterId, router]);

    if (!selectedCharacterId) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    // キャラクター情報
    const character = CHARACTER_DATA[selectedCharacterId as keyof typeof CHARACTER_DATA];
    const currentStage = character?.stages.slice().reverse().find(s => level >= s.level) || character?.stages[0];

    // ミッション完了数
    const today = new Date().toISOString().split('T')[0];
    const missionsDone = [
        lastLoginDate === today,
        lastExpGoalRewardDate === today,
        lastDailyQuizDate === today,
    ].filter(Boolean).length;

    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            {/* マップをすぐ表示 */}
            <LessonList />

            {/* 右下: ミッションFAB */}
            <button
                onClick={() => setShowMissions(true)}
                className="fixed bottom-20 right-4 z-40 bg-orange-500 hover:bg-orange-600 text-white w-14 h-14 rounded-full shadow-lg shadow-orange-500/30 flex flex-col items-center justify-center active:scale-90 transition-all"
            >
                <Flame size={20} />
                <span className="text-[8px] font-black">{missionsDone}/3</span>
            </button>

            {/* 左下: キャラ + EXP ミニウィジェット */}
            {currentStage && (
                <div className="fixed bottom-20 left-4 z-40 bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl shadow-lg px-3 py-2 flex items-center gap-2">
                    <img src={currentStage.imageUrl} alt="" className="w-8 h-8 object-contain" />
                    <div>
                        <div className="flex items-center gap-1">
                            <Star size={10} className="text-yellow-500" fill="currentColor" />
                            <span className="text-[10px] font-black text-slate-700">Lv.{level}</span>
                        </div>
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${(exp % 100)}%` }} />
                        </div>
                        <p className="text-[8px] font-bold text-slate-400">{exp % 100}/100 EXP</p>
                    </div>
                </div>
            )}

            {/* ミッションモーダル */}
            {showMissions && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowMissions(false)}>
                    <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-3xl p-4 pb-8 animate-in slide-in-from-bottom-4 duration-300" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                <Flame size={20} className="text-orange-400" />
                                今日のミッション
                            </h2>
                            <button onClick={() => setShowMissions(false)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full">
                                <X size={16} />
                            </button>
                        </div>
                        <DailyMissions />
                    </div>
                </div>
            )}
        </div>
    );
}
