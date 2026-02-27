"use client";

import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/appStore';
import { useGamificationStore } from '@/store/useGamificationStore';
import { getEquipmentDetails } from '@/config/rpgItems';
import { CHARACTER_DATA, getStatsForLevel } from '@/components/gamification/characterData';
import { getSkillById } from '@/config/skillData';
import {
    Sword, Shield, Target, PlayCircle, Star, Sparkles,
    Ticket, Zap, ChevronUp, ChevronDown, Lock, BookOpen,
    Wand2, Calculator, Gem, Eye, Crown, Watch, Book, Monitor, Award,
    Glasses, Coins, CircleDot, Swords, Bug, RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import { getFallbackAvatarUrl } from '@/lib/avatarUtils';

import { DailyMissions } from '@/components/dashboard/DailyMissions';
import { HabitTracker } from '@/components/gamification/HabitTracker';
import { BadgeCollection } from '@/components/gamification/BadgeCollection';
import toast from 'react-hot-toast';

import { CharacterSelect } from '@/components/gamification/CharacterSelect';

// 装備アイコンのマッピング
function getItemIcon(iconStr: string, size: number = 20) {
    const props = { size, className: 'opacity-70' };
    switch (iconStr) {
        case 'sword': case 'sword-lightning': case 'sword-holy':
            return <Sword {...props} />;
        case 'wand': case 'staff': case 'scepter':
            return <Wand2 {...props} />;
        case 'calculator': case 'monitor':
            return <Calculator {...props} />;
        case 'shield': case 'shield-dragon':
            return <Shield {...props} />;
        case 'armor': case 'armor-shiny':
            return <Shield {...props} />;
        case 'shirt':
            return <Book {...props} />;
        case 'amulet': case 'badge':
            return <Award {...props} />;
        case 'glasses':
            return <Glasses {...props} />;
        case 'coin':
            return <Coins {...props} />;
        case 'pocket-watch': case 'hourglass':
            return <Watch {...props} />;
        case 'book':
            return <Book {...props} />;
        case 'ring':
            return <CircleDot {...props} />;
        default:
            return <Star {...props} />;
    }
}

export default function SeekerDashboard() {
    const {
        currentUserId,
        users,
        activeRole,
        authStatus,
    } = useAppStore();

    const {
        level,
        exp,
        sp,
        gachaTickets,
        equipment,
        selectedCharacterId,
        checkAndAddLoginBonus,
        lastDailyQuizDate,
        equippedSkills,
    } = useGamificationStore();

    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [showEvolutionModal, setShowEvolutionModal] = useState(false);
    const supabase = createClient();

    const fallbackUser = {
        id: 'manaque-guest',
        name: '冒険者',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=manaque',
        isOnline: true,
        age: 20,
        university: '',
        faculty: '',
        bio: '',
        tags: [],
    };
    const currentUser = users.find(u => u.id === currentUserId) ||
        (activeRole === 'admin' ? users.find(u => u.id === '061fbf87-f36e-4612-80b4-dedc77b55d5e') : undefined) ||
        fallbackUser;

    useEffect(() => {
        let isMounted = true;
        const checkAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!isMounted) return;

                if (!session?.user) {
                    setIsCheckingAuth(false);
                    return;
                }
                const currentStore = useAppStore.getState();
                if (currentStore.authStatus !== 'authenticated' || currentStore.currentUserId !== session.user.id) {
                    currentStore.loginAs('seeker', session.user.id);
                }
            } catch (error) {
                console.error('認証チェックエラー:', error);
            } finally {
                if (isMounted) setIsCheckingAuth(false);
            }
        };
        checkAuth();
        return () => { isMounted = false; };
    }, [supabase]);

    useEffect(() => {
        if (currentUser && isCheckingAuth) {
            setIsCheckingAuth(false);
            // ログイン認証が確定したらクラウドから最新データをロード
            useGamificationStore.getState().loadFromCloud();
        }
    }, [currentUser, isCheckingAuth]);

    useEffect(() => {
        if (!isCheckingAuth && currentUser) {
            const bonusResult = checkAndAddLoginBonus();
            if (bonusResult) {
                toast.success(
                    `連続${bonusResult.newStreak}日ログイン！\nボーナス ${bonusResult.bonusExp} EXP を獲得しました！`,
                    { duration: 4000, position: 'top-center', icon: '🔥', style: { borderRadius: '16px', background: '#333', color: '#fff', fontWeight: 'bold' } }
                );
            }
        }
    }, [isCheckingAuth, !!currentUser, checkAndAddLoginBonus]);

    const characterInfo = selectedCharacterId ? CHARACTER_DATA[selectedCharacterId as keyof typeof CHARACTER_DATA] : null;
    const currentStage = characterInfo?.stages.slice().reverse().find(s => level >= s.level) || characterInfo?.stages[0];
    const characterImage = currentStage?.imageUrl;
    // レベルに応じたステータス（線形補間）
    const interpolatedStats = selectedCharacterId ? getStatsForLevel(selectedCharacterId, level) : null;

    const weaponDetails = getEquipmentDetails(equipment.weapon);
    const armorDetails = getEquipmentDetails(equipment.armor);
    const accessoryDetails = getEquipmentDetails(equipment.accessory);

    // セットしたスキル
    const equippedSkillDefs = equippedSkills.map(id => getSkillById(id)).filter(Boolean);

    // デイリーミッション
    const todayStr = new Date().toISOString().split('T')[0];
    const missions = [
        { id: 'login', label: 'ログインする', isCompleted: true, link: undefined },
        {
            id: 'daily_quiz',
            label: 'デイリークイズに挑戦する',
            isCompleted: lastDailyQuizDate === todayStr,
            link: '/game/daily-quiz'
        }
    ];

    // レベル増減（デモ用）
    const handleLevelChange = (delta: number) => {
        const store = useGamificationStore.getState();
        const newLevel = Math.max(1, Math.min(10, store.level + delta));
        useGamificationStore.setState({ level: newLevel });
        toast.success(`レベルが ${newLevel} になりました！`, { icon: delta > 0 ? '⬆️' : '⬇️' });
    };

    if (isCheckingAuth) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }


    const renderEvolutionModal = () => {
        if (!selectedCharacterId || !characterInfo) return null;

        return (
            <AnimatePresence>
                {showEvolutionModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-2 sm:p-4"
                        onClick={() => setShowEvolutionModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-slate-800 border border-slate-700 rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 md:p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setShowEvolutionModal(false)}
                                className="absolute top-3 right-3 w-11 h-11 bg-slate-700/50 hover:bg-slate-600 rounded-full flex items-center justify-center text-slate-300 transition-colors"
                            >
                                ✕
                            </button>

                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-black text-white mb-2 flex items-center justify-center gap-3">
                                    <characterInfo.icon size={28} className="text-indigo-400" />
                                    {characterInfo.name} の進化ツリー
                                </h2>
                                <p className="text-sm font-bold text-slate-400">{characterInfo.description}</p>
                            </div>

                            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 relative pb-8">
                                <div className="hidden md:block absolute top-[100px] left-[15%] right-[15%] h-1 bg-slate-700 z-0"></div>
                                <div className="block md:hidden absolute left-1/2 top-[100px] bottom-[100px] w-1 -translate-x-1/2 bg-slate-700 z-0"></div>

                                {characterInfo.stages.map((stage) => {
                                    const isCurrent = level >= stage.level && (!characterInfo.stages.find(s => s.level > stage.level && level >= s.level));
                                    const isActualCurrent = currentStage?.level === stage.level;
                                    const isLocked = level < stage.level;
                                    const stageStats = getStatsForLevel(selectedCharacterId, stage.level);

                                    return (
                                        <div key={stage.level} className="relative z-10 flex flex-col items-center group w-full max-w-[240px]">
                                            <div className={`
                                                w-48 h-48 rounded-full flex items-center justify-center border-4 mb-4 transition-all duration-300 relative p-4
                                                ${isActualCurrent ? 'bg-gradient-to-b from-indigo-500/30 to-slate-800 border-indigo-400 shadow-[0_0_30px_rgba(79,70,229,0.3)] scale-110' :
                                                    isLocked ? 'bg-slate-900 border-slate-800 opacity-60 grayscale' : 'bg-slate-800 border-slate-600'}
                                            `}>
                                                {isLocked && <Lock className="absolute z-20 text-slate-500 w-12 h-12" />}
                                                <img
                                                    src={stage.imageUrl}
                                                    alt={stage.name}
                                                    className={`w-full h-full object-contain drop-shadow-lg transition-transform duration-300 ${isActualCurrent ? 'scale-110' : ''}`}
                                                />
                                            </div>

                                            <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-4 w-full text-center">
                                                <div className="text-xs font-black text-indigo-400 mb-1">Lv.{stage.level}で進化</div>
                                                <h3 className={`text-lg font-black mb-3 ${isLocked ? 'text-slate-500' : 'text-white'}`}>{stage.name}</h3>

                                                <div className="grid grid-cols-2 gap-2 text-left">
                                                    <div className="bg-slate-800 rounded-lg px-3 py-1.5 flex justify-between items-center opacity-80">
                                                        <span className="text-[10px] text-slate-400 font-bold">HP</span>
                                                        <span className="text-emerald-400 font-black">{stageStats.hp}</span>
                                                    </div>
                                                    <div className="bg-slate-800 rounded-lg px-3 py-1.5 flex justify-between items-center opacity-80">
                                                        <span className="text-[10px] text-slate-400 font-bold">ATK</span>
                                                        <span className="text-rose-400 font-black">{stageStats.atk}</span>
                                                    </div>
                                                    <div className="bg-slate-800 rounded-lg px-3 py-1.5 flex justify-between items-center opacity-80">
                                                        <span className="text-[10px] text-slate-400 font-bold">DEF</span>
                                                        <span className="text-blue-400 font-black">{stageStats.def}</span>
                                                    </div>
                                                    <div className="bg-slate-800 rounded-lg px-3 py-1.5 flex justify-between items-center opacity-80">
                                                        <span className="text-[10px] text-slate-400 font-bold">SPD</span>
                                                        <span className="text-amber-400 font-black">{stageStats.spd}</span>
                                                    </div>
                                                </div>

                                                {isActualCurrent && (
                                                    <div className="mt-3 text-xs font-black text-white bg-indigo-500 py-1 px-3 rounded-full inline-block shadow-lg">
                                                        現在
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        );
    };

    if (!selectedCharacterId) {
        return (
            <div className="min-h-screen bg-slate-900 py-12 px-4 flex items-center justify-center">
                <CharacterSelect />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 text-slate-200 pb-24 font-sans selection:bg-indigo-500/30">
            {/* 背景装飾 */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[120px]" />
                <div className="absolute bottom-[10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-purple-600/10 blur-[100px]" />
            </div>

            {/* ヘッダー */}
            <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800">
                <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <img
                                src={currentUser.image || getFallbackAvatarUrl(currentUser.id, (currentUser as any).gender)}
                                className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-500"
                                alt=""
                            />
                            <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-slate-900 shadow-sm">
                                Lv.{level}
                            </div>
                        </div>
                        <div>
                            <h1 className="text-sm font-black text-white">{currentUser.name}</h1>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-bold text-slate-400">Class:</span>
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">
                                    {selectedCharacterId ? selectedCharacterId : 'Novice'}
                                </span>
                            </div>
                            <button
                                onClick={() => useGamificationStore.getState().resetProgress()}
                                className="mt-1 text-[10px] font-bold text-slate-400 active:text-indigo-400 transition-colors flex items-center gap-1 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700 active:border-indigo-500/50 min-h-[28px]"
                            >
                                <RefreshCw size={10} />
                                アバター変更
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 bg-slate-800/50 p-2 px-4 rounded-2xl border border-slate-700/50">
                        <div className="flex flex-col items-center">
                            <div className="flex items-center gap-1 text-sky-400">
                                <Zap size={14} />
                                <span className="text-sm font-black">{sp}</span>
                            </div>
                            <span className="text-[9px] font-black text-slate-500">SP</span>
                        </div>
                        <div className="w-[1px] h-6 bg-slate-700"></div>
                        <div className="flex flex-col items-center">
                            <div className="flex items-center gap-1 text-amber-400">
                                <Ticket size={14} />
                                <span className="text-sm font-black">{gachaTickets}</span>
                            </div>
                            <span className="text-[9px] font-black text-slate-500">Tickets</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-4 md:p-6 space-y-6 relative z-10">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

                    {/* キャラクター＆装備エリア */}
                    <div className="bg-slate-800/40 border border-slate-700/50 rounded-[2rem] p-5 lg:p-6 backdrop-blur-sm relative overflow-hidden">
                        <div className="absolute right-[-5%] top-[-10%] opacity-5 text-indigo-500">
                            <Shield size={200} />
                        </div>

                        <div className="flex flex-col md:flex-row gap-6 items-center">
                            {/* アバター表示 */}
                            <div className="flex-1 flex flex-col items-center justify-center p-2">
                                <button
                                    onClick={() => setShowEvolutionModal(true)}
                                    className="w-36 h-36 bg-gradient-to-b from-indigo-500/20 to-slate-900/80 rounded-full flex items-center justify-center border-4 border-slate-700 shadow-[0_0_30px_rgba(79,70,229,0.2)] mb-3 relative p-2 group hover:border-indigo-500 transition-colors cursor-pointer"
                                    title="クリックで進化ツリーを確認"
                                >
                                    {characterImage ? (
                                        <img src={characterImage} alt={currentStage?.name || 'Hero'} className="w-full h-full object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-300" />
                                    ) : (
                                        <Shield size={56} className="text-slate-500 drop-shadow-md" />
                                    )}
                                    <svg viewBox="0 0 144 144" className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none overflow-visible">
                                        <circle cx="72" cy="72" r="68" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-800/50" />
                                        <circle cx="72" cy="72" r="68" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray="427" strokeDashoffset={427 - (427 * (exp % 100)) / 100} className="text-indigo-500 transition-all duration-1000" />
                                    </svg>
                                </button>

                                <div className="text-center w-full">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-0.5">EXP</p>
                                    <p className="text-lg font-black text-white mb-2">{exp} <span className="text-sm text-slate-500 font-bold">/ Next 100</span></p>

                                    {/* レベル増減ボタン（デモ用） */}
                                    <div className="flex items-center justify-center gap-2 mb-3">
                                        <button onClick={() => handleLevelChange(-1)} disabled={level <= 1}
                                            className="w-8 h-8 bg-slate-700 hover:bg-slate-600 rounded-full flex items-center justify-center text-white disabled:opacity-30 transition-colors">
                                            <ChevronDown size={16} />
                                        </button>
                                        <span className="text-sm font-black text-indigo-400 w-16 text-center">Lv.{level} / 10</span>
                                        <button onClick={() => handleLevelChange(1)} disabled={level >= 10}
                                            className="w-8 h-8 bg-slate-700 hover:bg-slate-600 rounded-full flex items-center justify-center text-white disabled:opacity-30 transition-colors">
                                            <ChevronUp size={16} />
                                        </button>
                                    </div>

                                    {/* ステータス */}
                                    {interpolatedStats && (
                                        <div className="grid grid-cols-4 gap-1.5 w-full max-w-[220px] mx-auto bg-slate-900/50 p-2 rounded-xl border border-slate-700/50">
                                            <div className="flex flex-col items-center">
                                                <span className="text-[8px] text-slate-500 font-bold">HP</span>
                                                <span className="text-emerald-400 font-black text-xs">{interpolatedStats.hp}</span>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <span className="text-[8px] text-slate-500 font-bold">ATK</span>
                                                <span className="text-rose-400 font-black text-xs">{interpolatedStats.atk}</span>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <span className="text-[8px] text-slate-500 font-bold">DEF</span>
                                                <span className="text-blue-400 font-black text-xs">{interpolatedStats.def}</span>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <span className="text-[8px] text-slate-500 font-bold">SPD</span>
                                                <span className="text-amber-400 font-black text-xs">{interpolatedStats.spd}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* セット済みスキル表示 */}
                                    {equippedSkillDefs.length > 0 && (
                                        <div className="mt-3 flex items-center justify-center gap-2">
                                            <span className="text-[9px] text-slate-500 font-bold">SKILLS:</span>
                                            {equippedSkillDefs.map(skill => skill && (
                                                <div key={skill.id} className={`bg-gradient-to-r ${skill.color} px-2 py-0.5 rounded-full text-[9px] font-bold text-white`}>
                                                    {skill.name}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 装備スロット */}
                            <div className="flex-1 w-full space-y-3">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-700 pb-2 mb-3">Current Equipment</h3>

                                <EquipmentSlot label="Weapon" item={weaponDetails} />
                                <EquipmentSlot label="Armor" item={armorDetails} />
                                <EquipmentSlot label="Accessory" item={accessoryDetails} />

                                <Link href="/mypage/equipment" className="mt-3 block text-center text-xs font-bold text-indigo-400 hover:text-indigo-300 py-2 bg-indigo-500/10 rounded-xl transition-colors">
                                    装備を変更する
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* メインアクション 5ボタン横並び */}
                    <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
                        <Link href="/elearning" className="bg-gradient-to-br from-indigo-600 to-blue-700 p-4 rounded-2xl shadow-lg group hover:scale-[1.02] transition-transform relative overflow-hidden flex flex-col justify-between min-h-[120px]">
                            <div className="absolute right-[-15%] bottom-[-25%] opacity-15">
                                <BookOpen size={80} />
                            </div>
                            <div className="relative z-10">
                                <PlayCircle size={20} className="text-white/80 mb-2" />
                                <h3 className="text-sm font-black text-white leading-tight">学習</h3>
                                <p className="text-[9px] font-bold text-indigo-200/70 mt-1">動画でEXP獲得</p>
                            </div>
                        </Link>

                        <Link href="/game/tower-defense" className="bg-gradient-to-br from-rose-600 to-orange-600 p-4 rounded-2xl shadow-lg group hover:scale-[1.02] transition-transform relative overflow-hidden flex flex-col justify-between min-h-[120px]">
                            <div className="absolute right-[-15%] bottom-[-25%] opacity-15">
                                <Swords size={80} />
                            </div>
                            <div className="relative z-10">
                                <Swords size={20} className="text-white/80 mb-2" />
                                <h3 className="text-sm font-black text-white leading-tight">TD</h3>
                                <p className="text-[9px] font-bold text-rose-200/70 mt-1">バトルで報酬</p>
                            </div>
                        </Link>

                        <Link href="/game/gacha" className="bg-gradient-to-br from-amber-500 to-yellow-600 p-4 rounded-2xl shadow-lg group hover:scale-[1.02] transition-transform relative overflow-hidden flex flex-col justify-between min-h-[120px]">
                            <div className="absolute right-[-15%] bottom-[-25%] opacity-15">
                                <Sparkles size={80} />
                            </div>
                            <div className="relative z-10">
                                <Ticket size={20} className="text-white/80 mb-2" />
                                <h3 className="text-sm font-black text-white leading-tight">ガチャ</h3>
                                <p className="text-[9px] font-bold text-amber-200/70 mt-1">装備入手</p>
                            </div>
                        </Link>

                        <Link href="/game/skill-tree" className="bg-gradient-to-br from-emerald-600 to-teal-700 p-4 rounded-2xl shadow-lg group hover:scale-[1.02] transition-transform relative overflow-hidden flex flex-col justify-between min-h-[120px]">
                            <div className="absolute right-[-15%] bottom-[-25%] opacity-15">
                                <Zap size={80} />
                            </div>
                            <div className="relative z-10">
                                <Zap size={20} className="text-white/80 mb-2" />
                                <h3 className="text-sm font-black text-white leading-tight">スキル</h3>
                                <p className="text-[9px] font-bold text-emerald-200/70 mt-1">SP消費で強化</p>
                            </div>
                        </Link>

                        <Link href="/game/partner-room" className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-2xl shadow-lg group hover:scale-[1.02] transition-transform relative overflow-hidden flex flex-col justify-between min-h-[120px]">
                            <div className="absolute right-[-15%] bottom-[-25%] opacity-15">
                                <Bug size={80} />
                            </div>
                            <div className="relative z-10">
                                <Sparkles size={20} className="text-white/80 mb-2" />
                                <h3 className="text-sm font-black text-white leading-tight">パートナー</h3>
                                <p className="text-[9px] font-bold text-indigo-200/70 mt-1">卵ガチャ・編成</p>
                            </div>
                        </Link>
                    </div>

                    {/* サブ機能 */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1 bg-slate-800 rounded-[2rem] p-6 border border-slate-700 shadow-sm">
                            <DailyMissions missions={missions} />
                        </div>
                        <div className="lg:col-span-2">
                            <HabitTracker />
                        </div>
                    </div>

                    <div>
                        <BadgeCollection />
                    </div>

                </motion.div>
            </main>
            {renderEvolutionModal()}
        </div>
    );
}

// 装備スロット用サブコンポーネント
function EquipmentSlot({ label, item }: { label: string, item: any }) {
    const isEquipped = !!item;
    const iconElement = isEquipped ? getItemIcon(item.icon, 20) : (
        label === 'Weapon' ? <Sword size={20} className="opacity-30" /> :
            label === 'Armor' ? <Shield size={20} className="opacity-30" /> :
                <Star size={20} className="opacity-30" />
    );

    return (
        <div className="flex items-center gap-3 bg-slate-900/60 p-2.5 pr-4 rounded-xl border border-slate-700/50 group hover:border-indigo-500/50 transition-colors">
            <div className={`w-10 h-10 rounded-lg flex flex-shrink-0 items-center justify-center ${isEquipped ? 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-slate-800 text-slate-500 border border-dashed border-slate-600'}`}>
                {iconElement}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">{label}</p>
                <div className="flex items-center gap-2">
                    <p className={`text-xs font-black truncate ${isEquipped ? 'text-slate-200' : 'text-slate-600'}`}>
                        {isEquipped ? item.name : '装備なし'}
                    </p>
                    {isEquipped && (
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded
                            ${item.rarity === 'SSR' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                                item.rarity === 'SR' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                                    item.rarity === 'R' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' :
                                        'bg-slate-700 text-slate-400 border border-slate-600'
                            }`}>
                            {item.rarity}
                        </span>
                    )}
                </div>
                {isEquipped && (
                    <p className="text-[9px] font-bold text-indigo-400 truncate mt-0.5">
                        {item.effectType === 'EXP_BOOST' ? `EXP+${item.effectValue}%` :
                            item.effectType === 'TIME_SLOW' ? `遅延 ${item.effectValue}%` :
                                item.effectType === 'SHIELD' ? `シールド ${item.effectValue}回` :
                                    item.effectType === 'QUICK_KILL' ? `開幕撃破` : 'バフなし'}
                    </p>
                )}
            </div>
        </div>
    );
}
