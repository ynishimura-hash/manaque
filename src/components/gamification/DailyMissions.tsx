"use client";

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useGamificationStore, LoginBonusResult, LOGIN_MILESTONE } from '@/store/useGamificationStore';
import { CheckCircle, Circle, Flame, Zap, BookOpen, ChevronRight, Gift, Sparkles, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const TODAY = new Date().toISOString().split('T')[0];

interface MissionDef {
    id: string;
    label: string;
    description: string;
    rewardLabel: string;
    icon: React.ReactNode;
    isDone: boolean;
    progress?: { current: number; total: number };
    canClaim?: boolean;
    onClaim?: () => void;
    actionLabel?: string;
    onAction?: () => void;
}

// ─── ミッション完了フラッシュ ─────────────────────────────────────────
function CompletionFlash({ missionId }: { missionId: string }) {
    return (
        <div className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden">
            <div
                key={missionId}
                className="absolute inset-0 bg-green-100 animate-ping"
                style={{ animationDuration: '0.6s', animationIterationCount: 1 }}
            />
        </div>
    );
}

export function DailyMissions() {
    const {
        lastLoginDate,
        streakCount,
        learningHistory,
        lastDailyQuizDate,
        lastExpGoalRewardDate,
        checkAndAddLoginBonus,
        claimExpGoalReward,
    } = useGamificationStore();
    const router = useRouter();

    const [loginBonusResult, setLoginBonusResult] = useState<LoginBonusResult | null>(null);
    const [flashingMission, setFlashingMission] = useState<string | null>(null);
    const [claimedExpGoal, setClaimedExpGoal] = useState(false);
    const initialized = useRef(false);

    // ページ表示時にログインボーナスを付与（未取得の場合のみ）
    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        if (lastLoginDate !== TODAY) {
            const result = checkAndAddLoginBonus();
            if (result) {
                setLoginBonusResult(result);
                setFlashingMission('login');
                setTimeout(() => setFlashingMission(null), 1500);

                // ログインボーナストースト
                const { bonusExp, newStreak, gachaTickets, eggTickets } = result;
                let msg = `🌟 ログインボーナス！\n+${bonusExp} EXP（${newStreak}日連続）`;
                if (gachaTickets > 0) msg += `\n🎟 装備チケット +${gachaTickets}枚`;
                if (eggTickets > 0)   msg += `\n🥚 卵チケット +${eggTickets}枚`;
                toast.success(msg, { duration: 5000 });
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const todayExp = useMemo(
        () => learningHistory.find(h => h.date === TODAY)?.expGained ?? 0,
        [learningHistory],
    );

    const EXP_GOAL = 50;
    const expGoalMet = todayExp >= EXP_GOAL;
    const expGoalClaimed = lastExpGoalRewardDate === TODAY || claimedExpGoal;

    // 次の節目（ログインストリーク表示用）
    const nextGachaMilestone = LOGIN_MILESTONE.gachaTicketEvery - (streakCount % LOGIN_MILESTONE.gachaTicketEvery);
    const nextEggMilestone   = LOGIN_MILESTONE.eggTicketEvery   - (streakCount % LOGIN_MILESTONE.eggTicketEvery);

    const handleClaimExpGoal = () => {
        const result = claimExpGoalReward();
        if (result) {
            setClaimedExpGoal(true);
            setFlashingMission('exp_goal');
            setTimeout(() => setFlashingMission(null), 1500);
            toast.success(
                `🎉 EXP目標達成ボーナス受け取り！\n🎟 装備チケット +${result.gachaTickets}枚\n⚡ SP +${result.sp}`,
                { duration: 4000 },
            );
        }
    };

    const missions: MissionDef[] = [
        {
            id: 'login',
            label: '今日もログイン！',
            description: lastLoginDate === TODAY
                ? `${streakCount}日連続ログイン中 • あと${nextGachaMilestone}日で装備チケット`
                : 'まだ今日のボーナスを受け取っていません',
            rewardLabel: (() => {
                const base = `+${Math.min(10 + (streakCount - 1) * 5, 50)} EXP`;
                if (loginBonusResult?.gachaTickets) return `${base} ＋ 🎟 チケット +1`;
                if (loginBonusResult?.eggTickets)   return `${base} ＋ 🥚 卵チケット +1`;
                return base;
            })(),
            icon: <Flame size={20} className="text-orange-500" />,
            isDone: lastLoginDate === TODAY,
        },
        {
            id: 'exp_goal',
            label: `今日のEXP目標（${EXP_GOAL} EXP）`,
            description: expGoalClaimed
                ? '達成ボーナス受け取り済み！'
                : expGoalMet
                    ? '目標達成！ボーナスを受け取ろう'
                    : 'レッスンを受けてEXPを稼ごう',
            rewardLabel: '🎟 装備チケット +1 ＋ ⚡ SP +5',
            icon: <Zap size={20} className="text-blue-500" />,
            isDone: expGoalClaimed,
            progress: { current: Math.min(todayExp, EXP_GOAL), total: EXP_GOAL },
            canClaim: expGoalMet && !expGoalClaimed,
            onClaim: handleClaimExpGoal,
        },
        {
            id: 'daily_quiz',
            label: 'デイリークイズに挑戦',
            description: lastDailyQuizDate === TODAY
                ? '今日は挑戦済み！また明日'
                : '1日1問のランダム出題に挑戦',
            rewardLabel: '🎟 装備チケット +1 ＋ +30 EXP',
            icon: <BookOpen size={20} className="text-purple-500" />,
            isDone: lastDailyQuizDate === TODAY,
            actionLabel: lastDailyQuizDate !== TODAY ? 'チャレンジ' : undefined,
            onAction: () => router.push('/game/daily-quiz'),
        },
    ];

    const doneCount = missions.filter(m => m.isDone).length;
    const allDone = doneCount === missions.length;

    return (
        <div className="max-w-4xl mx-auto mt-6">
            <div className={`rounded-3xl shadow-sm border p-6 transition-colors duration-700 ${allDone ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' : 'bg-white border-slate-100'}`}>
                {/* ヘッダー */}
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                        <Flame size={20} className="text-orange-400" />
                        今日のミッション
                        {allDone && (
                            <span className="ml-2 text-xs font-black text-green-600 bg-green-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Star size={12} fill="currentColor" /> 全達成！
                            </span>
                        )}
                    </h2>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400">
                            🔥 {streakCount}日連続
                        </span>
                        <span className={`text-sm font-black px-3 py-1 rounded-full border ${allDone ? 'text-green-700 bg-green-100 border-green-200' : 'text-slate-400 bg-slate-50 border-slate-100'}`}>
                            {doneCount} / {missions.length} 達成
                        </span>
                    </div>
                </div>

                {/* ストリーク節目予告 */}
                {!allDone && streakCount > 0 && (
                    <div className="mb-4 flex items-center gap-2 text-xs font-bold text-amber-600 bg-amber-50 border border-amber-100 px-3 py-2 rounded-xl">
                        <Sparkles size={14} />
                        あと {nextGachaMilestone} 日連続で🎟 装備チケット獲得！
                        {nextEggMilestone <= 3 && (
                            <span className="ml-2 text-purple-600">あと {nextEggMilestone} 日で🥚 卵チケットも！</span>
                        )}
                    </div>
                )}

                {/* ミッション一覧 */}
                <div className="flex flex-col gap-3">
                    {missions.map((mission) => (
                        <div
                            key={mission.id}
                            className={`relative flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-500 ${
                                mission.isDone
                                    ? 'bg-slate-50 border-slate-100'
                                    : mission.canClaim
                                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-sm shadow-blue-100'
                                        : 'bg-white border-slate-100 hover:border-blue-100'
                            }`}
                        >
                            {/* 完了フラッシュ */}
                            {flashingMission === mission.id && (
                                <div className="absolute inset-0 rounded-2xl bg-green-200 opacity-50 animate-ping" style={{ animationDuration: '0.5s', animationIterationCount: 2 }} />
                            )}

                            {/* アイコン */}
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                mission.isDone ? 'bg-green-100' : mission.canClaim ? 'bg-blue-100' : 'bg-slate-50'
                            }`}>
                                {mission.isDone
                                    ? <CheckCircle size={20} className="text-green-500" />
                                    : mission.icon
                                }
                            </div>

                            {/* テキスト */}
                            <div className="flex-grow min-w-0">
                                <p className={`font-black text-sm ${mission.isDone ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                    {mission.label}
                                </p>
                                <p className="text-xs font-bold text-slate-400 mt-0.5">{mission.description}</p>

                                {/* プログレスバー（EXP目標） */}
                                {mission.progress && (
                                    <div className="mt-2">
                                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-700 ${mission.isDone ? 'bg-green-400' : 'bg-blue-400'}`}
                                                style={{ width: `${(mission.progress.current / mission.progress.total) * 100}%` }}
                                            />
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-400 mt-1 text-right">
                                            {mission.progress.current} / {mission.progress.total} EXP
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* 右側: 報酬 / 受け取るボタン / 完了マーク */}
                            <div className="shrink-0 flex flex-col items-end gap-1.5">
                                {/* 報酬ラベル（未完了時） */}
                                {!mission.isDone && (
                                    <span className="text-[10px] font-black text-orange-500 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                                        {mission.rewardLabel}
                                    </span>
                                )}

                                {mission.isDone ? (
                                    <div className="flex items-center gap-1 text-xs font-bold text-green-600">
                                        <CheckCircle size={18} className="text-green-400" />
                                        <span>達成済み</span>
                                    </div>
                                ) : mission.canClaim && mission.onClaim ? (
                                    <button
                                        onClick={mission.onClaim}
                                        className="flex items-center gap-1.5 text-xs font-black text-white bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 px-4 py-1.5 rounded-xl transition-all shadow-sm shadow-blue-200 hover:shadow-blue-300 hover:scale-105 active:scale-95"
                                    >
                                        <Gift size={14} />
                                        受け取る
                                    </button>
                                ) : mission.actionLabel && mission.onAction ? (
                                    <button
                                        onClick={mission.onAction}
                                        className="flex items-center gap-1 text-xs font-black text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                                    >
                                        {mission.actionLabel} <ChevronRight size={14} />
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    ))}
                </div>

                {/* 全達成バナー */}
                {allDone && (
                    <div className="mt-4 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-green-400 to-emerald-400 rounded-2xl text-white font-black text-sm shadow-sm shadow-green-200">
                        <Star size={16} fill="white" />
                        今日のミッションをすべて達成！すごい！
                        <Star size={16} fill="white" />
                    </div>
                )}
            </div>
        </div>
    );
}
