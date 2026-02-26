"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGamificationStore } from '@/store/useGamificationStore';
import { Target, ArrowRight, CheckCircle2, XCircle, Home, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

// 仮の問題プール（実際は全問題データベースから引く）
const ALL_QUIZ_POOL = [
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

export default function WeaknessPage() {
    const router = useRouter();
    const { weaknessLibrary, removeWeakness, addExp } = useGamificationStore();

    // 弱点ライブラリから出題可能な問題を抽出
    const availableQuestions = weaknessLibrary
        .map(w => ALL_QUIZ_POOL.find(q => q.id === w.questionId))
        .filter((q): q is typeof ALL_QUIZ_POOL[0] => Array.from(new Map(ALL_QUIZ_POOL.map(item => [item.id, item])).values()).filter(item => item !== undefined).length > 0 && q !== undefined);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [score, setScore] = useState(0);

    const currentQuestion = availableQuestions[currentIndex];

    const handleAnswerSubmit = () => {
        if (selectedOption === null || !currentQuestion) return;
        setIsAnswered(true);

        const isCorrect = selectedOption === currentQuestion.correctIndex;
        if (isCorrect) {
            setScore(s => s + 1);
            // 弱点リストから削除＆少量の復習ボーナス
            removeWeakness(currentQuestion.id);
            addExp(20);
            toast.success('弱点を克服しました！ +20 EXP', { icon: '🎯', style: { background: '#22c55e', color: '#fff' } });
        } else {
            toast.error('もう一度復習しましょう！', { icon: '📝' });
        }
    };

    const handleNext = () => {
        if (currentIndex < availableQuestions.length - 1) {
            setCurrentIndex(i => i + 1);
            setSelectedOption(null);
            setIsAnswered(false);
        } else {
            // テスト終了
            router.push('/dashboard');
        }
    };

    if (availableQuestions.length === 0) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="bg-white p-8 rounded-[2rem] shadow-sm max-w-md w-full text-center border border-slate-200">
                    <div className="w-20 h-20 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={40} />
                    </div>
                    <h1 className="text-2xl font-black text-slate-800 mb-2">弱点はありません！</h1>
                    <p className="text-slate-500 text-sm font-bold mb-8">
                        現在、復習が必要な問題（間違えた問題）はありません。<br />引き続き新しい学習を進めましょう！
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

    if (!currentQuestion) return null;

    return (
        <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center">

            <div className="w-full max-w-2xl mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200">
                    <Target size={16} className="text-red-500" />
                    <span className="text-sm font-black text-slate-700">弱点克服モード</span>
                </div>
                <div className="text-sm font-black text-slate-500 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200">
                    残り: {availableQuestions.length - currentIndex} 問
                </div>
            </div>

            <div className="w-full max-w-2xl bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden relative">
                {/* 進行度バー */}
                <div className="absolute top-0 left-0 h-1.5 bg-red-100 w-full">
                    <div
                        className="h-full bg-red-500 transition-all duration-300"
                        style={{ width: `${((currentIndex) / availableQuestions.length) * 100}%` }}
                    />
                </div>

                <div className="bg-slate-900 p-6 md:p-8 text-white text-center mt-1.5">
                    <div className="flex justify-center mb-4">
                        <AlertCircle className="text-red-400 opacity-50" size={32} />
                    </div>
                    <h2 className="text-lg md:text-xl font-black leading-relaxed">{currentQuestion.question}</h2>
                </div>

                <div className="p-6 md:p-8">
                    {!isAnswered ? (
                        <>
                            <div className="space-y-3">
                                {currentQuestion.options.map((opt, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedOption(idx)}
                                        className={`w-full p-4 md:p-5 rounded-2xl border-2 text-left font-bold transition-all flex items-center gap-4 group ${selectedOption === idx
                                                ? 'border-slate-900 bg-slate-50 text-slate-900'
                                                : 'border-slate-100 hover:border-slate-300'
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black transition-colors ${selectedOption === idx ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-500 group-hover:bg-slate-300'
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
                                        : 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20 active:scale-95'
                                    }`}
                            >
                                回答を確定して弱点を克服する <ArrowRight size={20} />
                            </button>
                        </>
                    ) : (
                        <div className="space-y-6">
                            <div className={`p-6 rounded-2xl flex items-start gap-4 ${selectedOption === currentQuestion.correctIndex ? 'bg-emerald-50 border border-emerald-100' : 'bg-red-50 border border-red-100'}`}>
                                <div className="mt-1">
                                    {selectedOption === currentQuestion.correctIndex
                                        ? <CheckCircle2 size={32} className="text-emerald-500" />
                                        : <XCircle size={32} className="text-red-500" />
                                    }
                                </div>
                                <div>
                                    <h3 className={`text-xl font-black mb-2 ${selectedOption === currentQuestion.correctIndex ? 'text-emerald-700' : 'text-red-700'}`}>
                                        {selectedOption === currentQuestion.correctIndex ? '正解！弱点リストから削除されました' : 'まだ定着していません。また復習しましょう！'}
                                    </h3>
                                    <p className="text-sm font-bold text-slate-700 leading-relaxed bg-white/50 p-4 rounded-xl">
                                        {currentQuestion.explanation}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={handleNext}
                                className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                            >
                                {currentIndex < availableQuestions.length - 1 ? '次の弱点問題へ進む' : '復習完了（ダッシュボードへ）'} <ArrowRight size={20} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
