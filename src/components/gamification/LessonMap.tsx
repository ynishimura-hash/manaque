"use client";

import React, { useEffect, useState } from 'react';
import { CERTIFICATION_LESSONS } from '@/lib/certificationLessons';
import { useGamificationStore } from '@/store/useGamificationStore';
import { PlayCircle, CheckCircle, Lock, FastForward, Flag, Award } from 'lucide-react';
import { CHARACTER_DATA } from './characterData';

interface LessonMapProps {
    onLessonSelect: (lessonId: string, isCompleted: boolean) => void;
}

export function LessonMap({ onLessonSelect }: LessonMapProps) {
    const { completedLessons, selectedCharacterId, level } = useGamificationStore();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // 現在アンロックされている最も先のレッスンインデックスを見つける
    const unlockedIndex = Math.min(
        completedLessons.length,
        CERTIFICATION_LESSONS.length - 1
    );

    // キャラクター画像の取得
    const character = selectedCharacterId ? CHARACTER_DATA[selectedCharacterId as keyof typeof CHARACTER_DATA] : null;
    const currentStage = character ? (character.stages.slice().reverse().find(s => (level || 1) >= s.level) || character.stages[0]) : null;

    // パスとノードの計算
    const numLessons = CERTIFICATION_LESSONS.length;
    const totalNodes = numLessons + 2; // START, 5 lessons, GOAL

    const getPath = (leftX: number, rightX: number) => {
        let d = `M 50 0 `;
        for (let i = 1; i < totalNodes; i++) {
            const prevY = (100 / (totalNodes - 1)) * (i - 1);
            const currY = (100 / (totalNodes - 1)) * i;

            let currX = 50;
            if (i < totalNodes - 1) currX = i % 2 === 1 ? leftX : rightX;

            let prevX = 50;
            if (i - 1 > 0 && i - 1 < totalNodes - 1) prevX = (i - 1) % 2 === 1 ? leftX : rightX;

            const controlY = (prevY + currY) / 2;
            d += `C ${prevX} ${controlY}, ${currX} ${controlY}, ${currX} ${currY} `;
        }
        return d;
    };

    const pathString = getPath(20, 80); // 共通のカーブ

    // 進捗の割合（青線のハイライト用）
    const progressIndex = Math.min(completedLessons.length + 1, totalNodes - 1);
    const progressPercent = isMounted ? (progressIndex / (totalNodes - 1)) * 100 : 0;

    return (
        <div className="w-full max-w-4xl mx-auto py-16 px-2 md:px-4 overflow-hidden">
            <div className="relative w-full h-[1200px] md:h-[1500px]">

                {/* SVG Background Track */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                        <clipPath id="progressClip">
                            <rect x="0" y="0" width="100" height={progressPercent} className="transition-all duration-1000 ease-in-out" />
                        </clipPath>
                    </defs>

                    {/* Inactive Track */}
                    <path
                        d={pathString}
                        fill="none"
                        stroke="#E2E8F0"
                        strokeWidth="8"
                        vectorEffect="non-scaling-stroke"
                        strokeDasharray="16 16"
                    />

                    {/* Active Track */}
                    <path
                        d={pathString}
                        fill="none"
                        stroke="#60A5FA"
                        strokeWidth="10"
                        vectorEffect="non-scaling-stroke"
                        clipPath="url(#progressClip)"
                    />
                </svg>

                {/* START Point */}
                <div
                    className="absolute z-10 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                    style={{ top: '0%', left: '50%' }}
                >
                    <div className="w-14 h-14 md:w-16 md:h-16 bg-white border-4 border-slate-200 rounded-full flex flex-col items-center justify-center text-slate-400 shadow-sm shrink-0">
                        <Flag size={20} className="md:w-6 md:h-6" />
                        <span className="text-[8px] md:text-[10px] font-black tracking-widest mt-0.5">START</span>
                    </div>
                </div>

                {/* Lessons */}
                {CERTIFICATION_LESSONS.map((lesson, index) => {
                    const isCompleted = completedLessons.includes(lesson.id);
                    const isUnlocked = index <= unlockedIndex;
                    const isCurrent = index === unlockedIndex;

                    const nodeIndex = index + 1;
                    const yTarget = (100 / (totalNodes - 1)) * nodeIndex;
                    const isLeft = nodeIndex % 2 === 1;

                    const borderColor = isCurrent ? 'border-amber-400' : isCompleted ? 'border-blue-100' : !isUnlocked ? 'border-slate-200' : 'border-blue-100';

                    return (
                        <div
                            key={lesson.id}
                            className="absolute -translate-x-1/2 -translate-y-1/2 z-10 flex items-center justify-center"
                            style={{ top: `${yTarget}%`, left: isLeft ? '20%' : '80%' }}
                        >
                            {/* Node Circle */}
                            <div className="relative z-20">
                                <div className={`
                                    w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-full flex items-center justify-center border-4 shadow-sm relative overflow-hidden bg-white cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg
                                    ${isCompleted ? 'border-green-400 text-green-500'
                                        : isCurrent ? 'border-amber-400 text-amber-500 animate-pulse-border shadow-[0_0_15px_rgba(251,191,36,0.6)]'
                                            : !isUnlocked ? 'border-slate-200 text-slate-300'
                                                : 'border-blue-400 text-blue-500'}
                                `}>
                                    {!isUnlocked ? (
                                        <Lock size={24} className="md:w-8 md:h-8" />
                                    ) : lesson.thumbnail ? (
                                        <>
                                            <img src={lesson.thumbnail} alt={lesson.title} className={`w-full h-full object-cover transition-transform duration-500 hover:scale-110 ${isCompleted ? 'opacity-80' : ''}`} />
                                            <div className={`absolute inset-0 flex items-center justify-center ${isCompleted ? 'bg-black/30' : 'bg-black/10'}`}>
                                                {isCompleted ? <CheckCircle size={28} className="text-white drop-shadow-md" /> : <PlayCircle size={28} className="text-white drop-shadow-md opacity-90" />}
                                            </div>
                                        </>
                                    ) : (
                                        isCompleted ? <CheckCircle size={24} className="md:w-8 md:h-8" /> : <PlayCircle size={24} className="md:w-8 md:h-8" />
                                    )}
                                </div>

                                {/* Character standing exactly on the Node */}
                                {isCurrent && currentStage && (
                                    <div className="absolute bottom-[85%] left-1/2 -translate-x-1/2 w-16 h-16 md:w-32 md:h-32 animate-bounce-custom pointer-events-none z-50">
                                        <div className="relative w-full h-full">
                                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 md:w-12 h-2 md:h-3 bg-black/20 rounded-[100%] blur-sm animate-shadow-pulse" />
                                            <img src={currentStage.imageUrl} alt="Character" className="w-full h-full object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]" />
                                        </div>
                                        <div className="absolute -top-3 -right-4 md:-top-4 md:-right-8 bg-amber-400 text-white text-[8px] md:text-xs font-black px-2 md:px-3 py-0.5 md:py-1 rounded-full shadow-lg transform rotate-6 whitespace-nowrap">
                                            You are here!
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Lesson Card */}
                            <div className={`absolute top-1/2 -translate-y-1/2 w-[220px] md:w-[320px] ${isLeft ? 'left-full ml-3 md:ml-6' : 'right-full mr-3 md:mr-6'} z-10`}>
                                <div
                                    onClick={() => isUnlocked && onLessonSelect(lesson.id, isCompleted)}
                                    className={`
                                        relative p-4 md:p-5 rounded-2xl w-full text-left transition-all duration-300 bg-white border-2
                                        ${!isUnlocked
                                            ? 'border-slate-200 opacity-80 cursor-not-allowed select-none'
                                            : isCurrent
                                                ? 'border-amber-400 shadow-[0_8px_30px_rgba(251,191,36,0.25)] cursor-pointer hover:-translate-y-1'
                                                : 'border-blue-100 cursor-pointer hover:shadow-lg hover:border-blue-300 hover:-translate-y-1'
                                        }
                                    `}
                                >
                                    {/* Arrow pointing to node */}
                                    <div
                                        className={`
                                            absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rotate-45 z-0
                                            ${isLeft ? '-left-[9px] border-b-2 border-l-2' : '-right-[9px] border-t-2 border-r-2'}
                                            ${borderColor}
                                        `}
                                    />

                                    <div className="relative z-10">
                                        <div className="flex-1 min-w-0">
                                            <span className={`text-[10px] md:text-xs font-black tracking-wider ${isCurrent ? 'text-amber-500' : 'text-slate-400'}`}>LESSON 0{index + 1}</span>
                                            <h3 className={`text-sm md:text-lg font-black leading-tight mt-0.5 ${isUnlocked ? 'text-slate-800' : 'text-slate-500'}`}>
                                                {lesson.title}
                                            </h3>
                                            {isUnlocked && (
                                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                                    <span className="bg-orange-50 text-orange-600 border border-orange-100 text-[10px] font-bold px-2 py-0.5 rounded">
                                                        +{lesson.exp} EXP
                                                    </span>
                                                    {isCompleted && (
                                                        <span className="text-[10px] font-bold text-blue-500 flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded">
                                                            <FastForward size={10} /> スキップ可
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Goal Point */}
                <div
                    className="absolute z-10 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                    style={{ top: '100%', left: '50%' }}
                >
                    <div className={`w-16 h-16 md:w-20 md:h-20 border-4 rounded-full flex flex-col items-center justify-center shadow-lg transition-all duration-700 bg-white shrink-0 ${completedLessons.length === CERTIFICATION_LESSONS.length ? 'border-yellow-400 text-yellow-500 scale-110 shadow-[0_0_40px_rgba(250,204,21,0.5)] border-dashed' : 'border-slate-200 text-slate-300 border-dashed'}`}>
                        <Award size={32} className={`md:w-10 md:h-10 ${completedLessons.length === CERTIFICATION_LESSONS.length ? 'animate-spin-slow' : ''}`} />
                        <span className="text-[10px] md:text-xs font-black mt-1 tracking-widest">GOAL</span>
                    </div>
                </div>

            </div>

            {/* Custom Styles for animations */}
            <style jsx>{`
                .animate-pulse-border {
                    animation: pulse-border 2s ease-in-out infinite;
                }
                @keyframes pulse-border {
                    0%, 100% { transform: scale(1); box-shadow: 0 0 10px rgba(251,191,36,0.3); }
                    50% { transform: scale(1.1); box-shadow: 0 0 20px rgba(251,191,36,0.7); }
                }
                .animate-spin-slow {
                    animation: spin 6s linear infinite;
                }
                .animate-bounce-custom {
                    animation: bounce-custom 2s ease-in-out infinite;
                }
                .animate-shadow-pulse {
                    animation: shadow-pulse 2s ease-in-out infinite;
                }
                @keyframes bounce-custom {
                    0%, 100% { transform: translateX(-50%) translateY(0); }
                    50% { transform: translateX(-50%) translateY(-15px); }
                }
                @keyframes shadow-pulse {
                    0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.6; }
                    50% { transform: translateX(-50%) scale(0.6); opacity: 0.2; }
                }
            `}</style>
        </div>
    );
}
