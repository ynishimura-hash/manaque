"use client";

import React, { useState } from 'react';
import { useGamificationStore } from '@/store/useGamificationStore';
import { ArrowLeft, Zap, Lock, Check, Plus, X } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { CLASS_SKILL_TREES, getSkillById } from '@/config/skillData';
import type { SkillDef } from '@/config/skillData';

export default function SkillTreePage() {
    const { sp, consumeSp, level, unlockedSkills, unlockSkill, selectedCharacterId, equippedSkills, equipSkill, unequipSkill } = useGamificationStore();
    const [selectedSkill, setSelectedSkill] = useState<SkillDef | null>(null);

    const currentTree = selectedCharacterId && CLASS_SKILL_TREES[selectedCharacterId] ? CLASS_SKILL_TREES[selectedCharacterId] : [];

    // アンロック済みかつactiveなスキル一覧（セット候補）
    const equippableSkills = currentTree.filter(s => unlockedSkills.includes(s.id) && s.type === 'active');

    const handleUnlock = (skill: SkillDef) => {
        if (unlockedSkills.includes(skill.id)) return;

        if (level < skill.requiredLevel) {
            toast.error(`レベル ${skill.requiredLevel} が必要です`);
            return;
        }

        if (skill.requiredSkillId && !unlockedSkills.includes(skill.requiredSkillId)) {
            toast.error('前提スキルが未解放です');
            return;
        }

        if (sp < skill.spCost) {
            toast.error('SPが足りません');
            return;
        }

        const success = consumeSp(skill.spCost);
        if (success) {
            unlockSkill(skill.id);
            toast.success(`${skill.name} を習得しました！`, { icon: '✨' });
            setSelectedSkill(null);
        }
    };

    const handleEquip = (skillId: string) => {
        if (equippedSkills.length >= 3) {
            toast.error('スキルは3つまでセットできます');
            return;
        }
        equipSkill(skillId);
        toast.success('スキルをセットしました！', { icon: '⚔️' });
    };

    const handleUnequip = (skillId: string) => {
        unequipSkill(skillId);
        toast.success('スキルを外しました');
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-200 pb-24 font-sans selection:bg-emerald-500/30">
            {/* 背景装飾 */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-1/4 left-1/4 w-[800px] h-[800px] rounded-full bg-emerald-600/5 blur-[150px]" />
                <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] rounded-full bg-teal-400/5 blur-[120px]" />
            </div>

            <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800">
                <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                    <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft size={20} />
                        <span className="text-sm font-bold">拠点へ戻る</span>
                    </Link>
                    <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-1.5 rounded-full border border-emerald-500/30">
                        <Zap size={16} />
                        <span className="text-sm font-black">SP {sp}</span>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-4 md:p-6 relative z-10 flex flex-col md:flex-row gap-6">

                {/* スキルツリー表示エリア */}
                <div className="flex-1 bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
                    <h2 className="text-center text-xl font-black text-white mb-6 border-b border-slate-700 pb-4">スキルツリー</h2>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 place-items-center">
                        {currentTree.map((skill) => {
                            const isUnlocked = unlockedSkills.includes(skill.id);
                            const isSelected = selectedSkill?.id === skill.id;
                            const isLevelReqMet = level >= skill.requiredLevel;
                            const isSkillReqMet = !skill.requiredSkillId || unlockedSkills.includes(skill.requiredSkillId);
                            const isLocked = !isUnlocked && (!isLevelReqMet || !isSkillReqMet);

                            return (
                                <button
                                    key={skill.id}
                                    onClick={() => setSelectedSkill(skill)}
                                    className={`relative flex flex-col items-center justify-center w-24 h-24 rounded-full border-4 transition-all duration-300 shadow-lg
                                        ${isSelected ? 'scale-110 ring-4 ring-emerald-500 ring-offset-4 ring-offset-slate-900 border-emerald-400 z-10' : ''}
                                        ${isUnlocked ? `bg-gradient-to-br ${skill.color} border-white text-white` :
                                            isLocked ? 'bg-slate-800 border-slate-700 text-slate-600 opacity-60' :
                                                'bg-slate-700 border-emerald-500/50 text-emerald-100 hover:border-emerald-400'}
                                    `}
                                >
                                    {isUnlocked && (
                                        <div className="absolute -top-2 -right-2 bg-emerald-500 text-white p-1 rounded-full border-2 border-slate-900">
                                            <Check size={14} strokeWidth={3} />
                                        </div>
                                    )}
                                    {isLocked && !isUnlocked && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 rounded-full">
                                            <Lock size={24} className="text-slate-500" />
                                        </div>
                                    )}
                                    <div className={`mb-1 ${isLocked ? 'blur-[2px]' : ''}`}>
                                        {skill.icon}
                                    </div>
                                    <span className={`text-[10px] font-black w-20 truncate px-1 text-center ${isLocked ? 'blur-[2px]' : ''}`}>
                                        {skill.name}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* === バトルスキルセット === */}
                    <div className="mt-8 pt-6 border-t border-slate-700">
                        <h3 className="text-sm font-black text-amber-400 mb-4 flex items-center gap-2">
                            ⚔️ バトルスキルセット <span className="text-[10px] text-slate-400 font-normal">（最大3つ）</span>
                        </h3>

                        {/* 3スロット */}
                        <div className="flex gap-3 mb-4">
                            {[0, 1, 2].map((slotIdx) => {
                                const skillId = equippedSkills[slotIdx];
                                const skill = skillId ? getSkillById(skillId) : null;

                                return (
                                    <div
                                        key={slotIdx}
                                        className={`relative flex-1 h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all
                                            ${skill ? `border-amber-500/50 bg-gradient-to-br ${skill.color}` : 'border-slate-600 bg-slate-800/50'}
                                        `}
                                    >
                                        {skill ? (
                                            <>
                                                <div className="text-white mb-0.5">{skill.icon}</div>
                                                <span className="text-[9px] font-bold text-white/90">{skill.name}</span>
                                                <span className="text-[8px] text-amber-200/80">MP {skill.mpCost}</span>
                                                <button
                                                    onClick={() => handleUnequip(skillId)}
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white p-0.5 rounded-full border-2 border-slate-900 hover:bg-red-400"
                                                >
                                                    <X size={10} />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <Plus size={16} className="text-slate-500 mb-1" />
                                                <span className="text-[9px] text-slate-500">スロット{slotIdx + 1}</span>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* セット候補一覧 */}
                        {equippableSkills.length > 0 && (
                            <div className="space-y-2">
                                <span className="text-[10px] text-slate-400 font-bold">セット可能なスキル:</span>
                                <div className="flex flex-wrap gap-2">
                                    {equippableSkills.filter(s => !equippedSkills.includes(s.id)).map(skill => (
                                        <button
                                            key={skill.id}
                                            onClick={() => handleEquip(skill.id)}
                                            className="flex items-center gap-1.5 bg-slate-700/80 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border border-slate-600"
                                        >
                                            {skill.icon}
                                            <span>{skill.name}</span>
                                            <span className="text-amber-400 text-[10px]">MP{skill.mpCost}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* スキル詳細・習得エリア */}
                <div className="w-full md:w-80 bg-slate-800/80 border border-slate-700 rounded-2xl p-6 shadow-xl flex flex-col">
                    <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
                        <Zap className="text-emerald-500" />
                        詳細・習得
                    </h3>

                    {selectedSkill ? (
                        <div className="flex-1 flex flex-col">
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-gradient-to-br ${selectedSkill.color} text-white shadow-lg`}>
                                {selectedSkill.icon}
                            </div>

                            <div className="flex items-center gap-2 mb-2">
                                <span className="bg-slate-700 text-slate-300 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                                    {selectedSkill.type === 'active' ? 'アクティブ' : 'パッシブ'}
                                </span>
                                {selectedSkill.mpCost && (
                                    <span className="bg-blue-700/50 text-blue-300 text-[10px] font-black px-2 py-0.5 rounded">
                                        MP {selectedSkill.mpCost}
                                    </span>
                                )}
                                {selectedSkill.targetType && (
                                    <span className="bg-amber-700/50 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded">
                                        {selectedSkill.targetType === 'single' ? '単体' :
                                            selectedSkill.targetType === 'multi' ? `${selectedSkill.hitCount}体` :
                                                selectedSkill.targetType === 'all' ? '全体' :
                                                    selectedSkill.targetType === 'dot' ? '持続' : '自分'}
                                    </span>
                                )}
                            </div>
                            <h4 className="text-xl font-black text-white mb-2">{selectedSkill.name}</h4>
                            <p className="text-sm text-slate-300 mb-4 leading-relaxed">
                                {selectedSkill.description}
                            </p>

                            {/* バトル効果 */}
                            {selectedSkill.type === 'active' && selectedSkill.damageMultiplier && (
                                <div className="bg-amber-900/20 border border-amber-700/30 rounded-xl p-3 mb-4">
                                    <span className="text-[10px] text-amber-400 font-bold">バトル効果</span>
                                    <div className="text-sm text-white font-bold mt-1">
                                        ダメージ倍率: ×{selectedSkill.damageMultiplier}
                                    </div>
                                </div>
                            )}

                            <div className="bg-slate-900/50 rounded-xl p-4 mb-6 space-y-3 border border-slate-700/50">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-400 font-bold">必要レベル</span>
                                    <span className={`font-black ${level >= selectedSkill.requiredLevel ? 'text-emerald-400' : 'text-red-400'}`}>
                                        Lv {selectedSkill.requiredLevel}
                                    </span>
                                </div>
                                {selectedSkill.requiredSkillId && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-400 font-bold">前提スキル</span>
                                        <span className={`font-black ${unlockedSkills.includes(selectedSkill.requiredSkillId) ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {currentTree.find(s => s.id === selectedSkill.requiredSkillId)?.name || '???'}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-700">
                                    <span className="text-slate-400 font-bold">消費SP</span>
                                    <span className="font-black text-amber-400">{selectedSkill.spCost} SP</span>
                                </div>
                            </div>

                            <div className="mt-auto pt-4">
                                {unlockedSkills.includes(selectedSkill.id) ? (
                                    <button disabled className="w-full py-4 rounded-xl bg-slate-700 text-slate-400 font-black cursor-not-allowed">
                                        習得済み
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleUnlock(selectedSkill)}
                                        disabled={
                                            level < selectedSkill.requiredLevel ||
                                            (selectedSkill.requiredSkillId ? !unlockedSkills.includes(selectedSkill.requiredSkillId) : false) ||
                                            sp < selectedSkill.spCost
                                        }
                                        className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors shadow-lg shadow-emerald-900/20"
                                    >
                                        SPを消費して習得
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 h-full min-h-[300px]">
                            <Zap size={48} className="mb-4 opacity-20" />
                            <p className="font-bold text-center">スキルを選択して<br />詳細を確認してください</p>
                        </div>
                    )}
                </div>

            </main>
        </div>
    );
}
