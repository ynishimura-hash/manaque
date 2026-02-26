"use client";

import React, { useState } from 'react';
import { ToggleRight, ArrowLeft, Info, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

// 機能フラグの定義
const featureFlags = [
    {
        category: '学習の習慣化サポート',
        features: [
            { key: 'STREAK_BONUS', name: 'ストリークボーナス', description: '連続ログイン日数の記録とボーナス報酬', default: true },
            { key: 'LEARNING_HEATMAP', name: '学習ヒートマップ', description: 'カレンダー型の学習履歴（草生やし）グラフ', default: true },
        ],
    },
    {
        category: '反復学習・復習システム',
        features: [
            { key: 'DAILY_QUIZ', name: 'デイリークイズ', description: '1日1回のランダム出題', default: true },
            { key: 'WEAKNESS_OVERCOME', name: '苦手克服', description: '間違えた問題のストック・再挑戦機能', default: true },
        ],
    },
    {
        category: '腕試しとコレクション',
        features: [
            { key: 'MOCK_EXAM_TIME_ATTACK', name: '模擬試験タイムアタック', description: 'タイムアタック型の模擬試験モード', default: true },
            { key: 'BADGE_SYSTEM', name: 'バッジシステム', description: '条件達成によるバッジ・称号コレクション', default: true },
        ],
    },
    {
        category: '学習の利便性向上',
        features: [
            { key: 'AUDIO_ONLY_MODE', name: 'オーディオモード', description: '動画を音声だけで再生するポッドキャストモード', default: true },
        ],
    },
];

export default function FeatureFlagsPage() {
    // ローカルstateで管理（実際のプロダクションではサーバー/DBと連携）
    const [flags, setFlags] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        featureFlags.forEach(cat => cat.features.forEach(f => { initial[f.key] = f.default; }));
        return initial;
    });

    const toggleFlag = (key: string) => {
        setFlags(prev => {
            const newFlags = { ...prev, [key]: !prev[key] };
            toast.success(`${key} を ${newFlags[key] ? 'ON' : 'OFF'} に変更しました`);
            return newFlags;
        });
    };

    const enabledCount = Object.values(flags).filter(Boolean).length;
    const totalCount = Object.values(flags).length;

    return (
        <div className="space-y-8">
            {/* ヘッダー */}
            <div className="flex items-center gap-4">
                <Link href="/admin/game" className="text-slate-400 hover:text-slate-600 transition-colors">
                    <ArrowLeft size={24} />
                </Link>
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <ToggleRight className="text-emerald-500" /> 機能フラグ管理
                    </h1>
                    <p className="text-slate-500 font-bold mt-1">ゲーミフィケーション機能のON/OFF管理</p>
                </div>
            </div>

            {/* 概要 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-sm font-bold text-slate-500">有効な機能</p>
                    <p className="text-3xl font-black text-slate-900">{enabledCount} <span className="text-lg text-slate-400">/ {totalCount}</span></p>
                </div>
                <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-4 py-2 rounded-xl border border-amber-200">
                    <AlertTriangle size={16} />
                    <span className="font-bold">変更は即座に反映されます</span>
                </div>
            </div>

            {/* カテゴリ別トグル */}
            {featureFlags.map((category) => (
                <div key={category.category} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                        <h2 className="text-lg font-black text-slate-800">{category.category}</h2>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {category.features.map((feature) => (
                            <div key={feature.key} className="px-6 py-5 flex items-center justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-black text-slate-800">{feature.name}</h3>
                                        <code className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-mono">{feature.key}</code>
                                    </div>
                                    <p className="text-sm text-slate-500 font-bold mt-0.5">{feature.description}</p>
                                </div>
                                <button
                                    onClick={() => toggleFlag(feature.key)}
                                    className={`w-14 h-8 rounded-full transition-all relative shrink-0 ${flags[feature.key] ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                >
                                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm ${flags[feature.key] ? 'right-1' : 'left-1'}`} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {/* 注意事項 */}
            <div className="bg-blue-50 rounded-2xl border border-blue-200 p-6 flex items-start gap-3">
                <Info size={20} className="text-blue-500 shrink-0 mt-0.5" />
                <div>
                    <p className="font-black text-blue-800">注意事項</p>
                    <p className="text-sm text-blue-700 font-bold mt-1">
                        機能フラグの変更は <code className="bg-blue-100 px-1 rounded">src/config/features.ts</code> に反映する必要があります。
                        現在はUIのみの切り替えですが、本番環境ではサーバーとの連携が必要です。
                    </p>
                </div>
            </div>
        </div>
    );
}
