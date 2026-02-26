"use client";

import { useState } from 'react';
import { HelpCircle, CheckCircle, XCircle, ArrowRight, Trophy, RefreshCw } from 'lucide-react';

interface QuizProps {
    lessonId: string;
    onClose: () => void;
    onComplete: () => void;
}

interface QuizQuestion {
    question: string;
    options: string[];
    answerIndex: number;
    explanation: string; // 解説テキスト
}

interface QuizDef {
    questions: QuizQuestion[];
    passingScore: number; // 合格に必要な正解数
}

// レッスンごとの複数問クイズデータ
const QUIZ_DATA: Record<string, QuizDef> = {
    lesson1: {
        passingScore: 2,
        questions: [
            {
                question: '販売士の役割として最も重要な心構えはどれですか？',
                options: [
                    'とにかく高い商品を売りつけること',
                    '顧客のニーズを読み取り、最適な提案を行うこと',
                    '自分の好きな商品だけを勧めること',
                    'マニュアル通りに淡々と接客すること',
                ],
                answerIndex: 1,
                explanation: '販売士の本質は「顧客志向」。お客様のニーズを正確に把握し、最適な解決策を提案することが基本です。',
            },
            {
                question: '販売士として正しい職業倫理はどれですか？',
                options: [
                    '売上目標を達成するためなら多少の誇張は許される',
                    '顧客の個人情報は社内であれば自由に活用してよい',
                    '誠実さと信頼を基本として、常にお客様の立場に立つ',
                    'クレームは無視して新規顧客の獲得に集中する',
                ],
                answerIndex: 2,
                explanation: '販売士には高い職業倫理が求められます。誠実な対応と顧客の信頼構築が長期的な成功につながります。',
            },
            {
                question: '顧客満足度を高めるために最も重要な要素はどれですか？',
                options: [
                    '低価格の商品のみを揃える',
                    '店舗の外観を豪華にすること',
                    '迅速な対応・正確な情報提供・丁寧なサービスの提供',
                    '在庫を最大限に確保すること',
                ],
                answerIndex: 2,
                explanation: '顧客満足度は「スピード・正確性・接客の質」の三要素によって高められます。',
            },
        ],
    },
    lesson2: {
        passingScore: 2,
        questions: [
            {
                question: 'マーケティングにおける4Pのうち「Price（価格）」が意味するものはどれですか？',
                options: ['製品（Product）', '流通（Place）', '販売促進（Promotion）', '価格（Price）'],
                answerIndex: 3,
                explanation: '4Pは Product・Price・Place・Promotion の4要素です。価格戦略は競争力に直結する重要な要素です。',
            },
            {
                question: '4Pのうち「Promotion（プロモーション）」に含まれるものはどれですか？',
                options: [
                    '商品の品質管理',
                    '広告・チラシ・キャンペーン活動',
                    '商品の流通経路の設計',
                    '販売価格の決定',
                ],
                answerIndex: 1,
                explanation: 'プロモーションは「顧客に商品を知ってもらうための活動」全般を指します。広告・PR・セールスプロモーションなどが含まれます。',
            },
            {
                question: 'マーケット・セグメンテーションの主な目的はどれですか？',
                options: [
                    'すべての顧客に同じアプローチをする',
                    '市場を細分化し、特定の顧客層に効果的にアプローチする',
                    '競合他社の価格を常時監視する',
                    '在庫管理を効率化する',
                ],
                answerIndex: 1,
                explanation: '市場をグループ（セグメント）に分け、それぞれに最適な戦略をとることで効率的なマーケティングが実現します。',
            },
        ],
    },
    lesson3: {
        passingScore: 2,
        questions: [
            {
                question: '魅力的で快適な売り場作りのことを何と呼びますか？',
                options: ['SEO', 'VMD（ビジュアル・マーチャンダイジング）', 'ROI', 'CRM'],
                answerIndex: 1,
                explanation: 'VMD（Visual Merchandising）は「見せる販売」の技術で、陳列・色・照明などで購買意欲を高めます。',
            },
            {
                question: '商品陳列の「ゴールデンゾーン」とはどの高さを指しますか？',
                options: [
                    '床に近い低い位置（0〜60cm）',
                    '目線に近い高さ（85〜150cm）',
                    '天井に近い高い位置（180cm以上）',
                    '棚の一番端の位置',
                ],
                answerIndex: 1,
                explanation: 'ゴールデンゾーンは視線が自然に向かう85〜150cmの高さ。主力商品・高利益商品をここに配置するのが基本です。',
            },
            {
                question: '店舗の清潔感を保つことが最も重要な理由はどれですか？',
                options: [
                    'クリーニング費用を節約できるから',
                    '従業員の仕事量を増やすため',
                    '顧客の購買意欲を高め、店舗への信頼感につながるから',
                    '商品をより多く陳列できるスペースが生まれるから',
                ],
                answerIndex: 2,
                explanation: '清潔な店舗は顧客に「信頼できる店」という印象を与え、滞在時間・購買率の向上につながります。',
            },
        ],
    },
    lesson4: {
        passingScore: 2,
        questions: [
            {
                question: '商品知識を持つメリットとして「不適切な」ものはどれですか？',
                options: [
                    'お客様の質問に自信を持って答えられる',
                    '説得力のある商品説明ができる',
                    'トレンドを把握して積極的な提案ができる',
                    '商品名を覚えるだけで十分なので楽ができる',
                ],
                answerIndex: 3,
                explanation: '商品知識は名称だけでなく特長・素材・使い方・競合比較まで深く理解することが重要です。',
            },
            {
                question: '商品知識を深める最も効果的な方法はどれですか？',
                options: [
                    '商品カタログを一度だけ読む',
                    '実際に商品を使ってみる・メーカー研修を受けるなど積極的に学ぶ',
                    '先輩に全て任せて自分では調べない',
                    'お客様の質問には「わかりません」と答える',
                ],
                answerIndex: 1,
                explanation: '体験・研修・自習を組み合わせることで、お客様に「生きた情報」を提供できる知識が身につきます。',
            },
            {
                question: '商品の特長をお客様に伝える正しいアプローチはどれですか？',
                options: [
                    '専門用語を多用して詳しく説明する',
                    'お客様のニーズに合わせてメリットをわかりやすく伝える',
                    '自分が気に入っている商品だけを推薦する',
                    '価格の安さだけを強調する',
                ],
                answerIndex: 1,
                explanation: 'お客様は「この商品が自分に何をもたらすか」を知りたがっています。ニーズに寄り添ったベネフィット訴求が効果的です。',
            },
        ],
    },
    lesson5: {
        passingScore: 2,
        questions: [
            {
                question: '接客サービスによって構築すべき最も重要なものは何ですか？',
                options: ['在庫の確保', 'お客様との信頼関係', '従業員同士の競争', '店舗のSNSフォロワー数'],
                answerIndex: 1,
                explanation: '接客の本質は信頼関係の構築。一度築いた信頼はリピーターを生み、店舗の安定した売上につながります。',
            },
            {
                question: '「傾聴」として正しい接客姿勢はどれですか？',
                options: [
                    'お客様の話を遮って自分の意見を述べる',
                    'お客様が話している間にスマートフォンを確認する',
                    'お客様の話をしっかりと聞き、共感の姿勢を示す',
                    '答えが分かったらすぐに会話を終わらせる',
                ],
                answerIndex: 2,
                explanation: '傾聴（アクティブリスニング）は顧客満足の基本。うなずきや相づちを交え、相手が「話を聞いてもらえている」と感じられる対応が重要です。',
            },
            {
                question: 'クレームを受けた際の基本的な対応として正しいものはどれですか？',
                options: [
                    '「私のせいではない」と責任を回避する',
                    'まずお客様に謝罪し、状況を丁寧に確認する',
                    'クレームを無視して他の業務を続ける',
                    'クレームの内容を記録せずに口頭だけで処理する',
                ],
                answerIndex: 1,
                explanation: 'クレーム対応の基本は「謝罪→傾聴→確認→解決策の提案→フォロー」。誠実な対応が逆に顧客の信頼を高めることもあります。',
            },
        ],
    },
    quiz1: {
        passingScore: 3,
        questions: [
            {
                question: '小売業の「ロス」として正しいものはどれですか？',
                options: [
                    '売上の増加分',
                    '万引き・廃棄・値引きなどによる商品の損失',
                    '従業員の有給休暇取得',
                    '在庫の増加',
                ],
                answerIndex: 1,
                explanation: 'ロス（損失）は小売業の利益を直接圧迫します。ロス対策（防犯・廃棄管理）は利益率改善の基本施策です。',
            },
            {
                question: 'POSシステムの主な目的はどれですか？',
                options: [
                    '従業員の勤怠管理',
                    '販売データの収集・在庫管理の効率化',
                    '店舗の防犯カメラ管理',
                    '商品の発注書作成',
                ],
                answerIndex: 1,
                explanation: 'POS（Point of Sale）は販売時点での情報収集システム。リアルタイムの在庫・売上データを活用して発注精度を高めます。',
            },
            {
                question: 'お客様への正しい言葉遣いとして適切なものはどれですか？',
                options: [
                    '「なるほどですね」',
                    '「ちょっと待ってください」',
                    '「かしこまりました」',
                    '「了解しました」',
                ],
                answerIndex: 2,
                explanation: '「かしこまりました」は敬意を表す最も丁寧な承諾語。「了解」はビジネス敬語として不適切な場合があります。',
            },
            {
                question: 'リピーターを増やすために最も重要なことはどれですか？',
                options: [
                    '毎日セールや値引きを行う',
                    '顧客満足度を高め、継続的な信頼関係を構築する',
                    '店舗の場所を頻繁に変える',
                    '商品数を絞って専門化する',
                ],
                answerIndex: 1,
                explanation: 'リピーターは「また来たい」と思う体験から生まれます。価格より「また会いたい」と思わせる接客・サービスが鍵です。',
            },
            {
                question: '販売士が「接客の5大要素」として押さえるべき中に含まれないものはどれですか？',
                options: [
                    '挨拶（あいさつ）',
                    '笑顔（えがお）',
                    '身だしなみ',
                    '売上ノルマの達成',
                ],
                answerIndex: 3,
                explanation: '接客5大要素は「挨拶・笑顔・言葉遣い・身だしなみ・態度」。ノルマ達成は目標であっても接客要素ではありません。',
            },
        ],
    },
};

