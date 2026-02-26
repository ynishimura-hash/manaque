"use client";

import { useState } from 'react';
import { CERTIFICATION_LESSONS } from '@/lib/certificationLessons';
import { useGamificationStore, CharacterType } from '@/store/useGamificationStore';
import { PlayCircle, CheckCircle, HelpCircle, FastForward, Sparkles } from 'lucide-react';
import { LessonVideoPlayer } from '@/components/remotion/LessonVideo';
import { QuizModal } from '@/components/gamification/quiz/QuizModal';
import { LessonMap } from '@/components/gamification/LessonMap';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';

// ─── クラス相性マップ ────────────────────────────────────────────────
// レッスン内容とキャラクタークラスの親和性。相性の良いクラスでクリアするとボーナス付与。
const LESSON_AFFINITY: Record<string, {
    classId: CharacterType;
    bonusExp: number;
    bonusSp: number;
    classLabel: string;  // 表示用クラス名
    affinityLabel: string; // 相性の説明
}> = {
    lesson1: {
        classId: 'merchant',
        bonusExp: 20, bonusSp: 3,
        classLabel: '商人',
        affinityLabel: '販売の心構えは商人の専門領域！',
    },
    lesson2: {
        classId: 'mage',
        bonusExp: 20, bonusSp: 3,
        classLabel: '魔法使い',
        affinityLabel: 'マーケティング戦略は魔法使いの得意分野！',
    },
    lesson3: {
        classId: 'warrior',
        bonusExp: 20, bonusSp: 3,
        classLabel: '戦士',
        affinityLabel: 'ストアオペレーションは戦士の実務力を活かす！',
    },
    lesson4: {
        classId: 'mage',
        bonusExp: 20, bonusSp: 3,
        classLabel: '魔法使い',
        affinityLabel: '商品知識の探求は魔法使いの本領発揮！',
    },
    lesson5: {
        classId: 'merchant',
        bonusExp: 20, bonusSp: 3,
        classLabel: '商人',
        affinityLabel: '接客サービスは商人の真骨頂！',
    },
};

// クラスIDからアイコン絵文字を取得
const CLASS_EMOJI: Record<CharacterType, string> = {
    warrior: '⚔️',
    mage: '🔮',
    merchant: '💰',
};

