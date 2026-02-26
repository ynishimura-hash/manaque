"use client";

import React, { Suspense, useState, useEffect, useRef } from 'react';
import { useGamificationStore } from '@/store/useGamificationStore';
import { useAppStore } from '@/lib/appStore';
import { getEquipmentDetails } from '@/config/rpgItems';
import { ArrowLeft, Sword, Shield, Zap, Sparkles, Heart, MapPin, Lock, CheckCircle2, Star } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import dynamicImport from 'next/dynamic';

import { CHARACTER_DATA, getStatsForLevel } from '@/components/gamification/characterData';
import { getSkillById } from '@/config/skillData';
import type { SkillDef } from '@/config/skillData';
import type { PixiBattleHandle } from './PixiBattleView';

const PixiBattleView = dynamicImport(() => import('./PixiBattleView'), { ssr: false });

interface Enemy {
    id: string;
    type: 'swarm' | 'tank' | 'speed' | 'boss';
    hp: number;
    maxHp: number;
    position: number;
    speed: number;
    attack: number;
    def: number;
}

// ステージ定義
interface StageConfig {
    id: number;
    name: string;
    description: string;
    enemies: Omit<Enemy, 'id'>[];
    spawnDelay: number[]; // 各敵の出現までの待機フレーム数
    reward: { sp: number; tickets: number };
}

const STAGE_CONFIGS: StageConfig[] = [
    {
        id: 1,
        name: "STAGE 1: 小手調べ",
        description: "販売士の基礎知識で迎え撃て！",
        enemies: [
            { type: 'swarm', hp: 8, maxHp: 8, position: 0, speed: 0.07, attack: 8, def: 2 },
            { type: 'swarm', hp: 8, maxHp: 8, position: 0, speed: 0.06, attack: 8, def: 2 },
            { type: 'speed', hp: 5, maxHp: 5, position: 0, speed: 0.12, attack: 6, def: 1 },
            { type: 'swarm', hp: 10, maxHp: 10, position: 0, speed: 0.07, attack: 10, def: 3 },
            { type: 'swarm', hp: 10, maxHp: 10, position: 0, speed: 0.065, attack: 10, def: 3 },
            { type: 'speed', hp: 6, maxHp: 6, position: 0, speed: 0.13, attack: 7, def: 1 },
            { type: 'tank', hp: 25, maxHp: 25, position: 0, speed: 0.035, attack: 14, def: 8 },
        ],
        spawnDelay: [0, 80, 160, 300, 400, 520, 700],
        reward: { sp: 30, tickets: 1 },
    },
    {
        id: 2,
        name: "STAGE 2: 激戦",
        description: "大量の魔物が押し寄せる！",
        enemies: [
            { type: 'speed', hp: 8, maxHp: 8, position: 0, speed: 0.14, attack: 8, def: 2 },
            { type: 'swarm', hp: 12, maxHp: 12, position: 0, speed: 0.08, attack: 12, def: 4 },
            { type: 'speed', hp: 8, maxHp: 8, position: 0, speed: 0.13, attack: 8, def: 2 },
            { type: 'swarm', hp: 15, maxHp: 15, position: 0, speed: 0.075, attack: 12, def: 5 },
            { type: 'tank', hp: 35, maxHp: 35, position: 0, speed: 0.04, attack: 18, def: 12 },
            { type: 'speed', hp: 10, maxHp: 10, position: 0, speed: 0.15, attack: 10, def: 3 },
            { type: 'swarm', hp: 15, maxHp: 15, position: 0, speed: 0.08, attack: 13, def: 5 },
            { type: 'swarm', hp: 15, maxHp: 15, position: 0, speed: 0.085, attack: 13, def: 5 },
            { type: 'tank', hp: 40, maxHp: 40, position: 0, speed: 0.04, attack: 20, def: 14 },
            { type: 'speed', hp: 12, maxHp: 12, position: 0, speed: 0.16, attack: 12, def: 3 },
        ],
        spawnDelay: [0, 60, 120, 200, 280, 380, 460, 540, 650, 780],
        reward: { sp: 50, tickets: 2 },
    },
    {
        id: 3,
        name: "STAGE 3: 最終決戦",
        description: "ボスが待ち構える最終ステージ！",
        enemies: [
            { type: 'speed', hp: 10, maxHp: 10, position: 0, speed: 0.15, attack: 10, def: 3 },
            { type: 'speed', hp: 10, maxHp: 10, position: 0, speed: 0.14, attack: 10, def: 3 },
            { type: 'swarm', hp: 18, maxHp: 18, position: 0, speed: 0.09, attack: 14, def: 6 },
            { type: 'tank', hp: 45, maxHp: 45, position: 0, speed: 0.045, attack: 20, def: 15 },
            { type: 'swarm', hp: 18, maxHp: 18, position: 0, speed: 0.09, attack: 14, def: 6 },
            { type: 'speed', hp: 12, maxHp: 12, position: 0, speed: 0.16, attack: 12, def: 4 },
            { type: 'tank', hp: 50, maxHp: 50, position: 0, speed: 0.045, attack: 22, def: 16 },
            { type: 'swarm', hp: 20, maxHp: 20, position: 0, speed: 0.1, attack: 16, def: 7 },
            { type: 'swarm', hp: 20, maxHp: 20, position: 0, speed: 0.1, attack: 16, def: 7 },
            { type: 'speed', hp: 14, maxHp: 14, position: 0, speed: 0.17, attack: 14, def: 5 },
            { type: 'boss', hp: 80, maxHp: 80, position: 0, speed: 0.03, attack: 30, def: 20 },
        ],
        spawnDelay: [0, 50, 100, 180, 280, 360, 460, 560, 640, 750, 900],
        reward: { sp: 80, tickets: 3 },
    },
];

import { useSearchParams } from 'next/navigation';

const MOCK_QUESTIONS = [
    { q: "マーケティング・ミックス（4P）に含まれないものは？", options: ["Price", "Product", "People", "Promotion"], answer: 2 },
    { q: "SWOT分析の「O」は何の略？", options: ["Organization", "Opportunity", "Operation", "Objective"], answer: 1 },
    { q: "商品のライフサイクルで、利益が最大になるのはどの期？", options: ["導入期", "成長期", "成熟期", "衰退期"], answer: 2 },
    { q: "POSシステムは何の略称？", options: ["Point of Sale", "Piece of System", "Price of Service", "Product of Store"], answer: 0 },
    { q: "店舗レイアウトで「客動線」を長くする目的は？", options: ["防犯のため", "購買機会を増やす", "従業員が歩きやすい", "空調効率を上げる"], answer: 1 },
    { q: "「損益分岐点」とは何か？", options: ["利益が最大になる点", "売上と費用が等しくなる点", "限界利益がゼロの点", "変動費がゼロの点"], answer: 1 },
];

