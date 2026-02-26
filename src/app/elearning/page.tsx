"use client";

import React, { useEffect } from 'react';
import { useGamificationStore } from '@/store/useGamificationStore';
import { ProgressionDashboard } from '@/components/gamification/ProgressionDashboard';
import { DailyMissions } from '@/components/gamification/DailyMissions';
import { LessonList } from '@/components/gamification/LessonList';
import { useRouter } from 'next/navigation';

export default function ELearningPage() {
    const { selectedCharacterId } = useGamificationStore();
    const router = useRouter();

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

    return (
        <div className="min-h-screen bg-slate-50 p-4 pb-24">
            <div className="max-w-4xl mx-auto pt-6 sm:pt-8 mb-6 sm:mb-8 text-center">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 tracking-tight mb-2 sm:mb-3">販売士3級 資格試験対策</h1>
                <p className="text-sm sm:text-base text-slate-500 font-bold">ゲーミフィケーション対応の新しいe-ラーニングシステム</p>
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <ProgressionDashboard />
                <DailyMissions />
                <LessonList />
            </div>
        </div>
    );
}
