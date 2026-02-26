"use client";

import React from 'react';
import Link from 'next/link';
import {
    Gamepad2, Swords, Egg, Users, Package, Star,
    ArrowRight, BookOpen, Sparkles, Shield, Scroll,
    ToggleRight, Trophy, Map, Puzzle
} from 'lucide-react';

export default function GameAdminPage() {
    const sections = [
        {
            title: 'ゲームコンテンツ',
            description: 'ゲーム内のコンテンツ設定',
            items: [
                {
                    title: 'タワーディフェンス',
                    description: '問題セット・難易度・報酬設定',
                    icon: Swords,
                    href: '/game/tower-defense',
                    color: 'bg-red-500',
                    external: true,
                },
                {
                    title: 'デイリークイズ',
                    description: '毎日の出題設定・報酬',
                    icon: Puzzle,
                    href: '/game/daily-quiz',
                    color: 'bg-amber-500',
                    external: true,
                },
                {
                    title: '模擬試験',
                    description: 'タイムアタック問題・合格基準',
                    icon: Trophy,
                    href: '/game/mock-exam',
                    color: 'bg-purple-500',
                    external: true,
                },
                {
                    title: 'スキルツリー',
                    description: '職業・スキル解放条件',
                    icon: Map,
                    href: '/game/skill-tree',
                    color: 'bg-emerald-500',
                    external: true,
                },
            ],
        },
        {
            title: 'パートナー & ガチャ',
            description: 'パートナーやガチャの設定',
            items: [
                {
                    title: 'パートナー管理',
                    description: 'パートナー一覧・ステータス・進化設定',
                    icon: Users,
                    href: '/game/partner-room',
                    color: 'bg-indigo-500',
                    external: true,
                },
                {
                    title: '卵ガチャ設定',
                    description: '排出確率・天井設定・プール管理',
                    icon: Egg,
                    href: '#gacha',
                    color: 'bg-pink-500',
                },
                {
                    title: '特殊融合レシピ',
                    description: '融合レシピ・必要素材・進化先',
                    icon: Sparkles,
                    href: '#recipes',
                    color: 'bg-orange-500',
                },
            ],
        },
        {
            title: 'アイテム & 装備',
            description: 'ゲーム内アイテムの設定',
            items: [
                {
                    title: 'アイテム一覧',
                    description: '武器・防具・アクセサリー・アイテム',
                    icon: Package,
                    href: '#items',
                    color: 'bg-cyan-500',
                },
                {
                    title: '秘伝書（レシピ）',
                    description: '特殊融合に必要なレシピアイテム',
                    icon: Scroll,
                    href: '#recipes-items',
                    color: 'bg-amber-600',
                },
            ],
        },
        {
            title: '設定・バランス',
            description: 'ゲームバランスの調整',
            items: [
                {
                    title: '機能フラグ管理',
                    description: 'ゲーム機能のON/OFF切り替え',
                    icon: ToggleRight,
                    href: '/admin/game/features',
                    color: 'bg-slate-600',
                },
                {
                    title: 'レアリティ/確率設定',
                    description: 'ガチャ確率・ドロップ率',
                    icon: Star,
                    href: '#balance',
                    color: 'bg-yellow-500',
                },
            ],
        },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <Gamepad2 className="text-red-500" /> ゲーム管理
                </h1>
                <p className="text-slate-500 font-bold mt-1">ゲーミフィケーション機能の全体設定</p>
            </div>

            {/* 概要カード */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'パートナー種類', value: '15', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'アイテム数', value: '27', icon: Package, color: 'text-cyan-600', bg: 'bg-cyan-50' },
                    { label: '特殊融合', value: '3', icon: Sparkles, color: 'text-orange-600', bg: 'bg-orange-50' },
                    { label: '有効機能', value: '7/7', icon: ToggleRight, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <div className={`${stat.bg} ${stat.color} w-10 h-10 rounded-xl flex items-center justify-center mb-3`}>
                            <stat.icon size={20} />
                        </div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-wider">{stat.label}</p>
                        <p className="text-2xl font-black text-slate-900 mt-1">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* セクション */}
            {sections.map((section) => (
                <div key={section.title}>
                    <div className="mb-4">
                        <h2 className="text-xl font-black text-slate-800">{section.title}</h2>
                        <p className="text-sm text-slate-500 font-bold">{section.description}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {section.items.map((item) => {
                            const Tag = item.href.startsWith('/') && !item.href.startsWith('#') ? Link : 'div';
                            return (
                                <Tag
                                    key={item.title}
                                    href={item.href as any}
                                    target={item.external ? '_blank' : undefined}
                                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all group cursor-pointer flex items-start gap-4"
                                >
                                    <div className={`${item.color} text-white w-12 h-12 rounded-xl flex items-center justify-center shrink-0`}>
                                        <item.icon size={22} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-black text-slate-800 group-hover:text-slate-900">{item.title}</h3>
                                        <p className="text-sm text-slate-500 font-bold mt-0.5">{item.description}</p>
                                    </div>
                                    <ArrowRight size={18} className="text-slate-300 group-hover:text-slate-500 mt-1 transition-colors shrink-0" />
                                </Tag>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
