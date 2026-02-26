"use client";

import React, { useState } from 'react';
import { useGamificationStore } from '@/store/useGamificationStore';
import { ArrowLeft, Play, FastForward, CheckCircle2, Ticket, Zap } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

// ストーリーのエピソード定義
interface StoryEpisode {
    id: number;
    title: string;
    description: string;
    dialogues: { speaker: string; text: string; action?: string }[];
    rewards: { sp: number; tickets: number; exp: number };
}

const STORY_EPISODES: StoryEpisode[] = [
    {
        id: 1,
        title: "Ep.1 異世界転生と最初の試練",
        description: "接客業の基礎を知るためのプロローグ。",
        dialogues: [
            { speaker: "謎の声", text: "目を覚ましなさい…次代の勇者よ。" },
            { speaker: "あなた", text: "ここは…？ たしか寝る前にテキストを読んでいたはずじゃ…" },
            { speaker: "案内人", text: "ここは『商いの国 エヒメ』。魔物（クレーム）が増え、国が危機に陥っています。" },
            { speaker: "案内人", text: "あなたの持つ『販売士』の知識だけが、この国を救う武器になります。" },
            { speaker: "あなた", text: "武器…？ 剣も魔法も使えないのに？" },
            { speaker: "案内人", text: "心配無用です。動画を見て知識を深めれば、それが強力な一撃となります。" },
            { speaker: "案内人", text: "まずは最初の動画を見てみましょう。さあ、拠点へ！", action: "unlock_video" }
        ],
        rewards: { sp: 10, tickets: 1, exp: 20 }
    },
    {
        id: 2,
        title: "Ep.2 宝物庫の解放",
        description: "ガチャ機能のチュートリアル",
        dialogues: [
            { speaker: "案内人", text: "素晴らしい。最初の知識を得ましたね。" },
            { speaker: "あなた", text: "なんとなく分かってきた。でも、敵が強くなったらどうすれば？" },
            { speaker: "案内人", text: "そこで『宝物庫』の出番です。動画学習やバトルで手に入れた『チケット』を使います。" },
            { speaker: "案内人", text: "運が良ければ、伝説の装備が手に入るかもしれません。" },
            { speaker: "あなた", text: "ほう…ガチャというやつですね。" },
            { speaker: "案内人", text: "さあ、このチケットを使って実際に引いてみてください！", action: "unlock_gacha" }
        ],
        rewards: { sp: 5, tickets: 3, exp: 10 }
    },
    {
        id: 3,
        title: "Ep.3 自らを鍛え上げる",
        description: "スキルツリー解放",
        dialogues: [
            { speaker: "案内人", text: "装備は整いましたか？ 次はあなた自身の潜在能力を引き出します。" },
            { speaker: "あなた", text: "潜在能力？" },
            { speaker: "案内人", text: "はい。『SP（スキルポイント）』を消費して、魔法や便利な力を覚えることができるのです。" },
            { speaker: "案内人", text: "先ほどの報酬で SP を渡しておきました。" },
            { speaker: "案内人", text: "『スキルツリー』を開いて、好きな力を習得してみましょう。", action: "unlock_skill" }
        ],
        rewards: { sp: 20, tickets: 0, exp: 10 }
    }
];

