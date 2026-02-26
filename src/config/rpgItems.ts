import { CharacterType } from '@/store/useGamificationStore';

export type EquipmentType = 'weapon' | 'armor' | 'accessory' | 'item';
export type Rarity = 'N' | 'R' | 'SR' | 'SSR';
export type EffectType = 'EXP_BOOST' | 'TIME_SLOW' | 'SHIELD' | 'QUICK_KILL' | 'TICKET_DROP' | 'UNLOCK_RECIPE' | 'NONE';

export interface RpgItem {
    id: string;
    name: string;
    type: EquipmentType;
    rarity: Rarity;
    description: string;
    effectType: EffectType;
    effectValue: number; // % または 回数
    effectTargetId?: string; // 対象のパートナーIDなど (UNLOCK_RECIPE用)
    icon: string; // 後でAI生成画像パスに差し替え。今はLucideアイコン名などで仮置き
    imageUrl?: string; // 実際の画像がある場合
    requiredClass?: CharacterType[]; // 装備可能な職業。未指定なら全クラス可能
}

export const RPG_ITEMS: RpgItem[] = [
    // --- N (Normal) ---
    { id: 'wpn_n_1', name: '木の杖', type: 'weapon', rarity: 'N', description: 'どこにでもある普通の杖。魔法使い専用。', effectType: 'NONE', effectValue: 0, icon: 'wand', requiredClass: ['mage'] },
    { id: 'arm_n_1', name: '見習いのローブ', type: 'armor', rarity: 'N', description: '見習いが着る薄いローブ。', effectType: 'NONE', effectValue: 0, icon: 'shirt' },
    { id: 'acc_n_1', name: 'ありふれたお守り', type: 'accessory', rarity: 'N', description: '気休め。EXP獲得量+1%。', effectType: 'EXP_BOOST', effectValue: 1, icon: 'amulet' },
    { id: 'wpn_n_2', name: '古びた剣', type: 'weapon', rarity: 'N', description: '少し重い。戦士専用。敵の進行を1%遅らせる。', effectType: 'TIME_SLOW', effectValue: 1, icon: 'sword', requiredClass: ['warrior'] },
    { id: 'wpn_n_3', name: '木のそろばん', type: 'weapon', rarity: 'N', description: '計算が捗る。商人専用。チケットドロップ率+1%', effectType: 'TICKET_DROP', effectValue: 1, icon: 'calculator', requiredClass: ['merchant'] },
    { id: 'arm_n_2', name: '革の胸当て', type: 'armor', rarity: 'N', description: '誤答ダメージを1回防ぐ。', effectType: 'SHIELD', effectValue: 1, icon: 'shield' },

    // --- R (Rare) ---
    { id: 'wpn_r_1', name: '知恵のステッキ', type: 'weapon', rarity: 'R', description: '知識が湧いてくる。魔法使い専用。EXP獲得量+5%。', effectType: 'EXP_BOOST', effectValue: 5, icon: 'wand', requiredClass: ['mage'] },
    { id: 'acc_r_1', name: '集中力のメガネ', type: 'accessory', rarity: 'R', description: '制限時間を延長し敵の進行を5%遅らせる。', effectType: 'TIME_SLOW', effectValue: 5, icon: 'glasses' },
    { id: 'acc_r_2', name: '幸運のコイン', type: 'accessory', rarity: 'R', description: 'ガチャチケットのドロップ確率が上がる。商人専用。', effectType: 'TICKET_DROP', effectValue: 5, icon: 'coin', requiredClass: ['merchant'] },
    { id: 'arm_r_1', name: '騎士の鎧', type: 'armor', rarity: 'R', description: '誤答ダメージを2回防ぐ。', effectType: 'SHIELD', effectValue: 2, icon: 'armor', requiredClass: ['warrior'] },
    { id: 'wpn_r_2', name: '炎の指輪', type: 'weapon', rarity: 'R', description: '開幕時に10%の確率で敵1体を自動撃破する。', effectType: 'QUICK_KILL', effectValue: 10, icon: 'ring' },
    { id: 'wpn_r_3', name: '黄金のそろばん', type: 'weapon', rarity: 'R', description: '商人が使う黄金の計算具。商人専用。', effectType: 'EXP_BOOST', effectValue: 10, icon: 'calculator', requiredClass: ['merchant'] },

    // --- SR (Super Rare) ---
    { id: 'wpn_sr_1', name: '大魔導士の聖杖', type: 'weapon', rarity: 'SR', description: '膨大な魔力が宿る。魔法使い専用。EXP獲得量+15%。', effectType: 'EXP_BOOST', effectValue: 15, icon: 'staff', requiredClass: ['mage'] },
    { id: 'arm_sr_1', name: 'ミスリルアーマー', type: 'armor', rarity: 'SR', description: 'とても硬い。誤答ダメージを3回防ぐ。', effectType: 'SHIELD', effectValue: 3, icon: 'armor-shiny', requiredClass: ['warrior'] },
    { id: 'arm_sr_2', name: '賢者のローブ', type: 'armor', rarity: 'SR', description: '高い防御力を誇る。魔法使い専用。', effectType: 'SHIELD', effectValue: 3, icon: 'shirt', requiredClass: ['mage'] },
    { id: 'acc_sr_1', name: '時の懐中時計', type: 'accessory', rarity: 'SR', description: '時を操る。敵の進行を15%遅らせる。', effectType: 'TIME_SLOW', effectValue: 15, icon: 'pocket-watch' },
    { id: 'acc_sr_2', name: '商人の金言辞典', type: 'accessory', rarity: 'SR', description: '獲得EXPを10%高め、チケット効率も上げる。商人専用。', effectType: 'EXP_BOOST', effectValue: 10, icon: 'book', requiredClass: ['merchant'] },
    { id: 'wpn_sr_2', name: '雷光の剣', type: 'weapon', rarity: 'SR', description: '開幕ダッシュ確定。敵1体を即座に撃破。戦士専用。', effectType: 'QUICK_KILL', effectValue: 100, icon: 'sword-lightning', requiredClass: ['warrior'] },

    // 秘伝書（SR枠として追加）※アイテムとして分類
    { id: 'recipe_earth_titan', name: '大地の巨神の秘伝書', type: 'item', rarity: 'SR', description: '特殊融合レシピ：岩のゴーレム×2 + 土のスピリット×2 (全てLv.Max & 限界突破Max)', effectType: 'UNLOCK_RECIPE', effectValue: 0, effectTargetId: '13', icon: 'book', imageUrl: '/images/items/recipe_earth_titan.png' },
    { id: 'recipe_yin_yang_beast', name: '陰陽の獣の秘伝書', type: 'item', rarity: 'SR', description: '特殊融合レシピ：白の聖獣×1 + 黒の幻獣×1 + 紫の魔獣×1 (全てLv.Max & 限界突破Max)', effectType: 'UNLOCK_RECIPE', effectValue: 0, effectTargetId: '14', icon: 'book', imageUrl: '/images/items/recipe_yin_yang_beast.png' },
    { id: 'recipe_elemental_king', name: '虹の精霊王の秘伝書', type: 'item', rarity: 'SSR', description: '特殊融合レシピ：赤の精霊×1 + 青の精霊×1 + 緑の精霊×1 (全てLv.Max & 限界突破Max)', effectType: 'UNLOCK_RECIPE', effectValue: 0, effectTargetId: '15', icon: 'book', imageUrl: '/images/items/recipe_elemental_king.png' },

    // --- SSR (Specially Super Rare) ---
    { id: 'wpn_ssr_1', name: '叡智の王笏', type: 'weapon', rarity: 'SSR', description: '思考を別次元へ。魔法使い専用。EXP獲得量+30%。', effectType: 'EXP_BOOST', effectValue: 30, icon: 'scepter', requiredClass: ['mage'] },
    { id: 'arm_ssr_1', name: '聖竜の加護盾', type: 'armor', rarity: 'SSR', description: '絶対防御。戦士専用。誤答ダメージを5回防ぐ。', effectType: 'SHIELD', effectValue: 5, icon: 'shield-dragon', requiredClass: ['warrior'] },
    { id: 'acc_ssr_1', name: '時空の砂時計', type: 'accessory', rarity: 'SSR', description: '敵の進行を30%遅延させ、絶対的な余裕を生む。', effectType: 'TIME_SLOW', effectValue: 30, icon: 'hourglass' },
    { id: 'wpn_ssr_2', name: 'エクスカリバー', type: 'weapon', rarity: 'SSR', description: '聖なる剣。開幕2体の敵を一掃する。戦士専用。', effectType: 'QUICK_KILL', effectValue: 200, icon: 'sword-holy', requiredClass: ['warrior'] },
    { id: 'wpn_ssr_3', name: '奇跡のレジスター', type: 'weapon', rarity: 'SSR', description: '究極の商売道具。商人専用。EXPとチケットを大幅アップ。', effectType: 'TICKET_DROP', effectValue: 50, icon: 'monitor', requiredClass: ['merchant'] },
    { id: 'acc_ssr_2', name: '伝説の販売士バッジ', type: 'accessory', rarity: 'SSR', description: '資格の極意。EXP獲得量+50%。商人専用。', effectType: 'EXP_BOOST', effectValue: 50, icon: 'badge', requiredClass: ['merchant'] },
];

export const getEquipmentDetails = (id: string | null): RpgItem | null => {
    if (!id) return null;
    return RPG_ITEMS.find(item => item.id === id) || null;
};
