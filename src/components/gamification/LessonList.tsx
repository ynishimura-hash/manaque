"use client";

import { useState, useEffect, useCallback } from "react";
import { useGamificationStore, CharacterType } from "@/store/useGamificationStore";
import { PlayCircle, CheckCircle, HelpCircle, FastForward, Sparkles, X } from "lucide-react";
import YouTubePlayer from "@/components/YouTubePlayer";
import { QuizModal } from "@/components/gamification/quiz/QuizModal";
import { LessonMap } from "@/components/gamification/LessonMap";
import { fetchLessonsAction, fetchProgressAction, upsertProgressAction } from "@/app/elearning/actions";
import type { LessonRow, ProgressRow } from "@/app/elearning/actions";
import { useAppStore } from "@/lib/appStore";
import toast from "react-hot-toast";
import confetti from "canvas-confetti";

// EXP配分（order_indexベース）
const EXP_BY_INDEX: Record<number, number> = { 0: 100, 1: 50, 2: 50, 3: 50, 4: 50, 5: 100 };

// クラス相性マップ（order_indexベース）
const LESSON_AFFINITY: Record<number, {
    classId: CharacterType;
    bonusExp: number;
    bonusSp: number;
    classLabel: string;
    affinityLabel: string;
}> = {
    0: { classId: "merchant", bonusExp: 20, bonusSp: 3, classLabel: "商人", affinityLabel: "販売の心構えは商人の専門領域！" },
    1: { classId: "mage", bonusExp: 20, bonusSp: 3, classLabel: "魔法使い", affinityLabel: "マーケティング戦略は魔法使いの得意分野！" },
    2: { classId: "warrior", bonusExp: 20, bonusSp: 3, classLabel: "戦士", affinityLabel: "ストアオペレーションは戦士の実務力を活かす！" },
    3: { classId: "mage", bonusExp: 20, bonusSp: 3, classLabel: "魔法使い", affinityLabel: "商品知識の探求は魔法使いの本領発揮！" },
    4: { classId: "merchant", bonusExp: 20, bonusSp: 3, classLabel: "商人", affinityLabel: "接客サービスは商人の真骨頂！" },
};

const CLASS_EMOJI: Record<CharacterType, string> = {
    warrior: "⚔️",
    mage: "🔮",
    merchant: "💰",
};

// マナクエのコースID（DB上の固定ID）
const MANAQUE_COURSE_ID = "c0000001-0000-4000-8000-000000000001";

