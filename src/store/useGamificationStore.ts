import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CharacterType = 'warrior' | 'mage' | 'merchant';

// Lv1〜Lv10: 各レベルの開始累計EXP（100EXPごとに1レベルアップ）
export const LEVEL_THRESHOLDS = [0, 100, 200, 300, 400, 500, 600, 700, 800, 900];

// ─── ログインボーナス節目設計 ────────────────────────────────────────────
// 連続ログイン日数に応じた追加チケット報酬
// 3の倍数日 → 装備チケット+1、7の倍数日 → さらに卵チケット+1
export const LOGIN_MILESTONE = {
    gachaTicketEvery: 3,   // 3日ごとに装備チケット1枚
    eggTicketEvery: 7,     // 7日ごとに卵チケット1枚
};

export interface LearningHistoryRecord {
    date: string; // YYYY-MM-DD
    expGained: number;
}

export interface WeaknessRecord {
    questionId: string;
    failedCount: number;
    lastFailedAt: string;
}

export interface EarnedBadge {
    id: string;
    unlockedAt: string;
}

export interface PartnerInstance {
    instanceId: string;
    partnerId: string;
    customName?: string;
    level: number;
    exp: number;
    limitBreak: number;
    acquiredAt: number;
}

export interface CharacterProgress {
    exp: number;
    level: number;
    equipment: { weapon: string | null; armor: string | null; accessory: string | null };
    unlockedSkills: string[];
    equippedSkills: string[];
}

// ログインボーナスの戻り値（チケット付与情報も含む）
export interface LoginBonusResult {
    bonusExp: number;
    newStreak: number;
    gachaTickets: number; // この日に付与された装備チケット数
    eggTickets: number;   // この日に付与された卵チケット数
}

export interface GamificationState {
    selectedCharacterId: CharacterType | null;
    exp: number;
    level: number;
    completedLessons: string[];

    // 習慣化
    streakCount: number;
    lastLoginDate: string | null;
    learningHistory: LearningHistoryRecord[];

    // デイリークイズ・弱点
    lastDailyQuizDate: string | null;
    weaknessLibrary: WeaknessRecord[];

    // バッジ
    earnedBadges: EarnedBadge[];

    // リソース
    sp: number;
    gachaTickets: number;
    eggTickets: number;
    eggTicketFragments: number;
    eggGachaCount: number;
    inventory: string[];
    equipment: { weapon: string | null; armor: string | null; accessory: string | null };
    unlockedSkills: string[];
    equippedSkills: string[];
    storyProgress: number;

    // EXP目標達成報酬の受け取り管理（1日1回）
    lastExpGoalRewardDate: string | null;

    // クラス並行育成
    savedProgress: Partial<Record<CharacterType, CharacterProgress>>;
    unlockedClasses: CharacterType[];
    unlockClass: (id: CharacterType) => void;

    // パートナー
    selectedPartnerId: string | null;
    partnerInventory: PartnerInstance[];
    selectPartner: (id: string | null) => void;
    addPartnersToInventory: (partnerIds: string[]) => void;
    mergePartners: (baseInstanceId: string, materialInstanceIds: string[], addedLevel: number, addedLimitBreak: number) => void;
    evolvePartner: (baseInstanceId: string, materialInstanceIds: string[], newPartnerId: string) => void;
    convertPartnersToFragments: (materials: { instanceId: string; rarity: string }[]) => void;
    renamePartner: (instanceId: string, newName: string) => void;

    // 基本アクション
    selectCharacter: (id: CharacterType) => void;
    addExp: (amount: number) => void;
    markLessonComplete: (lessonId: string, expOverride?: number) => void;
    resetProgress: () => void;
    forceEvolution: (direction: 'up' | 'down') => void;

    // リソース操作
    addSp: (amount: number) => void;
    consumeSp: (amount: number) => boolean;
    addGachaTickets: (amount: number) => void;
    consumeGachaTickets: (amount: number) => boolean;
    addEggTickets: (amount: number) => void;
    consumeEggTickets: (amount: number) => boolean;
    incrementEggGachaCount: (amount: number) => void;
    obtainEquipment: (itemId: string) => void;
    equipItem: (slot: 'weapon' | 'armor' | 'accessory', itemId: string | null) => void;
    unlockSkill: (skillId: string) => void;
    equipSkill: (skillId: string) => void;
    unequipSkill: (skillId: string) => void;
    advanceStory: () => void;

    // ログインボーナス（節目チケット付与を含む）
    checkAndAddLoginBonus: () => LoginBonusResult | null;

