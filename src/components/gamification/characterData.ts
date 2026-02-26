import { Sword, Wand2, Coins } from 'lucide-react';

// レベル1-4: 初期形態、レベル5-9: 第2進化、レベル10: 最終進化
// stagesは進化の見た目が変わるポイントのみ定義（ステータスはレベルに応じて補間）
export const CHARACTER_DATA = {
    warrior: {
        id: 'warrior',
        name: '戦士の道',
        icon: Sword,
        stages: [
            { level: 1, name: '農民', color: 'text-stone-500', bg: 'bg-stone-100', size: 32, imageUrl: '/images/chara/農民.png', stats: { hp: 10, atk: 5, def: 3, spd: 2 } },
            { level: 5, name: '兵士', color: 'text-blue-500', bg: 'bg-blue-100', size: 48, imageUrl: '/images/chara/兵士.png', stats: { hp: 30, atk: 18, def: 12, spd: 5 } },
            { level: 10, name: '騎士', color: 'text-indigo-600', bg: 'bg-indigo-100', size: 64, imageUrl: '/images/chara/騎士.png', stats: { hp: 60, atk: 40, def: 30, spd: 10 } },
        ],
        description: '地道な努力で徐々に力をつける道です。販売の基礎を固めます。'
    },
    mage: {
        id: 'mage',
        name: '魔法使いの道',
        icon: Wand2,
        stages: [
            { level: 1, name: '見習い', color: 'text-purple-400', bg: 'bg-purple-100', size: 32, imageUrl: '/images/chara/見習い魔法使い.png', stats: { hp: 6, atk: 8, def: 2, spd: 3 } },
            { level: 5, name: '魔法使い', color: 'text-purple-600', bg: 'bg-purple-200', size: 48, imageUrl: '/images/chara/ベテラン魔法使い.png', stats: { hp: 18, atk: 28, def: 8, spd: 7 } },
            { level: 10, name: '大魔導士', color: 'text-fuchsia-600', bg: 'bg-fuchsia-200', size: 64, imageUrl: '/images/chara/大賢者.png', stats: { hp: 35, atk: 55, def: 18, spd: 14 } },
        ],
        description: '知識を蓄え、知恵を巡らせる道です。マーケティングに強くなります。'
    },
    merchant: {
        id: 'merchant',
        name: '商人の道',
        icon: Coins,
        stages: [
            { level: 1, name: '行商人', color: 'text-amber-500', bg: 'bg-amber-100', size: 32, imageUrl: '/images/chara/商人.png', stats: { hp: 8, atk: 4, def: 4, spd: 5 } },
            { level: 5, name: '豪商', color: 'text-amber-600', bg: 'bg-amber-200', size: 48, imageUrl: '/images/chara/冒険者.png', stats: { hp: 22, atk: 14, def: 12, spd: 16 } },
            { level: 10, name: '大富豪', color: 'text-yellow-600', bg: 'bg-yellow-200', size: 64, imageUrl: '/images/chara/大富豪.png', stats: { hp: 45, atk: 30, def: 25, spd: 30 } },
        ],
        description: '販売のプロから豊かさを築く道です。接客サービスの極意を学びます。'
    }
} as const;

// レベルに応じたステータスを線形補間して返す
export function getStatsForLevel(characterId: string, level: number) {
    const charData = CHARACTER_DATA[characterId as keyof typeof CHARACTER_DATA];
    if (!charData) return { hp: 10, atk: 5, def: 3, spd: 2 };

    const stages = charData.stages;
    // 現在の進化段階を取得
    const currentStage = stages.slice().reverse().find(s => level >= s.level) || stages[0];
    const nextStage = stages.find(s => s.level > level);

    if (!nextStage) return { ...currentStage.stats };

    // 線形補間
    const progress = (level - currentStage.level) / (nextStage.level - currentStage.level);
    return {
        hp: Math.floor(currentStage.stats.hp + (nextStage.stats.hp - currentStage.stats.hp) * progress),
        atk: Math.floor(currentStage.stats.atk + (nextStage.stats.atk - currentStage.stats.atk) * progress),
        def: Math.floor(currentStage.stats.def + (nextStage.stats.def - currentStage.stats.def) * progress),
        spd: Math.floor(currentStage.stats.spd + (nextStage.stats.spd - currentStage.stats.spd) * progress),
    };
}
