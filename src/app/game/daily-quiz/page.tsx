"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGamificationStore } from '@/store/useGamificationStore';
import { Brain, Sparkles, CheckCircle2, XCircle, ArrowRight, Home } from 'lucide-react';
import toast from 'react-hot-toast';

// 仮のデイリークイズ制作用問題データ
const DAILY_QUIZ_POOL = [
    {
        id: "dq_01",
        question: "マーケティング・ミックス（4P）において、「価格」に該当するものはどれか？",
        options: ["Product", "Price", "Place", "Promotion"],
        correctIndex: 1,
        explanation: "マーケティングの4Pは、Product（製品）、Price（価格）、Place（流通）、Promotion（販売促進）の4つです。"
    },
    {
        id: "dq_02",
        question: "商品陳列において、顧客のゴールデンライン（最も見やすく手に取りやすい高さ）はどこか？",
        options: ["床から30cm〜60cm", "床から85cm〜150cm", "床から180cm以上", "天井近く"],
        correctIndex: 1,
        explanation: "一般的にゴールデンライン（見やすい・手に取りやすいエリア）は床から約85cm〜150cmの高さと言われています。"
    },
    {
        id: "dq_03",
        question: "接客の基本用語における「クッション言葉」として適切なものはどれか？",
        options: ["「絶対に無理です」", "「恐れ入りますが」", "「ちょっと待って」", "「知るわけないでしょ」"],
        correctIndex: 1,
        explanation: "断りやお願いをする際に、クッション言葉（「恐れ入りますが」「申し訳ございませんが」等）を添えることで、相手への気遣いを示せます。"
    }
];

export default function DailyQuizPage() {
    const router = useRouter();
    const { markDailyQuizComplete, recordWeakness, lastDailyQuizDate } = useGamificationStore();
    const todayStr = new Date().toISOString().split('T')[0];

    const [isStarted, setIsStarted] = useState(false);
    const [question, setQuestion] = useState(DAILY_QUIZ_POOL[0]);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);

    // 受験済みチェック
    useEffect(() => {
        if (lastDailyQuizDate === todayStr) {
            toast('本日のデイリークイズは受験済みです', { icon: '👏' });
        }
    }, [lastDailyQuizDate, todayStr]);

    // 開始時にランダムな問題を選ぶ
    const handleStart = () => {
        const randomIndex = Math.floor(Math.random() * DAILY_QUIZ_POOL.length);
        setQuestion(DAILY_QUIZ_POOL[randomIndex]);
        setIsStarted(true);
    };

    const handleAnswerSubmit = () => {
        if (selectedOption === null) return;
        setIsAnswered(true);

        const isCorrect = selectedOption === question.correctIndex;
        if (isCorrect) {
            // 正解で100EXP獲得
            markDailyQuizComplete(100);
            toast.success('+100 EXP獲得！', { icon: '✨', style: { background: '#22c55e', color: '#fff' } });
        } else {
            // 不正解でも参加賞30EXP
            markDailyQuizComplete(30);
            recordWeakness(question.id); // 弱点ストック行き
            toast.error('惜しい！参加賞 +30 EXP', { icon: '💪', style: { background: '#f59e0b', color: '#fff' } });
        }
    };

    if (lastDailyQuizDate === todayStr) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="bg-white p-8 rounded-[2rem] shadow-sm max-w-md w-full text-center border border-slate-200">
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={40} />
                    </div>
                    <h1 className="text-2xl font-black text-slate-800 mb-2">本日のクイズ完了！</h1>
                    <p className="text-slate-500 text-sm font-bold mb-8">
                        毎日の積み重ねが合格への近道です。<br />明日も忘れずに挑戦しましょう！
                    </p>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="bg-slate-900 text-white w-full py-4 rounded-2xl font-black hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                    >
                        <Home size={20} /> ダッシュボードへ戻る
                    </button>
                </div>
            </div>
        );
    }

    if (!isStarted) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
                <div className="bg-white p-8 md:p-12 rounded-[3xl] shadow-xl max-w-lg w-full text-center border-t-4 border-t-blue-500">
                    <div className="w-24 h-24 bg-gradient-to-tr from-blue-100 to-indigo-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <Brain size={48} />
                    </div>
                    <h1 className="text-3xl font-black text-slate-800 mb-4 tracking-tighter">デイリークイズ</h1>
                    <p className="text-slate-500 text-sm font-bold mb-8 leading-relaxed">
                        1日1問だけのランダムテスト！<br />
                        正解すれば大量の <strong className="text-amber-500 uppercase">EXP</strong> をゲット。<br />
                        間違えても「弱点克服モード」に追加されて復習できます。
                    </p>

                    <button
                        onClick={handleStart}
                        className="w-full bg-blue-600 text-white text-lg font-black py-5 rounded-2xl hover:bg-blue-700 transition-transform active:scale-95 shadow-lg shadow-blue-500/20 flex flex-col items-center justify-center gap-1"
                    >
                        <span>今日の問題に挑戦する</span>
                        <span className="text-xs text-blue-200 font-bold tracking-widest uppercase">Start Daily Challenge</span>
                    </button>

                    <button onClick={() => router.back()} className="mt-4 text-slate-400 font-bold text-sm hover:text-slate-600">
                        あとでにする
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
            <div className="w-full max-w-2xl bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-blue-600 p-6 text-white text-center">
                    <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase mb-2 inline-block">Daily Quiz</span>
                    <h2 className="text-xl md:text-2xl font-black leading-tight mt-2 text-left">{question.question}</h2>
                </div>

                <div className="p-6 md:p-8">
                    {!isAnswered ? (
                        <>
                            <div className="space-y-3">
                                {question.options.map((opt, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedOption(idx)}
                                        className={`w-full p-5 rounded-2xl border-2 text-left font-bold transition-all flex items-center gap-4 group ${selectedOption === idx
                                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black transition-colors ${selectedOption === idx ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-500 group-hover:bg-slate-300'
                                            }`}>
                                            {String.fromCharCode(65 + idx)}
                                        </div>
                                        <span className="text-base text-slate-700">{opt}</span>
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={handleAnswerSubmit}
                                disabled={selectedOption === null}
                                className={`w-full mt-6 py-4 rounded-xl font-black flex items-center justify-center gap-2 transition-all ${selectedOption === null
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                        : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 active:scale-95'
                                    }`}
                            >
                                回答を確定する <ArrowRight size={20} />
                            </button>
                        </>
                    ) : (
                        <div className="space-y-6">
                            <div className={`p-6 rounded-2xl flex items-start gap-4 ${selectedOption === question.correctIndex ? 'bg-emerald-50 border border-emerald-100' : 'bg-red-50 border border-red-100'}`}>
                                <div className="mt-1">
                                    {selectedOption === question.correctIndex
                                        ? <CheckCircle2 size={32} className="text-emerald-500" />
                                        : <XCircle size={32} className="text-red-500" />
                                    }
                                </div>
                                <div>
                                    <h3 className={`text-xl font-black mb-2 ${selectedOption === question.correctIndex ? 'text-emerald-700' : 'text-red-700'}`}>
                                        {selectedOption === question.correctIndex ? '正解！素晴らしいです！' : '不正解...'}
                                    </h3>
                                    <p className="text-sm font-bold text-slate-700 leading-relaxed bg-white/50 p-4 rounded-xl">
                                        {question.explanation}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => router.push('/dashboard')}
                                className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                            >
                                <Home size={20} /> ホームへ戻る
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