    // デイリークイズ完了
    markDailyQuizComplete: (expGain: number, ticketGain?: number) => void;

    // EXP目標達成報酬（1日1回「受け取る」方式）
    claimExpGoalReward: () => { gachaTickets: number; sp: number } | null;

    // 弱点ライブラリ
    recordWeakness: (questionId: string) => void;
    removeWeakness: (questionId: string) => void;

    // バッジ判定（新規獲得IDを返す）
    checkAndAwardBadges: () => string[];

    // ウェルカムギフト
    hasReceivedWelcomeGift: boolean;
    claimWelcomeGift: () => boolean;

    // 進化演出フラグ
    isEvolutionReady: boolean;
    clearEvolutionReady: () => void;

    // クラウドセーブ
    syncToCloud: () => Promise<void>;
    loadFromCloud: () => Promise<boolean>;
}

const getTodayString = () => new Date().toISOString().split('T')[0];

export const useGamificationStore = create<GamificationState>()(
    persist(
        (set, get) => ({
            selectedCharacterId: null,
            exp: 0,
            level: 1,
            completedLessons: [],
            streakCount: 0,
            lastLoginDate: null,
            learningHistory: [],
            lastDailyQuizDate: null,
            weaknessLibrary: [],
            earnedBadges: [],
            lastExpGoalRewardDate: null,

            sp: 0,
            gachaTickets: 0,
            eggTickets: 0,
            eggTicketFragments: 0,
            eggGachaCount: 0,
            inventory: [],
            equipment: { weapon: null, armor: null, accessory: null },
            unlockedSkills: [],
            equippedSkills: [],
            storyProgress: 1,
            isEvolutionReady: false,
            partnerInventory: [],
            savedProgress: {},
            unlockedClasses: [],
            selectedPartnerId: null,
            hasReceivedWelcomeGift: false,

            claimWelcomeGift: () => {
                if (get().hasReceivedWelcomeGift) return false;
                set((state) => ({
                    hasReceivedWelcomeGift: true,
                    gachaTickets: state.gachaTickets + 20,
                    eggTickets: state.eggTickets + 20,
                }));
                return true;
            },

            syncToCloud: async () => {
                try {
                    const state = get();
                    const stateToSave = { ...state };
                    delete (stateToSave as any).syncToCloud;
                    delete (stateToSave as any).loadFromCloud;
                    await fetch('/api/gamification/save', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ state: stateToSave }),
                    });
                } catch (error) {
                    console.error('Failed to sync gamification state to cloud', error);
                }
            },

            loadFromCloud: async () => {
                try {
                    const res = await fetch('/api/gamification/load');
                    if (!res.ok) return false;
                    const { state } = await res.json();
                    if (state) { set(state); return true; }
                    return false;
                } catch (error) {
                    console.error('Failed to load gamification state from cloud', error);
                    return false;
                }
            },

            selectPartner: (id) => set({ selectedPartnerId: id }),

            unlockClass: (id) => set((state) => {
                if (!state.unlockedClasses.includes(id)) {
                    return { unlockedClasses: [...state.unlockedClasses, id] };
                }
                return state;
            }),

            selectCharacter: (id) => {
                const state = get();
                const newSavedProgress = { ...state.savedProgress };
                if (state.selectedCharacterId) {
                    newSavedProgress[state.selectedCharacterId] = {
                        exp: state.exp,
                        level: state.level,
                        equipment: state.equipment,
                        unlockedSkills: state.unlockedSkills,
                        equippedSkills: state.equippedSkills,
                    };
                }
                const loadedProgress = newSavedProgress[id] || {
                    exp: 0, level: 1,
                    equipment: { weapon: null, armor: null, accessory: null },
                    unlockedSkills: [], equippedSkills: [],
                };
                const newUnlockedClasses = state.unlockedClasses.includes(id)
                    ? state.unlockedClasses
                    : [...state.unlockedClasses, id];
                // ウェルカムギフト：初回キャラ選択時にチケット20枚ずつプレゼント
                const welcomeBonus = !state.hasReceivedWelcomeGift;
                set({
                    selectedCharacterId: id,
                    exp: loadedProgress.exp,
                    level: loadedProgress.level,
                    equipment: loadedProgress.equipment,
                    unlockedSkills: loadedProgress.unlockedSkills,
                    equippedSkills: loadedProgress.equippedSkills || [],
                    savedProgress: newSavedProgress,
                    unlockedClasses: newUnlockedClasses,
                    ...(welcomeBonus ? {
                        hasReceivedWelcomeGift: true,
                        gachaTickets: state.gachaTickets + 20,
                        eggTickets: state.eggTickets + 20,
                    } : {}),
                });
            },

            addExp: (amount) => set((state) => {
                const newExp = state.exp + amount;
                const newLevel = Math.min(10, Math.floor(newExp / 100) + 1);
                let hasJustEvolved = false;
                if ((newLevel >= 5 && state.level < 5) || (newLevel >= 10 && state.level < 10)) {
                    hasJustEvolved = true;
                }
                const today = getTodayString();
                const newHistory = [...state.learningHistory];
                const todayRecord = newHistory.find(r => r.date === today);
                if (todayRecord) {
                    todayRecord.expGained += amount;
                } else {
                    newHistory.push({ date: today, expGained: amount });
                }
                if (hasJustEvolved) {
                    return { exp: newExp, level: newLevel, learningHistory: newHistory, isEvolutionReady: true };
                }
                return { exp: newExp, level: newLevel, learningHistory: newHistory };
            }),

            clearEvolutionReady: () => set({ isEvolutionReady: false }),

            markLessonComplete: (lessonId, expOverride) => {
                const state = get();
                if (state.completedLessons.includes(lessonId)) return;
                set({ completedLessons: [...state.completedLessons, lessonId] });
                get().addExp(expOverride ?? 50);
                get().addSp(2);
                get().addGachaTickets(1); // レッスン完了: 装備チケット +1
                get().checkAndAwardBadges();
            },

            resetProgress: () => {
                const state = get();
                const newSavedProgress = { ...state.savedProgress };
                if (state.selectedCharacterId) {
                    newSavedProgress[state.selectedCharacterId] = {
                        exp: state.exp, level: state.level,
                        equipment: state.equipment,
                        unlockedSkills: state.unlockedSkills,
                        equippedSkills: state.equippedSkills,
                    };
                }
                set({ selectedCharacterId: null, savedProgress: newSavedProgress });
            },

            addSp: (amount) => set((state) => ({ sp: state.sp + amount })),
            consumeSp: (amount) => {
                const state = get();
                if (state.sp >= amount) { set({ sp: state.sp - amount }); return true; }
                return false;
            },
            addGachaTickets: (amount) => set((state) => ({ gachaTickets: state.gachaTickets + amount })),
            consumeGachaTickets: (amount) => {
                const state = get();
                if (state.gachaTickets >= amount) { set({ gachaTickets: state.gachaTickets - amount }); return true; }
                return false;
            },
            addEggTickets: (amount) => set((state) => ({ eggTickets: state.eggTickets + amount })),
            consumeEggTickets: (amount) => {
                const state = get();
                if (state.eggTickets >= amount) { set({ eggTickets: state.eggTickets - amount }); return true; }
                return false;
            },
            incrementEggGachaCount: (amount) => set((state) => ({ eggGachaCount: state.eggGachaCount + amount })),
            obtainEquipment: (itemId) => set((state) => ({ inventory: [...state.inventory, itemId] })),
            equipItem: (slot, itemId) => set((state) => ({ equipment: { ...state.equipment, [slot]: itemId } })),
            unlockSkill: (skillId) => set((state) => {
                if (!state.unlockedSkills.includes(skillId)) return { unlockedSkills: [...state.unlockedSkills, skillId] };
                return state;
            }),
            equipSkill: (skillId) => set((state) => {
                if (state.equippedSkills.length >= 3) return state;
                if (state.equippedSkills.includes(skillId)) return state;
                return { equippedSkills: [...state.equippedSkills, skillId] };
            }),
            unequipSkill: (skillId) => set((state) => ({
                equippedSkills: state.equippedSkills.filter(id => id !== skillId),
            })),
            advanceStory: () => set((state) => ({
                storyProgress: Math.min(state.storyProgress + 1, 5),
            })),

            addPartnersToInventory: (partnerIds) => set((state) => {
                const newPartners = partnerIds.map(id => ({
                    instanceId: crypto.randomUUID(), partnerId: id,
                    level: 1, exp: 0, limitBreak: 0, acquiredAt: Date.now(),
                }));
                return { partnerInventory: [...state.partnerInventory, ...newPartners] };
            }),

            mergePartners: (baseInstanceId, materialInstanceIds, addedLevel, addedLimitBreak) => set((state) => {
                const baseIndex = state.partnerInventory.findIndex(p => p.instanceId === baseInstanceId);
                if (baseIndex === -1) return state;
                const basePartner = state.partnerInventory[baseIndex];
                const newLevel = (basePartner.level || 1) + addedLevel;
                const newLimitBreak = Math.min((basePartner.limitBreak || 0) + addedLimitBreak, 5);
                const newInventory = state.partnerInventory.filter(p => !materialInstanceIds.includes(p.instanceId));
                newInventory[newInventory.findIndex(p => p.instanceId === baseInstanceId)] = { ...basePartner, level: newLevel, limitBreak: newLimitBreak };
                return { partnerInventory: newInventory };
            }),

            evolvePartner: (baseInstanceId, materialInstanceIds, newPartnerId) => set((state) => {
                const removingIds = [baseInstanceId, ...materialInstanceIds];
                const newInventory = state.partnerInventory.filter(p => !removingIds.includes(p.instanceId));
                const evolvedPartner = { instanceId: crypto.randomUUID(), partnerId: newPartnerId, level: 1, exp: 0, limitBreak: 0, acquiredAt: Date.now() };
                const newSelectedId = removingIds.includes(state.selectedPartnerId || '') ? evolvedPartner.instanceId : state.selectedPartnerId;
                return { partnerInventory: [...newInventory, evolvedPartner], selectedPartnerId: newSelectedId };
            }),

            convertPartnersToFragments: (materials) => set((state) => {
                const pieceValues: Record<string, number> = { SSR: 10, SR: 5, R: 2, N: 1 };
                let totalFragments = state.eggTicketFragments;
                const removingIds = materials.map(m => m.instanceId);
                materials.forEach(m => { totalFragments += pieceValues[m.rarity] || 1; });
                const newTickets = state.eggTickets + Math.floor(totalFragments / 5);
                const newFragments = totalFragments % 5;
                const newInventory = state.partnerInventory.filter(p => !removingIds.includes(p.instanceId));
                const newSelectedId = removingIds.includes(state.selectedPartnerId || '') ? null : state.selectedPartnerId;
                return { partnerInventory: newInventory, eggTickets: newTickets, eggTicketFragments: newFragments, selectedPartnerId: newSelectedId };
            }),

            renamePartner: (instanceId, newName) => set((state) => {
                const index = state.partnerInventory.findIndex(p => p.instanceId === instanceId);
                if (index === -1) return state;
                const newInventory = [...state.partnerInventory];
                newInventory[index] = { ...newInventory[index], customName: newName };
                return { partnerInventory: newInventory };
            }),

            forceEvolution: (direction) => {
                set((state) => {
                    let nextLevel = state.level;
                    let nextExp = state.exp;
                    if (direction === 'up' && state.level < 10) {
                        nextLevel = state.level + 1;
                        nextExp = LEVEL_THRESHOLDS[nextLevel - 1];
                    } else if (direction === 'down' && state.level > 1) {
                        nextLevel = state.level - 1;
                        nextExp = LEVEL_THRESHOLDS[nextLevel - 1];
                    }
                    return { level: nextLevel, exp: nextExp };
                });
                get().checkAndAwardBadges();
            },

            // ─── ログインボーナス（節目チケット付与付き）────────────────────────
            checkAndAddLoginBonus: () => {
                const state = get();
                const today = getTodayString();
                if (state.lastLoginDate === today) return null;

                let newStreak = 1;
                let bonusExp = 10;

                if (state.lastLoginDate) {
                    const lastDate = new Date(state.lastLoginDate);
                    const currentDate = new Date(today);
                    const diffDays = Math.ceil(
                        Math.abs(currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
                    );
                    if (diffDays === 1) {
                        newStreak = state.streakCount + 1;
                        bonusExp = Math.min(10 + (newStreak - 1) * 5, 50);
                    }
                }

                set({ lastLoginDate: today, streakCount: newStreak });
                get().addExp(bonusExp);

                // ── 節目ボーナスチケット付与 ──
                let earnedGachaTickets = 0;
                let earnedEggTickets = 0;

                // 3日ごと: 装備チケット +1
                if (newStreak % LOGIN_MILESTONE.gachaTicketEvery === 0) {
                    get().addGachaTickets(1);
                    earnedGachaTickets = 1;
                }
                // 7日ごと: 卵チケット +1（3日節目と重複する日は両方付与）
                if (newStreak % LOGIN_MILESTONE.eggTicketEvery === 0) {
                    get().addEggTickets(1);
                    earnedEggTickets = 1;
                }

                get().checkAndAwardBadges();
                return { bonusExp, newStreak, gachaTickets: earnedGachaTickets, eggTickets: earnedEggTickets };
            },

            // ─── デイリークイズ完了（デフォルトで装備チケット +1）────────────
            markDailyQuizComplete: (expGain, ticketGain = 1) => {
                const today = getTodayString();
                set({ lastDailyQuizDate: today });
                if (expGain > 0) get().addExp(expGain);
                if (ticketGain > 0) get().addGachaTickets(ticketGain); // 装備チケット
                get().checkAndAwardBadges();
            },

            // ─── EXP目標達成報酬（1日1回「受け取る」方式）────────────────────
            // 今日 50 EXP 以上獲得済みかつ未受け取りの場合のみ報酬付与
            claimExpGoalReward: () => {
                const state = get();
                const today = getTodayString();
                if (state.lastExpGoalRewardDate === today) return null;
                const todayExp = state.learningHistory.find(h => h.date === today)?.expGained ?? 0;
                if (todayExp < 50) return null;

                set({ lastExpGoalRewardDate: today });
                get().addSp(5);
                get().addGachaTickets(1);
                return { gachaTickets: 1, sp: 5 };
            },

            recordWeakness: (questionId) => {
                set((state) => {
                    const lib = [...state.weaknessLibrary];
                    const existing = lib.find(w => w.questionId === questionId);
                    if (existing) {
                        existing.failedCount += 1;
                        existing.lastFailedAt = new Date().toISOString();
                    } else {
                        lib.push({ questionId, failedCount: 1, lastFailedAt: new Date().toISOString() });
                    }
                    return { weaknessLibrary: lib };
                });
                get().checkAndAwardBadges();
            },

            removeWeakness: (questionId) => {
                set((state) => ({ weaknessLibrary: state.weaknessLibrary.filter(w => w.questionId !== questionId) }));
                get().checkAndAwardBadges();
            },

            // ─── バッジ判定（特定バッジ初獲得時に卵チケットも付与）─────────────
            checkAndAwardBadges: () => {
                const state = get();
                const newlyEarned: string[] = [];
                const lib = [...state.earnedBadges];

                const award = (id: string) => {
                    if (!lib.some(b => b.id === id)) {
                        lib.push({ id, unlockedAt: new Date().toISOString() });
                        newlyEarned.push(id);
                    }
                };

                if (state.streakCount >= 1)  award('first_step');
                if (state.streakCount >= 3)  award('streak_3');
                if (state.streakCount >= 7)  award('streak_7');
                if (state.level >= 2)        award('level_2');
                if (state.level >= 3)        award('level_3');
                if (state.completedLessons.length >= 1) award('first_lesson');
                if (state.completedLessons.length >= 5) award('all_lessons');

                if (newlyEarned.length > 0) {
                    set({ earnedBadges: lib });

                    // バッジ初獲得ボーナス: 特定バッジで卵チケット付与
                    if (newlyEarned.includes('streak_7')) {
                        get().addEggTickets(1); // 7日連続達成 → 卵チケット +1
                    }
                    if (newlyEarned.includes('all_lessons')) {
                        get().addEggTickets(2); // 全レッスン完了 → 卵チケット +2
                    }
                }

                return newlyEarned;
            },
        }),
        {
            name: 'certification-gamification-storage',
            merge: (persistedState: any, currentState) => ({
                ...currentState,
                ...persistedState,
                learningHistory:        persistedState?.learningHistory        || [],
                streakCount:            persistedState?.streakCount            || 0,
                lastLoginDate:          persistedState?.lastLoginDate          || null,
                lastDailyQuizDate:      persistedState?.lastDailyQuizDate      || null,
                lastExpGoalRewardDate:  persistedState?.lastExpGoalRewardDate  || null,
                weaknessLibrary:        persistedState?.weaknessLibrary        || [],
                earnedBadges:           persistedState?.earnedBadges           || [],
                sp:                     persistedState?.sp                     || 0,
                gachaTickets:           persistedState?.gachaTickets           || 0,
                eggTickets:             persistedState?.eggTickets             ?? 0,
                eggTicketFragments:     persistedState?.eggTicketFragments     || 0,
                inventory:              persistedState?.inventory              || [],
                equipment:              persistedState?.equipment              || { weapon: null, armor: null, accessory: null },
                unlockedSkills:         persistedState?.unlockedSkills         || [],
                equippedSkills:         persistedState?.equippedSkills         || [],
                storyProgress:          persistedState?.storyProgress          || 1,
                savedProgress:          persistedState?.savedProgress          || {},
                unlockedClasses:        persistedState?.unlockedClasses        || [],
                selectedPartnerId:      persistedState?.selectedPartnerId      || null,
                hasReceivedWelcomeGift: persistedState?.hasReceivedWelcomeGift || false,
            }),
        }
    )
);
