"use client";

import React from 'react';
import { Sword, Shield, Zap, Star } from 'lucide-react';

// スキル定義インターフェース
export interface SkillDef {
    id: string;
    name: string;
    description: string;
    spCost: number;         // アンロック時のSP消費
    requiredLevel: number;
    requiredSkillId?: string;
    icon: React.ReactNode;
    type: 'active' | 'passive';
    color: string;
    // バトル効果
    mpCost?: number;           // MP消費量（activeスキルのみ）
    targetType?: 'single' | 'multi' | 'all' | 'dot' | 'self'; // 対象タイプ
    damageMultiplier?: number; // ダメージ倍率（通常攻撃比）
    hitCount?: number;         // multi時の対象数
    dotDuration?: number;      // dot時の持続フレーム数
    dotInterval?: number;      // dot時のダメージ間隔フレーム
    effectId?: string;         // エフェクトID
}

// 戦士スキルツリー
const WARRIOR_SKILLS: SkillDef[] = [
    {
        id: 'w_slash', name: '強斬り',
        description: '敵単体に2倍ダメージ。',
        spCost: 5, requiredLevel: 2,
        icon: <Sword size={24} />, type: 'active', color: 'from-orange-500 to-red-600',
        mpCost: 15, targetType: 'single', damageMultiplier: 2.0, effectId: 'power_slash',
    },
    {
        id: 'w_shield', name: '防御の構え',
        description: '次のダメージを1回無効化。',
        spCost: 8, requiredLevel: 3,
        icon: <Shield size={24} />, type: 'active', color: 'from-blue-500 to-indigo-600',
        mpCost: 20, targetType: 'self', effectId: 'shield',
    },
    {
        id: 'w_passive_atk', name: '筋力強化',
        description: '攻撃力が10%増加。',
        spCost: 10, requiredLevel: 4,
        icon: <Sword size={24} />, type: 'passive', color: 'from-gray-600 to-gray-800',
    },
    {
        id: 'w_cross', name: 'クロス斬り',
        description: '敵全体に1.5倍ダメージ。',
        spCost: 15, requiredLevel: 5, requiredSkillId: 'w_slash',
        icon: <Zap size={24} />, type: 'active', color: 'from-orange-600 to-red-700',
        mpCost: 30, targetType: 'all', damageMultiplier: 1.5, effectId: 'cross_slash',
    },
];

// 魔法使いスキルツリー
const MAGE_SKILLS: SkillDef[] = [
    {
        id: 'm_fire', name: 'ファイアボール',
        description: '敵単体に1.8倍の炎ダメージ。',
        spCost: 5, requiredLevel: 2,
        icon: <Zap size={24} />, type: 'active', color: 'from-orange-500 to-red-600',
        mpCost: 15, targetType: 'single', damageMultiplier: 1.8, effectId: 'fireball',
    },
    {
        id: 'm_shield', name: 'マナシールド',
        description: '次のダメージを1回無効化。',
        spCost: 8, requiredLevel: 3,
        icon: <Shield size={24} />, type: 'active', color: 'from-blue-500 to-indigo-600',
        mpCost: 20, targetType: 'self', effectId: 'shield',
    },
    {
        id: 'm_passive_int', name: '魔力強化',
        description: '魔法攻撃力が増加。',
        spCost: 10, requiredLevel: 4,
        icon: <Star size={24} />, type: 'passive', color: 'from-purple-600 to-purple-800',
    },
    {
        id: 'm_blizzard', name: 'ブリザード',
        description: '敵全体に持続ダメージ＋速度低下。',
        spCost: 12, requiredLevel: 5, requiredSkillId: 'm_fire',
        icon: <Zap size={24} />, type: 'active', color: 'from-sky-400 to-blue-600',
        mpCost: 25, targetType: 'dot', damageMultiplier: 1.2, dotDuration: 300, dotInterval: 60, effectId: 'blizzard',
    },
];

// 商人スキルツリー
const MERCHANT_SKILLS: SkillDef[] = [
    {
        id: 'me_coin', name: 'コイントス',
        description: '2体に1.5倍ダメージ。',
        spCost: 5, requiredLevel: 2,
        icon: <Star size={24} />, type: 'active', color: 'from-amber-400 to-yellow-600',
        mpCost: 10, targetType: 'multi', damageMultiplier: 1.5, hitCount: 2, effectId: 'coin_toss',
    },
    {
        id: 'me_bribe', name: 'ワイロ',
        description: '先頭の敵を即死（ボス以外）。',
        spCost: 10, requiredLevel: 3,
        icon: <Sword size={24} />, type: 'active', color: 'from-green-500 to-emerald-600',
        mpCost: 30, targetType: 'single', damageMultiplier: 99, effectId: 'bribe',
    },
    {
        id: 'me_passive_gold', name: '交渉術',
        description: 'ガチャチケ効率アップ。',
        spCost: 12, requiredLevel: 4,
        icon: <Shield size={24} />, type: 'passive', color: 'from-yellow-600 to-amber-800',
    },
    {
        id: 'me_deal', name: 'ビッグディール',
        description: '敵全体に2倍ダメージ。',
        spCost: 15, requiredLevel: 5, requiredSkillId: 'me_coin',
        icon: <Zap size={24} />, type: 'active', color: 'from-yellow-500 to-amber-700',
        mpCost: 35, targetType: 'all', damageMultiplier: 2.0, effectId: 'big_deal',
    },
];

// クラス別スキルツリー
export const CLASS_SKILL_TREES: Record<string, SkillDef[]> = {
    warrior: WARRIOR_SKILLS,
    mage: MAGE_SKILLS,
    merchant: MERCHANT_SKILLS,
};

// スキルIDからスキル定義を取得するヘルパー
export function getSkillById(skillId: string): SkillDef | undefined {
    for (const skills of Object.values(CLASS_SKILL_TREES)) {
        const found = skills.find(s => s.id === skillId);
        if (found) return found;
    }
    return undefined;
}