export function LessonList() {
    const {
        completedLessons,
        markLessonComplete,
        selectedCharacterId,
        addExp,
        addSp,
    } = useGamificationStore();
    const [activeVideo, setActiveVideo] = useState<string | null>(null);
    const [showQuiz, setShowQuiz] = useState(false);
    const [isSkippedVideo, setIsSkippedVideo] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'map'>('map');

    if (!selectedCharacterId) return null;

    const handleLessonAction = (lessonId: string, isCompleted: boolean) => {
        setIsSkippedVideo(isCompleted);
        setActiveVideo(lessonId);
        setShowQuiz(false);
    };

    const handleVideoEnd = () => {
        if (!isSkippedVideo) {
            setShowQuiz(true);
        }
    };

    const completeActiveLesson = () => {
        if (!activeVideo) return;

        // 全レッスン完了チェック（完了前の状態で確認）
        const { completedLessons } = useGamificationStore.getState();
        const willBeAllComplete =
            !completedLessons.includes(activeVideo) &&
            completedLessons.length + 1 === CERTIFICATION_LESSONS.length;

        // レッスンデータから正しいEXP量を取得
        const lesson = CERTIFICATION_LESSONS.find(l => l.id === activeVideo);
        markLessonComplete(activeVideo, lesson?.exp);

        // ── クラス相性ボーナス判定 ──
        const affinity = LESSON_AFFINITY[activeVideo];
        if (affinity && selectedCharacterId === affinity.classId) {
            addExp(affinity.bonusExp);
            addSp(affinity.bonusSp);
            toast.success(
                `${CLASS_EMOJI[selectedCharacterId]} 相性ボーナス！\n${affinity.affinityLabel}\n+${affinity.bonusExp} EXP ＋ +${affinity.bonusSp} SP`,
                { duration: 4000 }
            );
        }

        // ── 全レッスン完了ボーナス ──
        if (willBeAllComplete) {
            setTimeout(() => {
                confetti({ particleCount: 200, spread: 120, origin: { y: 0.5 }, zIndex: 9999 });
                toast.success(
                    '🎉 全レッスン完了！\n🥚 卵チケット +2枚 獲得！\nおめでとうございます！',
                    { duration: 6000 }
                );
            }, 500);
        }

        setActiveVideo(null);
        setShowQuiz(false);
        setIsSkippedVideo(false);
    };

    return (
        <div className="max-w-4xl mx-auto mt-12 mb-20">
            <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                    カリキュラム
                    <span className="text-sm font-bold text-slate-500 bg-slate-200 px-3 py-1 rounded-full w-fit">
                        {completedLessons.length} / {CERTIFICATION_LESSONS.length} 完了
                    </span>
                </h2>

                {/* ビュー切替 */}
                <div className="bg-slate-100 p-1 rounded-xl flex items-center shadow-inner">
                    <button
                        onClick={() => setViewMode('map')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${viewMode === 'map' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        マップビュー
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        リストビュー
                    </button>
                </div>
            </div>

            {viewMode === 'map' ? (
                <LessonMap onLessonSelect={handleLessonAction} />
            ) : (
                <div className="flex flex-col gap-4">
                    {CERTIFICATION_LESSONS.map((lesson, index) => {
                        const isCompleted = completedLessons.includes(lesson.id);
                        const Icon = lesson.type === 'video' ? PlayCircle : HelpCircle;
                        const affinity = LESSON_AFFINITY[lesson.id];
                        const hasAffinity = affinity && selectedCharacterId === affinity.classId;

                        return (
                            <div
                                key={lesson.id}
                                className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all relative overflow-hidden ${
                                    isCompleted
                                        ? 'bg-slate-50 border-slate-200'
                                        : hasAffinity
                                            ? 'bg-white border-amber-200 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-50 hover:-translate-y-1 cursor-pointer'
                                            : 'bg-white border-blue-100 hover:border-blue-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer'
                                }`}
                                onClick={() => !isCompleted && handleLessonAction(lesson.id, false)}
                            >
                                {/* 相性ラベル（右上角） */}
                                {hasAffinity && !isCompleted && (
                                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-200">
                                        <Sparkles size={10} />
                                        {CLASS_EMOJI[selectedCharacterId]} 相性ボーナス +{affinity.bonusExp} EXP
                                    </div>
                                )}

                                {/* サムネイル */}
                                <div className={`relative w-32 h-20 rounded-xl overflow-hidden shadow-sm flex-shrink-0 bg-slate-100 ${!lesson.thumbnail && (isCompleted ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600')}`}>
                                    {lesson.thumbnail ? (
                                        <>
                                            <img src={lesson.thumbnail} alt={lesson.title} className={`w-full h-full object-cover transition-transform duration-500 hover:scale-105 ${isCompleted ? 'opacity-60 grayscale' : ''}`} />
                                            {isCompleted && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                                    <CheckCircle size={32} className="text-white drop-shadow-md" />
                                                </div>
                                            )}
                                            {!isCompleted && lesson.type === 'video' && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/10 transition-colors">
                                                    <PlayCircle size={32} className="text-white drop-shadow-md opacity-80" />
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            {isCompleted ? <CheckCircle size={28} /> : <Icon size={28} />}
                                        </div>
                                    )}
                                </div>

                                {/* テキスト */}
                                <div className="flex-grow">
                                    <p className="text-sm font-bold text-blue-600 mb-1 tracking-tight">
                                        第{index + 1}回: {lesson.type === 'video' ? '動画講座' : '模擬テスト'}
                                    </p>
                                    <h3 className={`text-xl font-black tracking-tight ${isCompleted ? 'text-slate-500' : 'text-slate-800'}`}>
                                        {lesson.title}
                                    </h3>
                                    {/* 相性説明（未完了かつ相性あり） */}
                                    {hasAffinity && !isCompleted && (
                                        <p className="text-[11px] font-bold text-amber-600 mt-1">{affinity.affinityLabel}</p>
                                    )}
                                    {isCompleted && lesson.type === 'video' && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleLessonAction(lesson.id, true); }}
                                            className="mt-2 text-xs font-bold text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 w-fit"
                                        >
                                            <FastForward size={14} /> もう一度見る (早送り)
                                        </button>
                                    )}
                                </div>

                                {/* EXP表示 */}
                                <div className="text-right flex flex-col items-end gap-1 shrink-0">
                                    <span className={`inline-block text-xs font-bold px-3 py-1.5 rounded-full shadow-sm border ${
                                        hasAffinity && !isCompleted
                                            ? 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border-amber-200'
                                            : 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-600 border-orange-200'
                                    }`}>
                                        +{lesson.exp} EXP
                                        {hasAffinity && !isCompleted && <span className="ml-1 text-amber-500">+{affinity.bonusExp}</span>}
                                    </span>
                                    <p className="text-sm font-bold text-slate-400">{lesson.duration}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* 全レッスン完了バナー */}
            {completedLessons.length === CERTIFICATION_LESSONS.length && (
                <div className="mt-6 p-6 bg-gradient-to-r from-amber-400 via-orange-400 to-pink-400 rounded-3xl shadow-lg text-white text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <p className="text-3xl mb-2">🎉</p>
                    <h3 className="text-xl font-black mb-1">全カリキュラム修了おめでとうございます！</h3>
                    <p className="text-sm font-bold opacity-90">🥚 卵チケット +2枚 を獲得しました</p>
                </div>
            )}

            {/* 動画・クイズ モーダル */}
            {activeVideo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className={`bg-transparent w-full ${showQuiz ? 'max-w-3xl' : 'max-w-6xl'} transition-all duration-500`}>
                        {!showQuiz ? (
                            <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl ring-1 ring-slate-800">
                                <div className="p-4 bg-slate-800 flex items-center justify-between">
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                        <PlayCircle className="text-blue-400" />
                                        学習コンテンツ動画
                                    </h3>
                                    <button
                                        onClick={() => { setActiveVideo(null); setIsSkippedVideo(false); }}
                                        className="text-slate-400 hover:text-white transition-colors"
                                    >
                                        閉じる
                                    </button>
                                </div>
                                <div className="w-full aspect-video bg-black relative">
                                    <LessonVideoPlayer
                                        lessonId={activeVideo}
                                        onVideoComplete={handleVideoEnd}
                                        playbackRate={isSkippedVideo ? 2.0 : 1.0}
                                    />
                                    <button
                                        onClick={handleVideoEnd}
                                        className="absolute bottom-4 right-4 bg-white/20 hover:bg-white/40 backdrop-blur text-white px-4 py-2 rounded-lg text-sm font-bold opacity-0 hover:opacity-100 transition-opacity"
                                    >
                                        テストへ進む (Debug)
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <QuizModal
                                lessonId={activeVideo}
                                onClose={() => { setActiveVideo(null); setShowQuiz(false); }}
                                onComplete={completeActiveLesson}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
