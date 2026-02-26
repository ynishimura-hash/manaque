"use client";

import React from 'react';
import { useGamificationStore } from '@/store/useGamificationStore';
import { isFeatureEnabled } from '@/config/features';
import { Trophy, Medal, Star, Flame, Sparkles, AlertCircle, BookOpen, Crown } from 'lucide-react';

const BADGE_DEFINITIONS = [
    { id: 'first_step', label: 'First Step', description: '初めてログインした', icon: <Sparkles size={24} className="text-yellow-500" /> },
    { id: 'streak_3', label: '3 Days Streak', description: '3日連続ログインした', icon: <Flame size={24} className="text-orange-500" /> },
    { id: 'streak_7', label: '1 Week Streak', description: '7日連続ログインした', icon: <Flame size={24} className="text-red-600" /> },
    { id: 'first_lesson', label: 'Learner', description: '最初のレッスンをクリアした', icon: <BookOpen size={24} className="text-blue-500" /> },
    { id: 'level_2', label: 'Level 2 Achieved', description: 'キャラクターがレベル2に到達した', icon: <Trophy size={24} className="text-indigo-500" /> },
    { id: 'level_3', label: 'Level 3 Master', description: 'キャラクターが最大レベルに到達した', icon: <Crown size={24} className="text-purple-600" /> },
    { id: 'all_lessons', label: 'Curriculum Complete', description: '全てのレッスンをクリアした', icon: <Medal size={24} className="text-emerald-500" /> },
];

export function BadgeCollection() {
    const { earnedBadges } = useGamificationStore();

    if (!isFeatureEnabled('BADGE_SYSTEM')) return null;

    return (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-3 uppercase tracking-tight italic">
                    <Trophy className="text-yellow-500" size={24} /> Collection
                </h2>
                <div className="text-xs font-black text-slate-400 bg-slate-50 px-3 py-1 rounded-full flex gap-1 items-center">
                    <Star size={12} className="text-yellow-500" />
                    <span>{earnedBadges.length} / {BADGE_DEFINITIONS.length} Badges</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {BADGE_DEFINITIONS.map(badgeDef => {
                    const earned = earnedBadges.find(b => b.id === badgeDef.id);
                    const isUnlocked = !!earned;

                    return (
                        <div
                            key={badgeDef.id}
                            className={`p-4 rounded-2xl flex flex-col items-center justify-center text-center transition-all ${isUnlocked
                                ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 shadow-sm'
                                : 'bg-slate-50 border border-slate-200/60 opacity-60 grayscale'
                                }`}
                        >
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 bg-white shadow-sm flex-shrink-0 ${isUnlocked ? 'shadow-yellow-500/20' : ''
                                }`}>
                                {isUnlocked ? badgeDef.icon : <AlertCircle size={24} className="text-slate-300" />}
                            </div>
                            <h3 className={`text-xs font-black mb-1 line-clamp-2 ${isUnlocked ? 'text-slate-800' : 'text-slate-500'}`}>
                                {badgeDef.label}
                            </h3>
                            <p className="text-[9px] font-bold text-slate-500 leading-tight">
                                {isUnlocked
                                    ? new Date(earned.unlockedAt).toLocaleDateString() + ' 獲得'
                                    : badgeDef.description
                                }
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
