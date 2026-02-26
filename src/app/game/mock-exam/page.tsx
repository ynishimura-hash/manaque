"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGamificationStore } from '@/store/useGamificationStore';
import { Timer, ArrowRight, Home, CheckCircle2, Trophy, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

// 模擬試験の問題プール（10問）
const MOCK_EXAM_POOL = [
    { question: "マーケティング・ミックス（4P）において、「価格」に該当するものはどれか？", options: ["Product", "Price", "Place", "Promotion"], correctIndex: 1 },
    { question: "商品陳列において、顧客のゴールデンラインはどこか？", options: ["床から30cm〜60cm", "床から85cm〜150cm", "床から180cm以上", "天井近く"], correctIndex: 1 },
    { question: "接客の基本用語における「クッション言葉」として適切なものはどれか？", options: ["絶対に無理です", "恐れ入りますが", "ちょっと待って", "知るわけないでしょ"], correctIndex: 1 },
    { question: "AIDMAの法則における「D」は何を表すか？", options: ["Decision(決定)", "Desire(欲求)", "Do(行動)", "Demand(需要)"], correctIndex: 1 },
    { question: "小売業の形態のうち、特定の商品分野に絞り込んで品揃えを豊富にする業態は何か？", options: ["総合スーパー", "専門店", "コンビニエンスストア", "百貨店"], correctIndex: 1 },
    { question: "商品のライフサイクルの中で、売上や利益が最も急成長する時期はどれか？", options: ["導入期", "成長期", "成熟期", "衰退期"], correctIndex: 1 },
    { question: "顧客が自発的に商品を手に取って選ぶことができる販売方式を何というか？", options: ["対面販売", "セルフサービス方式", "訪問販売", "通信販売"], correctIndex: 1 },
    { question: "POP広告の主な役割として適切でないものはどれか？", options: ["商品の特徴を伝える", "価格を明示する", "店外の通行人を遠くから集客する", "購買意欲を喚起する"], correctIndex: 2 },
    { question: "「JANコード」は一般的に何桁か？（標準タイプ）", options: ["8桁", "10桁", "13桁", "16桁"], correctIndex: 2 },
    { question: "POSシステムが収集する情報として当てはまらないものはどれか？", options: ["いつ売れたか", "何が売れたか", "誰が買ったか（※顧客データ連携時）", "どこで作られたか（製造工程の詳細）"], correctIndex: 3 },
];

const TIME_LIMIT_SECONDS = 60; // 制限時間（60秒）

export default function MockExamPage() {
    const router = useRouter();
    const { addExp, checkAndAwardBadges } = useGamificationStore();

    const [isStarted, setIsStarted] = useState(false);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT_SECONDS);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [isFinished, setIsFinished] = useState(false);

    // タイマー処理
    useEffect(() => {
        if (!isStarted || isFinished) return;

        const timerId = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timerId);
                    setIsFinished(true); // 時間切れで自動終了
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timerId);
    }, [isStarted, isFinished]);

    const handleStart = () => {
        // 問題をシャッフル（ここではシンプルにそのまま使用）
        setIsStarted(true);
        setTimeLeft(TIME_LIMIT_SECONDS);
        setCurrentIndex(0);
        setScore(0);
        setIsFinished(false);
    };

    const handleAnswer = (selectedIndex: number) => {
        const isCorrect = selectedIndex === MOCK_EXAM_POOL[currentIndex].correctIndex;
        if (isCorrect) {
            setScore(s => s + 1);
        } else {
            // 不正解時のペナルティ（時間を減らすなど）を入れるならここ
        }

        if (currentIndex < MOCK_EXAM_POOL.length - 1) {
            setCurrentIndex(i => i + 1);
        } else {
            handleFinish(score + (isCorrect ? 1 : 0));
        }
    };

    const handleFinish = (finalScore: number) => {
        setIsFinished(true);
        // スコアによるEXP計算（1問正解10EXP + クリアボーナス + タイムボーナス）
        const baseExp = finalScore * 10;
        const timeBonus = finalScore === MOCK_EXAM_POOL.length ? timeLeft * 2 : 0; // 全問正解時のみタイムボーナス
        const totalExp = baseExp + timeBonus;

        if (totalExp > 0) {
            addExp(totalExp);
            toast.success(`合計 ${totalExp} EXP獲得！`, { icon: '🏆' });
        }

        checkAndAwardBadges(); // 模擬試験終了時にバッジ判定（TODO: 'perfect_mock_exam' 等のバッジ追加）
    };

    if (isFinished) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 -m-4">
                <div className="bg-slate-800 p-8 md:p-12 rounded-[2rem] shadow-2xl max-w-lg w-full text-center border border-slate-700 relative overflow-hidden">
                    {/* デコレーション */}
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500 rounded-full blur-3xl opacity-20" />
                    <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500 rounded-full blur-3xl opacity-20" />

                    <div className="relative z-10">
                        <div className="w-24 h-24 bg-slate-900 border-2 border-slate-700 text-yellow-400 rounded-full flex flex-col items-center justify-center mx-auto mb-6 shadow-inner relative">
                            <Trophy size={40} className="mb-1" />
                        </div>
                        <h1 className="text-3xl font-black text-white mb-2">試験終了！</h1>
                        <p className="text-slate-400 text-sm font-bold mb-8 uppercase tracking-widest">Mock Exam Results</p>

                        <div className="bg-slate-900/50 rounded-2xl p-6 mb-8 border border-slate-700 flex justify-between items-center">
                            <div className="text-left">
                                <p className="text-sm font-bold text-slate-400 mb-1">正答数</p>
                                <p className="text-4xl font-black text-white">{score} <span className="text-lg text-slate-500">/ {MOCK_EXAM_POOL.length}</span></p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-slate-400 mb-1">残り時間</p>
                                <p className="text-3xl font-black text-emerald-400">{timeLeft}s</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={handleStart}
                                className="flex-1 bg-slate-700 text-white py-4 rounded-2xl font-black hover:bg-slate-600 transition-colors"
                            >
                                もっと挑戦する
                            </button>
                            <button
                                onClick={() => router.push('/dashboard')}
                                className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black hover:bg-blue-500 transition-colors flex items-center justify-center gap-2"
                            >
                                <Home size={18} /> 戻る
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!isStarted) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 -m-4">
                <div className="bg-slate-800 p-8 md:p-12 rounded-[3xl] shadow-2xl max-w-lg w-full text-center border-t-4 border-t-purple-500 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

                    <div className="relative z-10">
                        <div className="w-24 h-24 bg-slate-900 text-purple-400 border border-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner rotate-3">
                            <Timer size={48} />
                        </div>
                        <h1 className="text-3xl font-black text-white mb-4 tracking-tighter">模擬試験<span className="text-purple-400 font-normal">（タイムアタック）</span></h1>
                        <p className="text-slate-400 text-sm font-bold mb-8 leading-relaxed">
                            制限時間 <strong className="text-white">60秒</strong> 以内に全{MOCK_EXAM_POOL.length}問のクリアを目指せ！<br />
                            全問正解で残り時間がスコアに加算されます。<br />
                            <span className="text-red-400 text-xs mt-2 inline-block">※焦らず、正確に。</span>
                        </p>

                        <button
                            onClick={handleStart}
                            className="w-full bg-purple-600 text-white text-lg font-black py-5 rounded-2xl hover:bg-purple-700 transition-transform active:scale-95 shadow-lg shadow-purple-900 flex flex-col items-center justify-center gap-1"
                        >
                            <span>タイムアタックを開始</span>
                            <span className="text-xs text-purple-200 font-bold tracking-widest uppercase">Start Challenge</span>
                        </button>

                        <button onClick={() => router.back()} className="mt-6 text-slate-500 font-bold text-sm hover:text-slate-300">
                            ダッシュボードに戻る
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const currentQuestion = MOCK_EXAM_POOL[currentIndex];

    // 残り時間に応じた色の変化
    const timerColor = timeLeft > 20 ? 'text-emerald-400' : timeLeft > 10 ? 'text-amber-400' : 'text-red-500 animate-pulse';
    const progressWidth = ((currentIndex) / MOCK_EXAM_POOL.length) * 100;

    return (
        <div className="min-h-screen bg-slate-900 p-6 flex flex-col items-center justify-center -m-4">

            <div className="w-full max-w-3xl mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3 bg-slate-800 px-5 py-3 rounded-2xl border border-slate-700 shadow-xl">
                    <Timer size={24} className={timerColor} />
                    <span className={`text-2xl font-black font-mono tracking-tighter w-12 ${timerColor}`}>{timeLeft}</span>
                    <span className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Sec</span>
                </div>
                <div className="text-sm font-black text-slate-400 bg-slate-800 px-5 py-3 rounded-2xl border border-slate-700">
                    Question <span className="text-white text-lg ml-1">{currentIndex + 1}</span> / {MOCK_EXAM_POOL.length}
                </div>
            </div>

            <div className="w-full max-w-3xl bg-slate-800 rounded-[2.5rem] shadow-2xl border border-slate-700 overflow-hidden relative">
                {/* 進行度バー */}
                <div className="absolute top-0 left-0 h-1.5 bg-slate-700 w-full">
                    <div
                        className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300"
                        style={{ width: `${progressWidth}%` }}
                    />
                </div>

                <div className="p-8 md:p-12 mb-2">
                    <h2 className="text-xl md:text-2xl font-black text-white leading-relaxed text-center">{currentQuestion.question}</h2>
                </div>

                <div className="px-6 pb-6 md:px-8 md:pb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentQuestion.options.map((opt, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleAnswer(idx)}
                                className="w-full p-5 rounded-2xl border-2 border-slate-700 bg-slate-800/50 hover:bg-slate-700 hover:border-slate-500 text-left font-bold text-slate-200 transition-all active:scale-[0.98] flex items-center gap-4 group"
                            >
                                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-sm font-black text-slate-500 group-hover:text-white transition-colors">
                                    {String.fromCharCode(65 + idx)}
                                </div>
                                <span className="text-base">{opt}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