function TowerDefenseContent() {
    const searchParams = useSearchParams();
    const isTestMode = searchParams?.get('test') === '1';

    // JSON設定ファイルからの読み込み（管理画面で編集した値を反映）
    const [dynamicStages, setDynamicStages] = useState<StageConfig[] | null>(null);
    const [dynamicQuestions, setDynamicQuestions] = useState<{ q: string; options: string[]; answer: number }[] | null>(null);
    const [dynamicPartners, setDynamicPartners] = useState<any[] | null>(null);

    useEffect(() => {
        fetch('/data/td-config.json')
            .then(res => res.json())
            .then(data => {
                if (data.stages) setDynamicStages(data.stages);
                if (data.questions) setDynamicQuestions(data.questions);
                if (data.partners?.list) setDynamicPartners(data.partners.list);
            })
            .catch(() => {
                // JSONが無い場合はハードコードのフォールバックを使用
            });
    }, []);

    // JSON優先、なければハードコードのフォールバック
    const activeStages = dynamicStages || STAGE_CONFIGS;
    const activeQuestions = dynamicQuestions || MOCK_QUESTIONS;

    const storeState = useGamificationStore();
    const exp = storeState.exp;
    const sp = storeState.sp;
    const gachaTickets = storeState.gachaTickets;
    const level = isTestMode ? 10 : storeState.level;
    const equipment = storeState.equipment;
    const selectedCharacterId = isTestMode ? 'hero' : storeState.selectedCharacterId;
    const addSp = storeState.addSp;
    const addGachaTickets = storeState.addGachaTickets;
    const addEggTickets = storeState.addEggTickets;
    const unlockedClasses = storeState.unlockedClasses;
    const unlockClass = storeState.unlockClass;
    const equippedSkills = isTestMode ? ['w_slash', 'm_fire'] : storeState.equippedSkills;
    const unlockedSkills = isTestMode ? ['w_slash', 'm_fire'] : storeState.unlockedSkills;
    const selectedPartnerId = storeState.selectedPartnerId;
    const selectPartner = storeState.selectPartner;

    const characterInfo = selectedCharacterId ? CHARACTER_DATA[selectedCharacterId as keyof typeof CHARACTER_DATA] : null;
    const currentCharStage = characterInfo?.stages.slice().reverse().find(s => level >= s.level) || characterInfo?.stages[0] || null;

    const activePartnerData = dynamicPartners?.find(p => p.id === selectedPartnerId);
    // パートナーレベル機能が未実装のため、とりあえず第1形態（stages[0]）を使用する
    const activePartnerStage = activePartnerData?.stages?.[0] || null;

    const charStats = selectedCharacterId ? getStatsForLevel(selectedCharacterId, level) : { hp: 10, atk: 5, def: 3, spd: 2 };
    const calcMaxHp: number = charStats.hp;
    const [view, setView] = useState<'map' | 'battle'>('map');
    const [selectedStage, setSelectedStage] = useState<number>(1);
    const [clearedStages, setClearedStages] = useState<number[]>([]);
    const [gameState, setGameState] = useState<'standby' | 'playing' | 'clearing' | 'clear' | 'gameover'>('standby');
    const [maxHp, setMaxHp] = useState(calcMaxHp);
    const [playerHp, setPlayerHp] = useState(calcMaxHp);
    const [enemies, setEnemies] = useState<Enemy[]>([]);

    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => setIsMounted(true), []);

    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [score, setScore] = useState(0);

    const [isStunned, setIsStunned] = useState(false);
    const [hasUnlockedNow, setHasUnlockedNow] = useState(false);
    const [totalEnemyCount, setTotalEnemyCount] = useState(0);
    const [killedCount, setKilledCount] = useState(0);
    const spawnTimerRef = useRef<number>(0);
    const spawnedRef = useRef<Set<number>>(new Set());
    const partnerAttackTimerRef = useRef<number>(0);

    // MPシステム
    const charSpd = charStats.spd;
    const calcMaxMp = 20 + charSpd * 5;
    const [mp, setMp] = useState(calcMaxMp);
    const [maxMp, setMaxMp] = useState(calcMaxMp);

    // DOT（持続ダメージ）フィールド
    const dotFieldRef = useRef<{ damage: number; remainingFrames: number; interval: number; timer: number } | null>(null);

    // スキルクールダウン
    const [skillCooldowns, setSkillCooldowns] = useState<Record<string, number>>({});

    // 装備中スキルの定義を取得 (マウント完了後に正しくStoreの中身を反映)
    const activeEquippedSkills = isMounted ? equippedSkills : [];
    const equippedSkillDefs = activeEquippedSkills.map(id => getSkillById(id)).filter(Boolean) as SkillDef[];

    const pixiRef = useRef<PixiBattleHandle>(null);
    const requestRef = useRef<number>(0);
    const lastTimeRef = useRef<number>(0);
    const gameStateRef = useRef(gameState);
    const enemiesRef = useRef(enemies);

    // 攻撃力・防御力はキャラクターのステータスから取得
    const charAtk = charStats.atk;
    const charDef = charStats.def;

    // 装備バフ
    const weaponBuff = getEquipmentDetails(equipment.weapon);
    const armorBuff = getEquipmentDetails(equipment.armor);
    const accessoryBuff = getEquipmentDetails(equipment.accessory);

    // 攻撃力 = キャラATK + 武器バフ
    const attackPower = charAtk + ((weaponBuff?.effectType === 'EXP_BOOST' ? 5 : 0));

    let classSpeedDebuff = 0;
    if (selectedCharacterId === 'mage') { classSpeedDebuff = 0.3; }
    const timeSlowRate = Math.min(0.9, ((accessoryBuff?.effectType === 'TIME_SLOW' ? accessoryBuff.effectValue : 0) / 100) + classSpeedDebuff);
    const initialShields = armorBuff?.effectType === 'SHIELD' ? armorBuff.effectValue : 0;

    // 防御力 = キャラDEF + 防具バフ
    const defensePower = charDef + (armorBuff?.effectType === 'SHIELD' ? armorBuff.effectValue : 0);

    const [shields, setShields] = useState(initialShields);

    const characterImage = currentCharStage?.imageUrl;

    useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
    useEffect(() => { enemiesRef.current = enemies; }, [enemies]);

    const currentStageConfig = activeStages.find(s => s.id === selectedStage)!;

    const startGame = () => {
        setGameState('playing');
        setMaxHp(calcMaxHp);
        setPlayerHp(calcMaxHp);
        setShields(initialShields);
        setScore(0);
        setCurrentQuestionIdx(0);
        setIsStunned(false);
        setHasUnlockedNow(false);
        setKilledCount(0);
        setMp(calcMaxMp);
        setMaxMp(calcMaxMp);
        setSkillCooldowns({});
        dotFieldRef.current = null;
        spawnTimerRef.current = 0;
        spawnedRef.current = new Set();
        partnerAttackTimerRef.current = 0;

        // 最初の敵だけスポーン（delay=0のもの）
        const initialEnemies: Enemy[] = [];
        currentStageConfig.enemies.forEach((e, i) => {
            if ((currentStageConfig.spawnDelay?.[i] ?? 0) === 0) {
                initialEnemies.push({ ...e, id: `e_${selectedStage}_${i}`, speed: e.speed * (1 - timeSlowRate) });
                spawnedRef.current.add(i);
            }
        });
        setEnemies(initialEnemies);
        setTotalEnemyCount(currentStageConfig.enemies.length);

        // 開幕ダッシュ（QUICK_KILL）武器効果の発動
        if (weaponBuff?.effectType === 'QUICK_KILL' && weaponBuff.effectValue > 0) {
            const killCount = Math.floor(weaponBuff.effectValue / 100); // 100=1体、200=2体
            if (killCount > 0 && initialEnemies.length > 0) {
                const toKill = initialEnemies.slice(0, killCount);
                setTimeout(() => {
                    toKill.forEach(enemy => {
                        pixiRef.current?.playEffect('slash', enemy.id, 3, enemy.maxHp, true);
                        pixiRef.current?.playEffect('coin', enemy.id, 2, 0, true);
                    });
                    setEnemies(prev => prev.filter(e => !toKill.some(k => k.id === e.id)));
                    setKilledCount(prev => prev + toKill.length);
                    setScore(prev => prev + toKill.length * 100);
                    toast.success(`⚡ 開幕ダッシュ！${toKill.length}体を即座に撃破！`);
                }, 500); // 少し遅延して演出的に見せる
            }
        }

        lastTimeRef.current = performance.now();
    };

    // ゲームループ
    const updateGameLoop = (time: number) => {
        if (!lastTimeRef.current) lastTimeRef.current = time;
        const dt = time - lastTimeRef.current;
        lastTimeRef.current = time;
        if (gameStateRef.current !== 'playing') return;

        // フレームカウンタを進めて遅延スポーン
        spawnTimerRef.current += dt / 16;
        const cfg = currentStageConfig;
        cfg.enemies.forEach((e, i) => {
            const delay = cfg.spawnDelay?.[i] ?? 0;
            if (!spawnedRef.current.has(i) && spawnTimerRef.current >= delay) {
                spawnedRef.current.add(i);
                setEnemies(prev => [...prev, { ...e, id: `e_${selectedStage}_${i}`, speed: e.speed * (1 - timeSlowRate) }]);
            }
        });

        // 敵の移動とパートナー攻撃
        setEnemies(prev => {
            let next = prev.map(e => ({
                ...e,
                position: e.position + e.speed * (dt / 16),
            }));

            // パートナー自動攻撃
            if (activePartnerStage && next.length > 0) {
                partnerAttackTimerRef.current += dt / 1000;
                const interval = activePartnerStage.stats.tdAttackInterval ?? 5;
                if (partnerAttackTimerRef.current >= interval) {
                    partnerAttackTimerRef.current = 0;
                    // 先頭の敵を取得
                    const sorted = [...next].sort((a, b) => b.position - a.position);
                    const target = sorted[0];
                    const dmg = Math.max(1, activePartnerStage.stats.atk - target.def);

                    // エフェクト再生（非同期）
                    setTimeout(() => {
                        // パートナーの属性や設定に応じてエフェクトを変えることも可能
                        pixiRef.current?.playEffect('magic', target.id, 1, Math.floor(dmg), false);
                    }, 0);

                    // ダメージ反映
                    let killed = false;
                    next = next.map(e => {
                        if (e.id === target.id) {
                            const newHp = e.hp - dmg;
                            if (newHp <= 0) killed = true;
                            return { ...e, hp: Math.max(0, newHp) };
                        }
                        return e;
                    }).filter(e => e.hp > 0);

                    if (killed) {
                        setTimeout(() => {
                            setKilledCount(k => k + 1);
                            setScore(s => s + 100);
                        }, 0);
                    }
                }
            }
            return next;
        });

        // DOTフィールド処理
        if (dotFieldRef.current) {
            dotFieldRef.current.remainingFrames -= dt / 16;
            dotFieldRef.current.timer += dt / 16;
            if (dotFieldRef.current.timer >= dotFieldRef.current.interval) {
                dotFieldRef.current.timer = 0;
                // 全敵にDOTダメージ
                setEnemies(prev => {
                    const dmg = dotFieldRef.current!.damage;
                    let newKills = 0;
                    const result = prev.map(e => {
                        const newHp = e.hp - dmg;
                        if (newHp <= 0) newKills++;
                        return { ...e, hp: Math.max(0, newHp) };
                    }).filter(e => e.hp > 0);
                    if (newKills > 0) {
                        setTimeout(() => {
                            setKilledCount(k => k + newKills);
                            setScore(s => s + newKills * 50);
                        }, 0);
                    }
                    return result;
                });
            }
            if (dotFieldRef.current.remainingFrames <= 0) {
                dotFieldRef.current = null;
            }
        }

        requestRef.current = requestAnimationFrame(updateGameLoop);
    };

    useEffect(() => {
        if (gameState === 'playing') {
            lastTimeRef.current = performance.now();
            requestRef.current = requestAnimationFrame(updateGameLoop);
        }
        return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameState]);

    // 敵到達判定
    useEffect(() => {
        if (gameState !== 'playing') return;
        const reached = enemies.filter(e => e.position >= 85);
        if (reached.length > 0) {
            handleDamage(reached);
            // ノックバック処理: 押し戻しすぎないよう、position 85付近から 75 くらい(画面左側1/3付近)に押し戻す
            setEnemies(prev => prev.map(e => e.position >= 85 ? { ...e, position: 75 } : e));
        }
    }, [enemies, gameState]);

    // 全滅クリア判定（スポーン済みの全敵が倒された場合）
    useEffect(() => {
        if (gameState !== 'playing') return;
        if (killedCount >= totalEnemyCount && totalEnemyCount > 0) {
            // すぐに画面を切り替えず、敵が倒れる余韻を残すための遅延パッチ
            setGameState('clearing'); // 余韻用のステート

            // 最後の敵用：豪華な撃破エフェクト（全画面フラッシュ＋爆炎）
            pixiRef.current?.playEffect('fire', 'player', 3, 0, true);
            pixiRef.current?.playEffect('magic', 'player', 3, 0, true);
            import('canvas-confetti').then((confetti) => {
                confetti.default({ particleCount: 150, spread: 100, origin: { y: 0.6 } }); // 紙吹雪
            });

            setTimeout(() => {
                setGameState('clear');
                handleClearRewards();
            }, 2000); // 2秒の余韻
        }
    }, [killedCount, gameState, totalEnemyCount]);

    // ダメージ処理＆ノックバック
    // 敵がプレイヤーに到達した時のダメージ処理
    const handleDamage = (attackingEnemies: Enemy[]) => {
        let totalDmg = 0;
        attackingEnemies.forEach(e => {
            totalDmg += Math.max(1, e.attack - defensePower);
        });

        // ダメージエフェクト（プレイヤーに対して）
        pixiRef.current?.playEffect('slash', 'player', 1, totalDmg, true);

        setPlayerHp(prev => {
            const next = prev - totalDmg;
            if (next <= 0) setGameState('gameover'); // プレイヤーHPが0になったらゲームオーバー
            return next;
        });
        toast.error(`敵の攻撃！${totalDmg}ダメージ！`);
    };

    // クイズ回答処理
    const handleAnswer = (optionIdx: number) => {
        if (isStunned) return;
        const currentQ = activeQuestions[currentQuestionIdx];

        if (optionIdx === currentQ.answer) {
            // 正解：先頭の敵を攻撃（positionが最も高い＝最前線の敵）
            if (enemies.length > 0) {
                const sorted = [...enemies].sort((a, b) => b.position - a.position);
                const target = sorted[0];

                // クリティカル判定（10%の確率で1.5倍ダメージ）
                const isCritical = Math.random() < 0.1;
                // ダメージ = (ATK - 敵DEF) × クリティカル倍率、最低1
                const rawDmg = Math.max(1, attackPower - target.def);
                const damage = Math.floor(rawDmg * (isCritical ? 1.5 : 1));

                // エフェクト再生（ダメージ値とクリティカル情報を渡す）
                let baseEffectType: 'slash' | 'magic' | 'coin' = 'slash';
                if (selectedCharacterId === 'mage') baseEffectType = 'magic';
                else if (selectedCharacterId === 'merchant') baseEffectType = 'coin';

                // 基本の攻撃エフェクト
                pixiRef.current?.playEffect(baseEffectType, target.id, level, damage, isCritical);

                // 武器の特殊効果エフェクト（あれば追加で表示）
                const weaponEffectName = weaponBuff?.effectType || weaponBuff?.description || '';
                if (weaponEffectName) {
                    if (weaponEffectName.includes('炎') || weaponEffectName.includes('FIRE')) pixiRef.current?.playEffect('fire', target.id, level, 0, false);
                    if (weaponEffectName.includes('氷') || weaponEffectName.includes('ICE') || weaponEffectName.includes('FREEZE')) pixiRef.current?.playEffect('ice', target.id, level, 0, false);
                    if (weaponEffectName.includes('闇') || weaponEffectName.includes('DARK')) pixiRef.current?.playEffect('dark', target.id, level, 0, false);
                    if (weaponEffectName.includes('回復') || weaponEffectName.includes('HEAL')) pixiRef.current?.playEffect('heal', target.id, level, 0, false);
                }

                // ダメージ計算
                const newHp = target.hp - damage;
                const isDead = newHp <= 0;

                // 敵リスト更新
                if (isDead) {
                    setEnemies(prev => prev.filter(e => e.id !== target.id));
                    setScore(s => s + (isCritical ? 200 : 100));
                    setKilledCount(k => k + 1);
                } else {
                    setEnemies(prev => prev.map(e => e.id === target.id ? { ...e, hp: newHp } : e));
                }

                if (isCritical) {
                    toast.success(`💥 クリティカルヒット！ ${damage}ダメージ！`, { icon: '⚡', duration: 1500 });
                }
            }
            toast.success('正解！', { icon: '✨', duration: 1000 });
        } else {
            setIsStunned(true);
            toast.error('不正解！2秒間攻撃不可！', { icon: '⚡' });
            setTimeout(() => setIsStunned(false), 2000);
        }

        // 次の問題へ（ループ）
        setCurrentQuestionIdx(prev => (prev + 1) % activeQuestions.length);
    };

    // スキル使用処理
    const useSkill = (skill: SkillDef) => {
        if (gameState !== 'playing') return;
        if (!skill.mpCost || mp < skill.mpCost) {
            toast.error('MPが足りません！', { icon: '💧' });
            return;
        }
        if (skillCooldowns[skill.id] && skillCooldowns[skill.id] > Date.now()) {
            toast.error('クールダウン中！');
            return;
        }

        // MP消費
        setMp(prev => prev - skill.mpCost!);
        // クールダウン設定（3秒）
        setSkillCooldowns(prev => ({ ...prev, [skill.id]: Date.now() + 3000 }));

        const sorted = [...enemies].sort((a, b) => b.position - a.position);

        switch (skill.targetType) {
            case 'single': {
                // 単体に倍率ダメージ
                if (sorted.length === 0) { setMp(prev => prev + skill.mpCost!); return; }
                const target = sorted[0];
                const dmg = Math.max(1, Math.floor(attackPower * (skill.damageMultiplier ?? 1) - target.def));
                pixiRef.current?.playEffect('slash', target.id, level, dmg, true);
                const newHp = target.hp - dmg;
                if (newHp <= 0) {
                    setEnemies(prev => prev.filter(e => e.id !== target.id));
                    setScore(s => s + 150);
                    setKilledCount(k => k + 1);
                } else {
                    setEnemies(prev => prev.map(e => e.id === target.id ? { ...e, hp: newHp } : e));
                }
                toast.success(`⚔️ ${skill.name}！ ${dmg}ダメージ！`, { duration: 1500 });
                break;
            }
            case 'multi': {
                // 複数体に倍率ダメージ
                const count = Math.min(skill.hitCount ?? 2, sorted.length);
                if (count === 0) { setMp(prev => prev + skill.mpCost!); return; }
                const targets = sorted.slice(0, count);
                let totalDmg = 0;
                let kills = 0;
                const deadIds: string[] = [];
                targets.forEach(t => {
                    const dmg = Math.max(1, Math.floor(attackPower * (skill.damageMultiplier ?? 1) - t.def));
                    totalDmg += dmg;
                    pixiRef.current?.playEffect('coin', t.id, level, dmg, false);
                    if (t.hp - dmg <= 0) { kills++; deadIds.push(t.id); }
                });
                setEnemies(prev => prev.map(e => {
                    if (!targets.find(t => t.id === e.id)) return e;
                    const dmg = Math.max(1, Math.floor(attackPower * (skill.damageMultiplier ?? 1) - e.def));
                    return { ...e, hp: e.hp - dmg };
                }).filter(e => e.hp > 0));
                if (kills > 0) { setKilledCount(k => k + kills); setScore(s => s + kills * 150); }
                toast.success(`🎯 ${skill.name}！ ${count}体に${totalDmg}ダメージ！`, { duration: 1500 });
                break;
            }
            case 'all': {
                // 全体に倍率ダメージ
                if (sorted.length === 0) { setMp(prev => prev + skill.mpCost!); return; }
                let kills = 0;
                let totalDmg = 0;
                sorted.forEach(t => {
                    pixiRef.current?.playEffect('magic', t.id, level, 0, true);
                    const dmg = Math.max(1, Math.floor(attackPower * (skill.damageMultiplier ?? 1) - t.def));
                    totalDmg += dmg;
                    if (t.hp - dmg <= 0) kills++;
                });
                setEnemies(prev => {
                    return prev.map(e => {
                        const dmg = Math.max(1, Math.floor(attackPower * (skill.damageMultiplier ?? 1) - e.def));
                        const newHp = e.hp - dmg;
                        return { ...e, hp: newHp };
                    }).filter(e => e.hp > 0);
                });
                if (kills > 0) { setKilledCount(k => k + kills); setScore(s => s + kills * 150); }
                toast.success(`💥 ${skill.name}！ 全体に${totalDmg}ダメージ！`, { duration: 1500 });
                break;
            }
            case 'dot': {
                // 持続ダメージフィールド設置
                const dotDmg = Math.max(1, Math.floor(attackPower * (skill.damageMultiplier ?? 1) * 0.3));
                dotFieldRef.current = {
                    damage: dotDmg,
                    remainingFrames: skill.dotDuration ?? 300,
                    interval: skill.dotInterval ?? 60,
                    timer: 0,
                };
                // 速度低下（ブリザード特殊効果）
                if (skill.id === 'm_blizzard') {
                    setEnemies(prev => prev.map(e => ({ ...e, speed: e.speed * 0.5 })));
                }
                toast.success(`❄️ ${skill.name}発動！ 持続ダメージフィールド展開！`, { duration: 2000 });
                break;
            }
            case 'self': {
                // シールド付与
                setShields(prev => prev + 1);
                toast.success(`🛡️ ${skill.name}！ シールド+1`, { duration: 1500 });
                break;
            }
        }
    };

    const handleClearRewards = () => {
        let spReward = currentStageConfig.reward.sp;
        let tktReward = currentStageConfig.reward.tickets;
        let eggTktReward = (currentStageConfig.reward as any).eggTickets || 0;

        if (selectedCharacterId === 'merchant') {
            spReward = Math.floor(spReward * 1.5);
            tktReward += 1;
        }

        addSp(spReward);
        addGachaTickets(tktReward);
        if (eggTktReward > 0) {
            addEggTickets(eggTktReward);
        }

        if (!clearedStages.includes(selectedStage)) {
            setClearedStages(prev => [...prev, selectedStage]);
        }

        const eggText = eggTktReward > 0 ? `\n卵チケット +${eggTktReward}` : '';
        toast.success(`クリア報酬！\nSP +${spReward}\nガチャチケット +${tktReward}${eggText}`, { duration: 5000, icon: '🏆' });
    };

    const handleReturnToMap = () => {
        setView('map');
        setGameState('standby');
        setEnemies([]);
    };

    // ========================
    // マップ画面
    // ========================

    // 現在のキャラクターが立っているステージ (未クリアの最小)
    const currentActiveStage = activeStages.find(s => !clearedStages.includes(s.id))?.id ?? activeStages.length;

    if (view === 'map') {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 text-slate-200 font-sans pb-24 overflow-hidden">
                {/* 背景：RPG風の装飾 */}
                <div className="fixed inset-0 pointer-events-none z-0">
                    <div className="absolute top-[10%] right-[5%] w-[300px] h-[300px] rounded-full bg-amber-600/8 blur-[120px]" />
                    <div className="absolute bottom-[15%] left-[10%] w-[250px] h-[250px] rounded-full bg-violet-600/8 blur-[100px]" />
                    {/* 星のような点（固定シード値でハイドレーション対応） */}
                    {Array.from({ length: 20 }).map((_, i) => {
                        // Math.random()の代わりにインデックスベースの固定値を使用
                        const seed = (i * 137 + 47) % 100;
                        const seed2 = (i * 73 + 23) % 100;
                        return (
                            <div
                                key={i}
                                className="absolute rounded-full bg-white/20 animate-pulse"
                                style={{
                                    width: `${1 + (seed % 3)}px`,
                                    height: `${1 + (seed % 3)}px`,
                                    top: `${seed}%`,
                                    left: `${seed2}%`,
                                    animationDelay: `${(seed % 30) / 10}s`,
                                    animationDuration: `${2 + (seed2 % 30) / 10}s`,
                                }}
                            />
                        );
                    })}
                </div>

                <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800">
                    <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                        <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                            <ArrowLeft size={20} />
                            <span className="text-sm font-bold">拠点へ戻る</span>
                        </Link>
                        <h1 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-rose-400">⚔ タワーディフェンス</h1>
                    </div>
                </header>

                <main className="max-w-2xl mx-auto px-4 pt-6 pb-8 relative z-10">
                    {/* キャラクター情報パネル */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-4 bg-slate-800/60 backdrop-blur-md rounded-2xl p-4 mb-8 border border-slate-700/50"
                    >
                        {characterImage ? (
                            <img
                                src={characterImage}
                                alt="キャラクター"
                                className="w-16 h-16 rounded-xl object-cover border-2 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-xl bg-slate-700 flex items-center justify-center border-2 border-slate-600">
                                <Sword size={24} className="text-slate-400" />
                            </div>
                        )}
                        <div className="flex-1">
                            <div className="text-sm font-black text-white">{currentCharStage?.name ?? 'キャラ未選択'}</div>
                            <div className="text-xs text-slate-400 mt-0.5">Lv.{level} | ATK {attackPower} | DEF {defensePower}</div>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                                    クリア {clearedStages.length}/{activeStages.length}
                                </span>
                            </div>
                        </div>
                        <div className="text-right text-xs text-slate-400 font-bold">
                            <div>SP: {sp}</div>
                            <div>チケット: {gachaTickets}</div>
                        </div>
                    </motion.div>

                    {/* パートナー選択パネル */}
                    {dynamicPartners && dynamicPartners.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-4 bg-slate-800/60 backdrop-blur-md rounded-2xl p-4 mb-8 border border-slate-700/50"
                        >
                            {activePartnerStage?.imageUrl ? (
                                <img
                                    src={activePartnerStage.imageUrl}
                                    alt="パートナー"
                                    className="w-14 h-14 rounded-xl object-cover border-2 border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.2)]"
                                />
                            ) : (
                                <div className="w-14 h-14 rounded-xl bg-slate-700 flex items-center justify-center border-2 border-slate-600 shadow-inner">
                                    <Sparkles size={24} className="text-slate-400 opacity-50" />
                                </div>
                            )}
                            <div className="flex-1">
                                <div className="text-xs text-slate-400 font-bold mb-1">お供パートナー</div>
                                <select
                                    value={selectedPartnerId || ''}
                                    onChange={(e) => selectPartner(e.target.value || null)}
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white font-bold cursor-pointer hover:border-slate-500 transition-colors"
                                >
                                    <option value="">（出撃しない）</option>
                                    {dynamicPartners.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.rarity}) LV.{p.stages[0]?.level ?? 1}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="text-right text-xs text-slate-400 font-bold min-w-[80px]">
                                {activePartnerStage ? (
                                    <>
                                        <div className="text-[10px] mb-0.5">自動攻撃</div>
                                        <div className="text-rose-400 bg-rose-500/10 px-2 py-1 rounded inline-block">
                                            {activePartnerStage.stats.tdAttackInterval ?? 5}秒/回
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-slate-600">待機中</div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    <h2 className="text-xl font-black text-white mb-1">冒険マップ</h2>
                    <p className="text-slate-500 text-xs mb-6">魔物の群れを撃退して、王国を守れ！</p>

                    {/* ステージマップ */}
                    <div className="flex flex-col items-center gap-0">
                        {activeStages.map((stage, idx) => {
                            const isCleared = clearedStages.includes(stage.id);
                            const isUnlocked = isTestMode || stage.id === 1 || clearedStages.includes(stage.id - 1);
                            const isCurrent = stage.id === currentActiveStage;

                            const stageThemesList = [
                                { gradient: 'from-emerald-500/20 to-emerald-900/30', border: 'border-emerald-500/60', icon: '🌿', dotColor: 'bg-emerald-500', lineColor: 'bg-emerald-500/40' },
                                { gradient: 'from-amber-500/20 to-amber-900/30', border: 'border-amber-500/60', icon: '🔥', dotColor: 'bg-amber-500', lineColor: 'bg-amber-500/40' },
                                { gradient: 'from-rose-500/20 to-rose-900/30', border: 'border-rose-500/60', icon: '💀', dotColor: 'bg-rose-500', lineColor: 'bg-rose-500/40' },
                                { gradient: 'from-violet-500/20 to-violet-900/30', border: 'border-violet-500/60', icon: '⚡', dotColor: 'bg-violet-500', lineColor: 'bg-violet-500/40' },
                                { gradient: 'from-cyan-500/20 to-cyan-900/30', border: 'border-cyan-500/60', icon: '🌊', dotColor: 'bg-cyan-500', lineColor: 'bg-cyan-500/40' },
                            ];
                            const stageThemes = stageThemesList[idx % stageThemesList.length];

                            return (
                                <React.Fragment key={stage.id}>
                                    {/* ステージカード */}
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: idx * 0.2 }}
                                        className="w-full max-w-md relative"
                                    >
                                        {/* 現在地のキャラクター表示 */}
                                        {isCurrent && characterImage && (
                                            <motion.div
                                                animate={{ y: [0, -6, 0] }}
                                                transition={{ repeat: Infinity, duration: 1.5 }}
                                                className="absolute -left-4 md:-left-16 top-1/2 -translate-y-1/2 z-20"
                                            >
                                                <img
                                                    src={characterImage}
                                                    alt="現在地"
                                                    className="w-14 h-14 md:w-16 md:h-16 rounded-full object-cover border-3 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                                                />
                                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                                    NOW
                                                </div>
                                            </motion.div>
                                        )}

                                        <button
                                            onClick={() => {
                                                if (!isUnlocked) { toast.error('前のステージをクリアしてください'); return; }
                                                setSelectedStage(stage.id);
                                                setView('battle');
                                                setGameState('standby');
                                            }}
                                            disabled={!isUnlocked}
                                            className={`w-full p-5 rounded-2xl border-2 transition-all relative overflow-hidden
                                                ${isUnlocked
                                                    ? `bg-gradient-to-r ${stageThemes.gradient} ${stageThemes.border} hover:scale-[1.02] hover:shadow-lg`
                                                    : 'bg-slate-800/30 border-slate-700/30 opacity-40 cursor-not-allowed'
                                                }
                                                ${isCurrent ? 'ring-2 ring-amber-400/50 shadow-[0_0_30px_rgba(245,158,11,0.15)]' : ''}
                                            `}
                                        >
                                            <div className="flex items-center gap-4">
                                                {/* アイコン */}
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0
                                                    ${isCleared ? 'bg-emerald-500/20' : isUnlocked ? 'bg-white/10' : 'bg-slate-800/50'}`}>
                                                    {isCleared ? <CheckCircle2 size={28} className="text-emerald-400" /> : stageThemes.icon}
                                                </div>

                                                {/* 情報 */}
                                                <div className="flex-1 text-left min-w-0">
                                                    <h3 className={`text-base font-black ${isUnlocked ? 'text-white' : 'text-slate-500'}`}>
                                                        {stage.name}
                                                    </h3>
                                                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">{stage.description}</p>
                                                </div>

                                                {/* 右側情報 */}
                                                <div className="text-right shrink-0">
                                                    {!isUnlocked && <Lock size={20} className="text-slate-600 ml-auto" />}
                                                    {isUnlocked && !isCleared && (
                                                        <>
                                                            <div className="text-[11px] font-bold text-white/70 flex items-center gap-1 justify-end">
                                                                <Sword size={11} /> {stage.enemies.length}体
                                                            </div>
                                                            <div className="text-[11px] text-amber-400 font-bold mt-0.5 flex items-center gap-1 justify-end">
                                                                <Star size={11} /> +{stage.reward.sp} SP
                                                            </div>
                                                        </>
                                                    )}
                                                    {isCleared && (
                                                        <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2.5 py-1 rounded-full font-black">
                                                            ✓ CLEAR
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    </motion.div>

                                    {/* ステージ間のコネクタ（最後以外） */}
                                    {idx < activeStages.length - 1 && (
                                        <div className="flex flex-col items-center py-1 z-0">
                                            <div className={`w-0.5 h-4 ${isCleared ? stageThemes.lineColor : 'bg-slate-700/50'}`} />
                                            <div className={`w-3 h-3 rounded-full border-2 ${isCleared ? `${stageThemes.dotColor} border-transparent` : 'bg-slate-800 border-slate-600'}`} />
                                            <div className={`w-0.5 h-4 ${isCleared ? stageThemes.lineColor : 'bg-slate-700/50'}`} />
                                        </div>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </main>
            </div>
        );
    }

    // ========================
    // バトル画面
    // ========================
    return (
        <React.Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading Game...</div>}>
            <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans relative overflow-hidden">
                {/* ヘッダーエリア */}           <header className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 z-50">
                    <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                        <button onClick={handleReturnToMap} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                            <ArrowLeft size={20} />
                            <span className="text-sm font-bold">マップへ</span>
                        </button>
                        <div className="text-sm font-black text-amber-400">{currentStageConfig.name}</div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1 text-slate-400 font-black text-sm">
                                撃破: <span className="text-white">{killedCount}/{totalEnemyCount}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Heart size={16} className="text-rose-500 fill-rose-500" />
                                <span className="font-bold text-rose-400 text-sm">{Math.max(0, playerHp)}/{maxHp}</span>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 max-w-4xl mx-auto w-full flex flex-col relative z-10 p-2 sm:p-4">

                    {/* 中央ステータス＆キャンバス */}
                    <div className="flex flex-col gap-1 sm:gap-2 h-full justify-between">
                        {/* HP・ウェーブ情報 */}
                        <div className="flex items-center justify-between bg-slate-800/80 p-2 rounded-xl border border-slate-700 shadow-sm backdrop-blur-md">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    {characterImage ? (
                                        <img src={characterImage} alt="PC" className="w-12 h-12 rounded-xl object-cover border-2 border-amber-500/50" />
                                    ) : (
                                        <div className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center border-2 border-slate-600"><Sword size={20} /></div>
                                    )}
                                </div>
                                <div>
                                    <div className="text-sm font-black text-white">{currentCharStage?.name ?? 'プレイヤー'}</div>
                                    <div className="text-xs text-amber-400 font-bold">Lv.{level} | score: {score}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-slate-400 font-bold mb-1">STAGE {selectedStage}</div>
                                <div className="text-sm font-black text-white bg-slate-900 px-3 py-1 rounded-full border border-slate-700">
                                    撃破: <span className="text-rose-400">{killedCount}</span> / {totalEnemyCount}
                                </div>
                            </div>
                        </div>

                        {/* PixiJS バトルキャンバス (300px高、はみ出しエフェクト許可のためoverflow-hiddenを削除) */}
                        <div className="relative h-[250px] sm:h-[280px] w-full bg-slate-900 rounded-2xl border-2 border-slate-700 shadow-2xl z-[60] overflow-visible">
                            <PixiBattleView
                                ref={pixiRef}
                                enemies={enemies}
                                playerHp={Math.max(0, playerHp)}
                                maxHp={maxHp}
                                characterImage={characterImage}
                                partnerImage={activePartnerStage?.imageUrl}
                            />

                            {/* 状態オーバーレイ (Standbyのみキャンバス内) */}
                            {gameState === 'standby' && (
                                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-[2px] flex items-center justify-center z-[100] pointer-events-auto rounded-2xl">
                                    <div className="text-center space-y-2 sm:space-y-4">
                                        <h2 className="text-2xl sm:text-3xl font-black text-white">{currentStageConfig.name}</h2>
                                        <p className="text-slate-300 text-xs sm:text-sm">{currentStageConfig.description}</p>
                                        <div className="flex items-center justify-center gap-4 text-xs sm:text-sm text-slate-400 font-bold">
                                            <span><Sword size={14} className="inline" /> 敵 {currentStageConfig.enemies.length}体</span>
                                            <span><Star size={14} className="inline text-amber-400" /> SP +{currentStageConfig.reward.sp}</span>
                                        </div>
                                        <button
                                            onClick={startGame}
                                            className="bg-rose-600 text-white font-black text-lg sm:text-xl py-3 px-10 rounded-full hover:bg-rose-500 transition-colors shadow-[0_0_30px_rgba(225,29,72,0.4)]"
                                        >
                                            BATTLE START
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* === バトル情報・スキルUIエリア === */}
                        {gameState === 'playing' && (
                            <div className="bg-slate-900/95 border border-slate-700 px-3 py-1.5 sm:px-4 sm:py-2 relative z-20 rounded-xl mt-1 max-w-4xl mx-auto w-full shadow-sm">
                                <div className="flex items-center justify-between">
                                    {/* MPゲージ */}
                                    <div className="flex items-center gap-3 w-1/3">
                                        <span className="text-blue-400 font-bold text-sm">MP</span>
                                        <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                                            <div
                                                className="h-full bg-blue-500 transition-all duration-300 relative"
                                                style={{ width: `${Math.max(0, Math.min(100, (mp / maxMp) * 100))}%` }}
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20"></div>
                                            </div>
                                        </div>
                                        <span className="text-white text-xs font-mono">{Math.floor(mp)}/{maxMp}</span>
                                    </div>

                                    {/* スキルボタン群 */}
                                    <div className="flex gap-2 flex-1 justify-end">
                                        {equippedSkillDefs.length === 0 && (
                                            <div className="text-slate-500 text-xs flex items-center justify-center border border-dashed border-slate-700 rounded-lg px-4 bg-slate-800/50">
                                                スキル未装備
                                            </div>
                                        )}
                                        {equippedSkillDefs.map((skill, idx) => {
                                            const canUse = mp >= (skill.mpCost ?? 0);
                                            const onCooldown = skillCooldowns[skill.id] && skillCooldowns[skill.id] > Date.now();
                                            return (
                                                <button
                                                    key={skill.id}
                                                    onClick={() => useSkill(skill)}
                                                    disabled={!canUse || !!onCooldown || isStunned}
                                                    className={`relative overflow-hidden flex flex-col items-center px-4 py-2 rounded-xl border-2 transition-all font-bold min-w-[76px] sm:min-w-[84px] shadow-sm
                                                ${canUse && !onCooldown
                                                            ? `bg-gradient-to-br ${skill.color} border-white/40 text-white hover:scale-105 hover:shadow-[0_0_15px_rgba(255,255,255,0.4)] hover:-translate-y-0.5 z-10`
                                                            : 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed opacity-70 grayscale'
                                                        }
                                            `}
                                                    title={`${skill.name} (MP ${skill.mpCost})`}
                                                >
                                                    {/* 数字バッジ */}
                                                    <div className="absolute top-1 left-1.5 text-white/50 text-[10px] font-black z-10">{idx + 1}</div>

                                                    {/* アイコン */}
                                                    <div className="text-white mb-1 drop-shadow-md scale-110 sm:scale-125 z-10 transition-transform group-hover:scale-125">{skill.icon}</div>

                                                    {/* スキル名とMPコスト */}
                                                    <span className="truncate w-full text-center text-[10px] sm:text-xs text-white font-black drop-shadow-sm leading-tight z-10">{skill.name}</span>
                                                    <span className="text-[9px] sm:text-[10px] text-white/90 font-bold mt-0.5 px-2 bg-black/30 rounded-full z-10">MP {skill.mpCost}</span>

                                                    {/* キラキラエフェクト (使用可能なときのみ) */}
                                                    {canUse && !onCooldown && (
                                                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full hover:animate-[shimmer_1.5s_infinite]"></div>
                                                    )}

                                                    {/* クールダウンオーバーレイ */}
                                                    {onCooldown && (
                                                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px] flex items-center justify-center z-20 rounded-lg">
                                                            <span className="text-white font-mono text-sm sm:text-base font-black animate-pulse">
                                                                {Math.ceil((skillCooldowns[skill.id] - Date.now()) / 1000)}s
                                                            </span>
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}                    {/* クイズエリア */}
                        <div className={`flex-1 sm:h-auto min-h-[140px] bg-slate-900 p-2 sm:p-3 rounded-xl border relative z-20 transition-all max-w-4xl mx-auto w-full mt-1 mb-2 ${isStunned ? 'border-red-500 animate-pulse' : 'border-slate-700 shadow-md'}`}>
                            <AnimatePresence>
                                {isStunned && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 bg-red-900/40 backdrop-blur-[2px] z-50 flex items-center justify-center rounded-xl"
                                    >
                                        <div className="flex items-center gap-2 text-red-400 font-black text-xl">
                                            <Zap size={24} /> 不正解！痺れて動けない！
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {gameState === 'playing' ? (
                                <div className={`h-full flex flex-col ${isStunned ? 'opacity-30 blur-sm pointer-events-none' : ''}`}>
                                    <h3 className="text-sm font-black text-white bg-slate-800 p-2 sm:p-3 rounded-lg mb-2 sm:mb-3 text-center border border-slate-700 shadow-sm">
                                        {activeQuestions[currentQuestionIdx].q}
                                    </h3>
                                    <div className="grid grid-cols-2 gap-2 flex-1">
                                        {activeQuestions[currentQuestionIdx].options.map((opt, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleAnswer(idx)}
                                                className="bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white font-bold p-2 rounded-lg border border-slate-700 hover:border-indigo-400 transition-colors flex items-center justify-center text-center text-xs sm:text-sm leading-tight relative shadow-sm hover:shadow-md"
                                            >
                                                {idx === activeQuestions[currentQuestionIdx].answer && (
                                                    <span className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse shadow-md">
                                                        ★ 正解
                                                    </span>
                                                )}
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-600 font-bold">
                                    待機中...
                                </div>
                            )}
                        </div>
                    </div>

                    {/* GAME OVER オーバーレイ (画面全体) */}
                    {gameState === 'gameover' && (
                        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center z-[100]">
                            <div className="text-center space-y-6">
                                <h2 className="text-5xl font-black text-red-500 tracking-wider">GAME OVER</h2>
                                <p className="text-slate-300 text-lg font-bold">HPが0になってしまった...</p>
                                <div className="flex gap-4 justify-center mt-8">
                                    <button onClick={startGame} className="bg-rose-600 text-white font-black py-4 px-10 rounded-full hover:bg-rose-500 transition-colors shadow-lg">
                                        リトライ
                                    </button>
                                    <button onClick={handleReturnToMap} className="bg-slate-700 text-white font-black py-4 px-10 rounded-full hover:bg-slate-600 transition-colors shadow-lg">
                                        マップへ
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STAGE CLEAR オーバーレイ (画面全体) */}
                    {(gameState === 'clear' || gameState === 'clearing') && (
                        <div className={`fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center z-[100] transition-opacity duration-1000 ${gameState === 'clearing' ? 'opacity-0' : 'opacity-100'}`}>
                            <div className="text-center space-y-6 max-w-lg mx-auto w-full px-4">
                                <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-600 drop-shadow-md">STAGE CLEAR!</h2>
                                <p className="text-slate-300 font-bold text-lg">スコア: {score} | 撃破: {killedCount}/{totalEnemyCount}</p>

                                <div className="flex flex-col gap-3 justify-center mt-6 border-t border-slate-700 pt-8">
                                    <div className="flex justify-between w-64 mx-auto text-base font-bold bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-md">
                                        <span className="text-slate-400">獲得スコア</span>
                                        <span className="text-white">{score}</span>
                                    </div>
                                    <div className="flex justify-between w-64 mx-auto text-base font-bold bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-md">
                                        <span className="text-slate-400">SPボーナス</span>
                                        <span className="text-amber-400">+{currentStageConfig.reward.sp}</span>
                                    </div>
                                </div>

                                {/* クラスアンロックUI */}
                                {unlockedClasses.length > 0 && unlockedClasses.length < 3 && !hasUnlockedNow && selectedStage === 3 && (
                                    <div className="bg-slate-800/80 p-5 rounded-2xl border border-amber-500/50 backdrop-blur-md shadow-[0_0_30px_rgba(245,158,11,0.2)] mt-8">
                                        <h3 className="text-xl font-black text-white mb-2 flex items-center justify-center gap-2">
                                            <Sparkles className="text-amber-400" /> 新たな道が解放されました！
                                        </h3>
                                        <p className="text-slate-300 mb-4 text-xs font-bold">ボス討伐報酬として、新しいクラスを1つ解放できます。</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            {(Object.keys(CHARACTER_DATA) as (keyof typeof CHARACTER_DATA)[]).map(key => {
                                                if (unlockedClasses.includes(key)) return null;
                                                const clsDef = CHARACTER_DATA[key as keyof typeof CHARACTER_DATA];
                                                return (
                                                    <button
                                                        key={key}
                                                        onClick={() => {
                                                            unlockClass(key);
                                                            setHasUnlockedNow(true);
                                                            toast.success(`${clsDef.name}クラスを解放しました！`);
                                                        }}
                                                        className="bg-slate-700 hover:bg-amber-600 text-white p-3 rounded-xl border border-slate-600 transition-colors flex flex-col items-center gap-2"
                                                    >
                                                        <img src={clsDef.stages[0].imageUrl} alt={clsDef.name} className="w-10 h-10 object-cover rounded-lg" />
                                                        <span className="text-sm font-bold">{clsDef.name}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-4 justify-center mt-10">
                                    {activeStages.findIndex(s => s.id === selectedStage) < activeStages.length - 1 && (
                                        <button
                                            onClick={() => {
                                                setSelectedStage(currentStageConfig.id + 1);
                                                setGameState('standby');
                                            }}
                                            className="bg-amber-600 text-white font-black py-4 px-8 rounded-full hover:bg-amber-500 transition-colors shadow-lg"
                                        >
                                            次のステージへ →
                                        </button>
                                    )}
                                    <button onClick={handleReturnToMap} className="bg-slate-700 text-white font-black py-4 px-8 rounded-full hover:bg-slate-600 transition-colors shadow-lg">
                                        マップへ戻る
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </React.Suspense >
    );
}

export default function TowerDefensePage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-slate-900"><div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>}>
            <TowerDefenseContent />
        </Suspense>
    );
}