export default function StoryModePage() {
    const { storyProgress, advanceStory, addSp, addGachaTickets, addExp } = useGamificationStore();
    const router = useRouter();

    const [activeEpisodeId, setActiveEpisodeId] = useState<number | null>(null);
    const [dialogueIndex, setDialogueIndex] = useState(0);

    const handleStartEpisode = (ep: StoryEpisode) => {
        if (ep.id > storyProgress) {
            toast.error('このエピソードはまだ解放されていません');
            return;
        }
        setActiveEpisodeId(ep.id);
        setDialogueIndex(0);
    };

    const handleNextDialogue = () => {
        if (!activeEpisode) return;

        if (dialogueIndex < activeEpisode.dialogues.length - 1) {
            setDialogueIndex(prev => prev + 1);
        } else {
            // エピソード完了
            completeEpisode();
        }
    };

    const handleSkip = () => {
        completeEpisode();
    };

    const completeEpisode = () => {
        if (!activeEpisode) return;

        // 初回クリアのみ報酬と進行状況の更新
        if (activeEpisode.id === storyProgress) {
            advanceStory();
            addSp(activeEpisode.rewards.sp);
            addGachaTickets(activeEpisode.rewards.tickets);
            addExp(activeEpisode.rewards.exp);

            toast.success(
                `エピソードクリア報酬！\nSP +${activeEpisode.rewards.sp} / チケット +${activeEpisode.rewards.tickets} / EXP +${activeEpisode.rewards.exp}`,
                { duration: 5000, icon: '🎁', style: { background: '#333', color: '#fff' } }
            );
        }

        const lastAction = activeEpisode.dialogues[activeEpisode.dialogues.length - 1].action;

        setActiveEpisodeId(null);
        setDialogueIndex(0);

        // 次の導線へ自動画面遷移
        if (lastAction === 'unlock_video') {
            router.push('/reskill'); // ここから動画学習へ
        } else if (lastAction === 'unlock_gacha') {
            router.push('/game/gacha'); // ガチャのチュートリアルへ
        } else if (lastAction === 'unlock_skill') {
            router.push('/game/skill-tree'); // スキル解放のチュートリアルへ
        }
    };

    const activeEpisode = STORY_EPISODES.find(ep => ep.id === activeEpisodeId);

    return (
        <div className="min-h-screen bg-slate-900 text-slate-200 pb-24 font-sans selection:bg-blue-500/30">
            {/* 魔法陣のような背景装飾 */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[150px]" />
            </div>

            <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800">
                <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                    <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft size={20} />
                        <span className="text-sm font-bold">拠点へ戻る</span>
                    </Link>
                    <h1 className="text-base font-black text-white">メインストーリー</h1>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-4 md:p-6 relative z-10">

                <AnimatePresence mode="wait">
                    {!activeEpisodeId ? (
                        <motion.div
                            key="episode-list"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            <h2 className="text-2xl font-black text-white mb-6 border-b border-slate-700 pb-4">エピソード選択</h2>

                            {STORY_EPISODES.map((ep) => {
                                const isUnlocked = ep.id <= storyProgress;
                                const isCompleted = ep.id < storyProgress;
                                const isCurrent = ep.id === storyProgress;

                                return (
                                    <div
                                        key={ep.id}
                                        className={`p-6 rounded-2xl border-2 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4
                                            ${isCurrent ? 'bg-blue-900/40 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.2)]' :
                                                isCompleted ? 'bg-slate-800/60 border-slate-600' :
                                                    'bg-slate-900 border-slate-800 opacity-50'}
                                        `}
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                {isCompleted ? (
                                                    <span className="bg-emerald-500 text-white p-1 rounded-full"><CheckCircle2 size={16} /></span>
                                                ) : isCurrent ? (
                                                    <span className="bg-blue-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">NEW</span>
                                                ) : null}
                                                <h3 className={`text-xl font-black ${isUnlocked ? 'text-white' : 'text-slate-500'}`}>{ep.title}</h3>
                                            </div>
                                            <p className="text-sm text-slate-400">{ep.description}</p>
                                        </div>

                                        <div className="flex flex-col md:items-end gap-3">
                                            {isUnlocked && !isCompleted && (
                                                <div className="flex items-center gap-3 text-xs font-bold text-slate-300">
                                                    <span>初回報酬:</span>
                                                    <span className="flex items-center gap-1 text-emerald-400"><Zap size={12} /> {ep.rewards.sp}</span>
                                                    <span className="flex items-center gap-1 text-amber-400"><Ticket size={12} /> {ep.rewards.tickets}</span>
                                                </div>
                                            )}
                                            <button
                                                onClick={() => handleStartEpisode(ep)}
                                                disabled={!isUnlocked}
                                                className={`flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-black transition-all ${isUnlocked
                                                    ? 'bg-blue-600 hover:bg-blue-500 text-white'
                                                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                                    }`}
                                            >
                                                <Play size={18} />
                                                再生する
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="dialogue-view"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-50 bg-slate-900 flex flex-col justify-end min-h-[80vh] bg-[url('/images/rpg/story_bg_prologue.png')] bg-cover bg-center overflow-hidden"
                        >
                            {/* 背景の暗転用など */}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent z-0" />

                            <div className="relative z-10 p-4 md:p-8 w-full max-w-4xl mx-auto flex flex-col justify-end h-full">

                                <div className="flex justify-end mb-4">
                                    <button
                                        onClick={handleSkip}
                                        className="bg-slate-800/50 hover:bg-slate-700/80 backdrop-blur text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 border border-slate-600 transition-colors"
                                    >
                                        <FastForward size={14} /> スキップ
                                    </button>
                                </div>

                                <div
                                    className="bg-slate-800/90 backdrop-blur-md border-2 border-slate-600 rounded-2xl p-6 md:p-8 shadow-2xl cursor-pointer hover:border-blue-400 transition-colors"
                                    onClick={handleNextDialogue}
                                >
                                    <div className="mb-2">
                                        <span className="inline-block bg-blue-600 text-white text-xs font-black px-3 py-1 rounded-t-lg rounded-br-lg shadow-sm">
                                            {activeEpisode?.dialogues[dialogueIndex].speaker}
                                        </span>
                                    </div>
                                    <p className="text-xl md:text-2xl font-bold text-white leading-relaxed min-h-[80px]">
                                        {activeEpisode?.dialogues[dialogueIndex].text}
                                    </p>

                                    <div className="flex justify-end mt-4">
                                        <span className="text-slate-400 text-xs font-bold animate-pulse">
                                            タップして次へ ▶︎
                                        </span>
                                    </div>
                                </div>

                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
