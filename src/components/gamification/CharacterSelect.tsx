"use client";

import React from 'react';
import { useGamificationStore, CharacterType } from '@/store/useGamificationStore';
import { CHARACTER_DATA } from './characterData';
import { ChevronRight, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export function CharacterSelect() {
    const { selectCharacter, unlockedClasses } = useGamificationStore();

    // まだ誰も選んでいない初回起動時は、全て選択可能として扱う
    const isFirstTime = unlockedClasses.length === 0;

    const handleSelect = (key: CharacterType, isUnlocked: boolean) => {
        if (isUnlocked) {
            selectCharacter(key);
            if (isFirstTime) {
                toast.success('最初のクラスを選択しました！', { icon: '✨' });
            }
        } else {
            toast.error('このクラスはまだ解放されていません。ステージを進めて解放しましょう。');
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-white rounded-3xl shadow-xl mt-4 sm:mt-8 border border-slate-100">
            <div className="text-center mb-6 sm:mb-10">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-800 mb-3">
                    {isFirstTime ? 'アバターの道を選択' : 'クラスチェンジ'}
                </h2>
                <p className="text-slate-500 font-bold">
                    {isFirstTime
                        ? '学習状況に応じて進化する分身を選びましょう。'
                        : '現在解放されている他のアバターへ切り替えることができます。'}
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                {(Object.keys(CHARACTER_DATA) as CharacterType[]).map((key) => {
                    const char = CHARACTER_DATA[key];
                    const Icon = char.icon;
                    const isUnlocked = isFirstTime || unlockedClasses.includes(key);

                    return (
                        <div
                            key={key}
                            onClick={() => handleSelect(key, isUnlocked)}
                            className={`flex flex-col items-center rounded-2xl p-6 relative group overflow-hidden border-2
                                ${isUnlocked
                                    ? 'bg-slate-50 cursor-pointer hover:bg-blue-50 hover:shadow-lg transition-all border-transparent hover:border-blue-200'
                                    : 'bg-slate-200 cursor-not-allowed opacity-80 border-slate-300 grayscale'
                                }
                            `}
                        >
                            {/* 未解放時のロック・オーバーレイ */}
                            {!isUnlocked && (
                                <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center">
                                    <div className="bg-slate-800 p-4 rounded-full shadow-lg mb-2">
                                        <Lock size={32} className="text-white" />
                                    </div>
                                    <span className="font-bold text-slate-800 bg-white/80 px-3 py-1 rounded-full text-sm">
                                        未解放
                                    </span>
                                </div>
                            )}

                            {/* 装飾用背景 */}
                            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-100 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500" />

                            <div className={`w-28 h-28 rounded-full flex items-center justify-center mb-4 relative z-10 ${char.stages[0].bg} ${char.stages[0].color} shadow-sm ${isUnlocked ? 'group-hover:scale-110' : ''} transition-transform`}>
                                {char.stages[2].imageUrl ? (
                                    <img src={char.stages[2].imageUrl} alt={char.name} className="w-24 h-24 object-contain drop-shadow-md" />
                                ) : (
                                    <Icon size={40} />
                                )}
                            </div>

                            <h3 className="text-xl font-bold text-slate-800 mb-2 z-10">{char.name}</h3>
                            <p className="text-sm text-slate-500 text-center mb-6 z-10 flex-grow">
                                {char.description}
                            </p>

                            <div className="w-full bg-white rounded-xl px-2 py-2 z-10 border border-slate-100 flex items-center justify-center gap-1 text-[11px] font-bold text-slate-400 relative flex-wrap">
                                <span className={char.stages[0].color}>{char.stages[0].name}</span>
                                <ChevronRight size={12} className="shrink-0" />
                                <span className={char.stages[1].color}>{char.stages[1].name}</span>
                                <ChevronRight size={12} className="shrink-0" />
                                <span className={char.stages[2].color}>{char.stages[2].name}</span>
                            </div>

                            <button
                                className={`mt-4 w-full py-4 rounded-xl font-bold z-10 transition-colors text-base active:scale-95
                                    ${isUnlocked
                                        ? 'bg-slate-800 text-white group-hover:bg-blue-600'
                                        : 'bg-slate-400 text-slate-200'
                                    }
                                `}
                            >
                                {isUnlocked ? 'この道を選ぶ' : 'ロック中'}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