const DEFAULT_QUIZ: QuizDef = {
    passingScore: 1,
    questions: [
        {
            question: 'このレッスンの確認テストです。準備はいいですか？',
            options: ['はい、準備OKです！', 'もう少し動画を見直す', '少し不安がある', 'まだ準備中'],
            answerIndex: 0,
            explanation: 'どんどん前に進んでいきましょう！',
        },
    ],
};

export function QuizModal({ lessonId, onClose, onComplete }: QuizProps) {
    const quizDef = QUIZ_DATA[lessonId] ?? DEFAULT_QUIZ;
    const { questions, passingScore } = quizDef;
    const totalQuestions = questions.length;

    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [correctCount, setCorrectCount] = useState(0);
    const [isFinished, setIsFinished] = useState(false);

    const currentQuestion = questions[currentIndex];
    const isCorrect = selectedOption === currentQuestion.answerIndex;

    // 最終スコアは全問回答済み後のみ確定
    const finalCorrectCount = isFinished
        ? correctCount
        : correctCount + (isSubmitted && isCorrect ? 1 : 0);
    const finalPassed = finalCorrectCount >= passingScore;

    const handleSubmit = () => {
        if (selectedOption === null) return;
        setIsSubmitted(true);
        if (selectedOption === currentQuestion.answerIndex) {
            setCorrectCount((c) => c + 1);
        }
    };

    const handleNext = () => {
        if (currentIndex + 1 < totalQuestions) {
            setCurrentIndex((i) => i + 1);
            setSelectedOption(null);
            setIsSubmitted(false);
        } else {
            setIsFinished(true);
        }
    };

    const handleRetry = () => {
        setCurrentIndex(0);
        setSelectedOption(null);
        setIsSubmitted(false);
        setCorrectCount(0);
        setIsFinished(false);
    };

    // ===== 結果画面 =====
    if (isFinished) {
        return (
            <div className="bg-slate-50 rounded-2xl p-4 sm:p-8 max-w-lg sm:max-w-2xl w-full mx-auto shadow-inner border-2 border-slate-100 flex flex-col items-center text-center justify-center gap-4 sm:gap-6 py-8">
                <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center shadow-lg ${finalPassed ? 'bg-green-100' : 'bg-red-100'}`}>
                    {finalPassed
                        ? <Trophy size={40} className="text-green-500 sm:w-12 sm:h-12" />
                        : <XCircle size={40} className="text-red-400 sm:w-12 sm:h-12" />
                    }
                </div>

                <div>
                    <h3 className={`text-2xl sm:text-3xl font-black mb-2 ${finalPassed ? 'text-green-700' : 'text-red-600'}`}>
                        {finalPassed ? '合格！' : '不合格'}
                    </h3>
                    <p className="text-slate-500 font-bold text-base sm:text-lg">
                        {finalCorrectCount} / {totalQuestions} 問正解
                    </p>
                    <p className="text-slate-400 text-sm mt-1">合格ライン: {passingScore}問以上</p>
                </div>

                {finalPassed ? (
                    <div className="text-green-700 font-bold text-sm bg-green-50 border border-green-200 px-4 py-3 rounded-xl w-full">
                        すべての問題に挑戦しました。おめでとうございます！
                    </div>
                ) : (
                    <div className="text-red-600 font-bold text-sm bg-red-50 border border-red-200 px-4 py-3 rounded-xl w-full">
                        もう少しです。動画を見直してから再挑戦しましょう！
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    {!finalPassed && (
                        <button
                            onClick={handleRetry}
                            className="flex items-center justify-center gap-2 px-6 py-4 sm:py-3 rounded-xl font-black text-slate-600 bg-white border-2 border-slate-200 active:bg-slate-50 transition-all min-h-[44px]"
                        >
                            <RefreshCw size={18} /> 再挑戦する
                        </button>
                    )}
                    <button
                        onClick={finalPassed ? onComplete : onClose}
                        className={`flex items-center justify-center gap-2 px-8 py-4 sm:py-3 rounded-xl font-black text-white shadow-lg transition-all active:scale-95 min-h-[44px]
                            ${finalPassed ? 'bg-green-500 hover:bg-green-600' : 'bg-slate-700 hover:bg-slate-600'}`}
                    >
                        {finalPassed ? '完了して進む' : '動画に戻る'} <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        );
    }

    // ===== クイズ回答画面 =====
    return (
        <div className="bg-slate-50 rounded-2xl p-4 sm:p-8 max-w-lg sm:max-w-2xl w-full mx-auto shadow-inner border-2 border-slate-100 flex flex-col">
            {/* ヘッダー */}
            <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-100 text-blue-600 p-2.5 rounded-full">
                        <HelpCircle size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-800">確認小テスト</h3>
                        <p className="text-blue-600 font-bold text-xs tracking-widest">QUIZ TIME</p>
                    </div>
                </div>
                <span className="text-sm font-black text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-full">
                    問 {currentIndex + 1} / {totalQuestions}
                </span>
            </div>

            {/* 進捗バー */}
            <div className="w-full bg-slate-200 rounded-full h-2 mb-4 sm:mb-6 overflow-hidden">
                <div
                    className="bg-blue-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${((currentIndex) / totalQuestions) * 100}%` }}
                />
            </div>

            {/* 問題文 */}
            <div className="flex flex-col">
                <h4 className="text-base sm:text-lg font-bold text-slate-700 mb-4 sm:mb-6 leading-relaxed">
                    Q{currentIndex + 1}. {currentQuestion.question}
                </h4>

                {/* 選択肢 */}
                <div className="flex flex-col gap-2 sm:gap-3">
                    {currentQuestion.options.map((option, index) => {
                        const isSelected = selectedOption === index;
                        const showCorrect = isSubmitted && index === currentQuestion.answerIndex;
                        const showWrong = isSubmitted && isSelected && index !== currentQuestion.answerIndex;

                        return (
                            <button
                                key={index}
                                onClick={() => !isSubmitted && setSelectedOption(index)}
                                disabled={isSubmitted}
                                className={`
                                    px-3 py-3 sm:p-4 rounded-xl border-2 text-left font-bold transition-all duration-200 flex items-center justify-between min-h-[52px]
                                    ${isSubmitted ? 'cursor-default' : 'active:scale-[0.98]'}
                                    ${isSelected && !isSubmitted ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md ring-2 ring-blue-200' : ''}
                                    ${showCorrect ? 'border-green-500 bg-green-50 text-green-700 ring-2 ring-green-200' : ''}
                                    ${showWrong ? 'border-red-400 bg-red-50 text-red-600' : ''}
                                    ${!isSelected && !isSubmitted ? 'border-slate-200 bg-white text-slate-600' : ''}
                                    ${isSubmitted && !showCorrect && !showWrong ? 'border-slate-200 bg-slate-100 text-slate-400' : ''}
                                `}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 shrink-0 font-black
                                        ${isSelected && !isSubmitted ? 'border-blue-500 bg-blue-500 text-white' : ''}
                                        ${showCorrect ? 'border-green-500 bg-green-500 text-white' : ''}
                                        ${showWrong ? 'border-red-400 bg-red-400 text-white' : ''}
                                        ${!isSelected && !isSubmitted ? 'border-slate-300 text-slate-400' : ''}
                                        ${isSubmitted && !showCorrect && !showWrong ? 'border-slate-300 text-slate-400' : ''}
                                    `}>
                                        {index + 1}
                                    </span>
                                    <span className="text-sm sm:text-base">{option}</span>
                                </div>
                                {showCorrect && <CheckCircle className="text-green-500 shrink-0" size={20} />}
                                {showWrong && <XCircle className="text-red-500 shrink-0" size={20} />}
                            </button>
                        );
                    })}
                </div>

                {/* 解説（回答後に表示） */}
                {isSubmitted && (
                    <div className={`mt-3 sm:mt-4 p-3 sm:p-4 rounded-xl border text-sm font-bold animate-in slide-in-from-bottom-2 duration-300 fade-in
                        ${isCorrect ? 'bg-green-50 border-green-200 text-green-700' : 'bg-orange-50 border-orange-200 text-orange-700'}`}
                    >
                        <span className="font-black mr-1">{isCorrect ? '✓ 正解！' : '✗ 不正解'}</span>
                        {currentQuestion.explanation}
                    </div>
                )}
            </div>

            {/* アクションボタン */}
            <div className="mt-4 sm:mt-6 flex justify-between items-center gap-3">
                <button
                    onClick={onClose}
                    className="px-3 py-3 font-bold text-slate-400 active:text-slate-600 active:bg-slate-200 rounded-xl transition-colors text-sm min-h-[44px]"
                >
                    動画に戻る
                </button>

                {!isSubmitted ? (
                    <button
                        onClick={handleSubmit}
                        disabled={selectedOption === null}
                        className="flex-1 sm:flex-none px-6 sm:px-8 py-3 font-black text-white bg-blue-600 active:bg-blue-700 rounded-xl shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none min-h-[44px]"
                    >
                        回答する
                    </button>
                ) : (
                    <button
                        onClick={handleNext}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 sm:px-8 py-3 rounded-xl font-black text-white shadow-lg transition-all active:scale-95 min-h-[44px]
                            ${isCorrect ? 'bg-green-500' : 'bg-blue-500'}`}
                    >
                        {currentIndex + 1 < totalQuestions ? '次の問題へ' : '結果を見る'} <ArrowRight size={18} />
                    </button>
                )}
            </div>
        </div>
    );
}