export function LessonList() {
    const { completedLessons, markLessonComplete, selectedCharacterId, addExp, addSp } = useGamificationStore();
    const { currentUserId } = useAppStore();

    const [lessons, setLessons] = useState<LessonRow[]>([]);
    const [progress, setProgress] = useState<ProgressRow[]>([]);
    const [activeLesson, setActiveLesson] = useState<LessonRow | null>(null);
    const [showQuiz, setShowQuiz] = useState(false);
    const [isReplay, setIsReplay] = useState(false);
    const [viewMode, setViewMode] = useState<"list" | "map">("map");
    const [loading, setLoading] = useState(true);

    // DBからレッスン・進捗を取得
    useEffect(() => {
        async function load() {
            const [lessonData, progressData] = await Promise.all([
                fetchLessonsAction(),
                currentUserId ? fetchProgressAction(currentUserId) : Promise.resolve([]),
            ]);
            setLessons(lessonData);
            setProgress(progressData);
            setLoading(false);
        }
        load();
    }, [currentUserId]);

    if (!selectedCharacterId) return null;

    const isLessonCompleted = (lessonId: string) => {
        // DBの進捗 or ローカルストアの両方をチェック
        const dbDone = progress.some((p) => p.lesson_id === lessonId && p.status === "completed");
        const localDone = completedLessons.includes(lessonId);
        return dbDone || localDone;
    };

    const handleLessonAction = (lessonId: string, replay: boolean) => {
        const lesson = lessons.find((l) => l.id === lessonId);
        if (!lesson) return;
        setIsReplay(replay);
        setActiveLesson(lesson);
        setShowQuiz(false);
    };

    const handleVideoEnd = useCallback(() => {
        if (!isReplay) {
            setShowQuiz(true);
        }
    }, [isReplay]);

    const handleVideoProgress = useCallback(
        (percent: number) => {
            if (!activeLesson || !currentUserId) return;
            upsertProgressAction(currentUserId, activeLesson.id, MANAQUE_COURSE_ID, {
                status: "in_progress",
                progress_percent: percent,
            });
        },
        [activeLesson, currentUserId]
    );

    const completeActiveLesson = () => {
        if (!activeLesson) return;

        const willBeAllComplete =
            !completedLessons.includes(activeLesson.id) &&
            completedLessons.length + 1 === lessons.length;

        const expAmount = EXP_BY_INDEX[activeLesson.order_index] ?? 50;
        markLessonComplete(activeLesson.id, expAmount);

        // DB進捗も更新
        if (currentUserId) {
            upsertProgressAction(currentUserId, activeLesson.id, MANAQUE_COURSE_ID, {
                status: "completed",
                progress_percent: 100,
                completed_at: new Date().toISOString(),
            });
        }

        // クラス相性ボーナス
        const affinity = LESSON_AFFINITY[activeLesson.order_index];
        if (affinity && selectedCharacterId === affinity.classId) {
            addExp(affinity.bonusExp);
            addSp(affinity.bonusSp);
            toast.success(
                `${CLASS_EMOJI[selectedCharacterId]} 相性ボーナス！\n${affinity.affinityLabel}\n+${affinity.bonusExp} EXP ＋ +${affinity.bonusSp} SP`,
                { duration: 4000 }
            );
        }

        // 全レッスン完了ボーナス
        if (willBeAllComplete) {
            setTimeout(() => {
                confetti({ particleCount: 200, spread: 120, origin: { y: 0.5 }, zIndex: 9999 });
                toast.success("🎉 全レッスン完了！\n🥚 卵チケット +2枚 獲得！\nおめでとうございます！", { duration: 6000 });
            }, 500);
        }

        setActiveLesson(null);
        setShowQuiz(false);
        setIsReplay(false);
    };

    // LessonMap用のハンドラ — 既存のLessonMapはlessonId(string)で呼ぶので変換
    const handleMapSelect = (lessonId: string, isCompleted: boolean) => {
        handleLessonAction(lessonId, isCompleted);
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto mt-12 flex justify-center">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto mt-12 mb-20">
            <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                    カリキュラム
                    <span className="text-sm font-bold text-slate-500 bg-slate-200 px-3 py-1 rounded-full w-fit">
                        {lessons.filter((l) => isLessonCompleted(l.id)).length} / {lessons.length} 完了
                    </span>
                </h2>

                <div className="bg-slate-100 p-1 rounded-xl flex items-center shadow-inner">
                    <button
                        onClick={() => setViewMode("map")}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${viewMode === "map" ? "bg-white text-blue-600 shadow-md" : "text-slate-500 hover:text-slate-700"}`}
                    >
                        マップビュー
                    </button>
                    <button
                        onClick={() => setViewMode("list")}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${viewMode === "list" ? "bg-white text-blue-600 shadow-md" : "text-slate-500 hover:text-slate-700"}`}
                    >
                        リストビュー
                    </button>
                </div>
            </div>

            {viewMode === "map" ? (
                <LessonMap onLessonSelect={handleMapSelect} />
            ) : (
                <div className="flex flex-col gap-4">
                    {lessons.map((lesson, index) => {
                        const completed = isLessonCompleted(lesson.id);
                        const Icon = lesson.type === "video" ? PlayCircle : HelpCircle;
                        const affinity = LESSON_AFFINITY[lesson.order_index];
                        const hasAffinity = affinity && selectedCharacterId === affinity.classId;
                        const expAmount = EXP_BY_INDEX[lesson.order_index] ?? 50;

                        return (
                            <div
                                key={lesson.id}
                                className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all relative overflow-hidden ${
                                    completed
                                        ? "bg-slate-50 border-slate-200"
                                        : hasAffinity
                                            ? "bg-white border-amber-200 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-50 hover:-translate-y-1 cursor-pointer"
                                            : "bg-white border-blue-100 hover:border-blue-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
                                }`}
                                onClick={() => !completed && handleLessonAction(lesson.id, false)}
                            >
                                {hasAffinity && !completed && (
                                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-200">
                                        <Sparkles size={10} />
                                        {CLASS_EMOJI[selectedCharacterId]} 相性ボーナス +{affinity.bonusExp} EXP
                                    </div>
                                )}

                                <div className={`relative w-32 h-20 rounded-xl overflow-hidden shadow-sm flex-shrink-0 bg-slate-100 ${!lesson.thumbnail_url && (completed ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600")}`}>
                                    {lesson.thumbnail_url ? (
                                        <>
                                            <img src={lesson.thumbnail_url} alt={lesson.title} className={`w-full h-full object-cover ${completed ? "opacity-60 grayscale" : ""}`} />
                                            {completed && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                                    <CheckCircle size={32} className="text-white drop-shadow-md" />
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            {completed ? <CheckCircle size={28} /> : <Icon size={28} />}
                                        </div>
                                    )}
                                </div>

                                <div className="flex-grow">
                                    <p className="text-sm font-bold text-blue-600 mb-1">
                                        第{index + 1}回: {lesson.type === "video" ? "動画講座" : "模擬テスト"}
                                    </p>
                                    <h3 className={`text-xl font-black tracking-tight ${completed ? "text-slate-500" : "text-slate-800"}`}>
                                        {lesson.title}
                                    </h3>
                                    {hasAffinity && !completed && (
                                        <p className="text-[11px] font-bold text-amber-600 mt-1">{affinity.affinityLabel}</p>
                                    )}
                                    {completed && lesson.type === "video" && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleLessonAction(lesson.id, true); }}
                                            className="mt-2 text-xs font-bold text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 w-fit"
                                        >
                                            <FastForward size={14} /> もう一度見る
                                        </button>
                                    )}
                                </div>

                                <div className="text-right flex flex-col items-end gap-1 shrink-0">
                                    <span className="inline-block text-xs font-bold px-3 py-1.5 rounded-full shadow-sm border bg-gradient-to-r from-orange-100 to-amber-100 text-orange-600 border-orange-200">
                                        +{expAmount} EXP
                                    </span>
                                    <p className="text-sm font-bold text-slate-400">{lesson.duration}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* 全レッスン完了バナー */}
            {lessons.length > 0 && lessons.every((l) => isLessonCompleted(l.id)) && (
                <div className="mt-6 p-6 bg-gradient-to-r from-amber-400 via-orange-400 to-pink-400 rounded-3xl shadow-lg text-white text-center">
                    <p className="text-3xl mb-2">🎉</p>
                    <h3 className="text-xl font-black mb-1">全カリキュラム修了おめでとうございます！</h3>
                    <p className="text-sm font-bold opacity-90">🥚 卵チケット +2枚 を獲得しました</p>
                </div>
            )}

            {/* 動画・クイズ モーダル */}
            {activeLesson && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className={`bg-transparent w-full ${showQuiz ? "max-w-3xl" : "max-w-5xl"} transition-all duration-500`}>
                        {!showQuiz ? (
                            <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl ring-1 ring-slate-800">
                                <div className="p-4 bg-slate-800 flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <PlayCircle className="text-blue-400" />
                                        {activeLesson.title}
                                    </h3>
                                    <button
                                        onClick={() => { setActiveLesson(null); setIsReplay(false); }}
                                        className="text-slate-400 hover:text-white transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                                <div className="p-2">
                                    <YouTubePlayer
                                        url={activeLesson.youtube_url}
                                        onEnded={handleVideoEnd}
                                        onProgress={handleVideoProgress}
                                    />
                                </div>
                                {/* テストへ進むボタン（動画URLがない場合用） */}
                                {activeLesson.has_quiz && (
                                    <div className="p-4 flex justify-end">
                                        <button
                                            onClick={handleVideoEnd}
                                            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-colors"
                                        >
                                            テストへ進む →
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <QuizModal
                                lessonId={activeLesson.id}
                                quizData={activeLesson.quiz ?? undefined}
                                onClose={() => { setActiveLesson(null); setShowQuiz(false); }}
                                onComplete={completeActiveLesson}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
