"use client";

import React, { useEffect, useState } from 'react';
import { User as UserIcon, MapPin, Briefcase, GraduationCap, Sparkles, Trophy, ArrowLeft, ExternalLink, MessageSquare, Heart } from 'lucide-react';
import { useAppStore, User } from '@/lib/appStore';
import { useRouter } from 'next/navigation';
import { getFallbackAvatarUrl } from '@/lib/avatarUtils';
import { VALUE_CARDS } from '@/lib/constants/analysisData';

export default function ScoutDetailPage({ params }: { params: { userId: string } }) {
    const { users, currentCompanyId, interactions, toggleInteraction, createChat, canSendScout } = useAppStore();
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const foundUser = users.find(u => u.id === params.userId);
        if (foundUser) {
            setUser(foundUser);
        }
    }, [users, params.userId]);

    if (!user) {
        return <div className="p-10 text-center text-slate-400">Loading...</div>;
    }

    const isScouted = interactions.some(i => i.type === 'scout' && i.fromId === currentCompanyId && i.toId === user.id);
    const isLiked = interactions.some(i => i.type === 'like_user' && i.fromId === currentCompanyId && i.toId === user.id);

    const handleScout = async () => {
        if (!canSendScout(currentCompanyId)) return;
        // In a real app, this would open the modal. For now, we just redirect back to scout list with query
        // or we could implementing the modal here too. 
        // Simpler: Redirect to scout page with open modal param? Or just implement simple scout here.
        // Let's just link back to scout page for now or open chat if already scouted.
        if (isScouted) {
            // Find chat
            // router.push('/dashboard/company/messages?chatId=...');
        }
    };

    return (
        <div className="max-w-4xl mx-auto pb-20">
            <button
                onClick={() => router.back()}
                className="mb-6 flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-bold"
            >
                <ArrowLeft size={20} />
                一覧に戻る
            </button>

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                {/* Header / Cover */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 md:p-10 relative">
                    <div className="flex flex-col md:flex-row items-start gap-6 relative z-10">
                        <img
                            src={user.image || getFallbackAvatarUrl(user.id, user.gender)}
                            alt={user.name}
                            className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                        />
                        <div className="flex-1 space-y-2">
                            <div className="flex flex-wrap gap-2 mb-1">
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${user.occupationStatus === 'student' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                                    {user.occupationStatus === 'student' ? 'Student' : 'Worker'}
                                </span>
                                {user.isOnline && (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-600 flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                        Online
                                    </span>
                                )}
                            </div>
                            <h1 className="text-3xl font-black text-slate-800">{user.name}</h1>
                            <div className="flex flex-col gap-1 text-slate-600 font-bold text-sm">
                                <div className="flex items-center gap-2">
                                    <GraduationCap size={16} className="text-slate-400" />
                                    {user.university} {user.faculty} {user.department} ({user.graduationYear}卒)
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-3 min-w-[200px]">
                            <button
                                onClick={() => toggleInteraction('like_user', currentCompanyId, user.id)}
                                className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${isLiked
                                    ? 'bg-pink-50 text-pink-500 border border-pink-200'
                                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                                    }`}
                            >
                                <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
                                {isLiked ? '保存済み' : '気になる'}
                            </button>
                            {/* Note: Scout button logic is complex to duplicate here without context, 
                                easier to handle from the list or add full logic later. 
                                For now, just a placeholder or link to messages if scouted.
                            */}
                        </div>
                    </div>
                </div>

                {/* Body Content */}
                <div className="p-8 md:p-10 space-y-10">

                    {/* Bio */}
                    <section>
                        <h2 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                                <UserIcon size={18} />
                            </span>
                            自己紹介
                        </h2>
                        <div className="bg-slate-50 p-6 rounded-2xl text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
                            {user.bio || '自己紹介はまだありません。'}
                        </div>
                    </section>

                    {/* Tags & Values */}
                    <div className="grid md:grid-cols-2 gap-8">
                        <section>
                            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">
                                Skills & Tags
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                {user.tags && user.tags.length > 0 ? user.tags.map((tag: string) => (
                                    <span key={tag} className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg border border-slate-200">
                                        #{tag}
                                    </span>
                                )) : <span className="text-slate-400 text-sm">タグ設定なし</span>}
                            </div>
                        </section>

                        <section>
                            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">
                                Values (資質)
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                {user.publicValues?.map((valId: number) => {
                                    const card = VALUE_CARDS.find(c => c.id === valId);
                                    return card ? (
                                        <span key={valId} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-lg border border-indigo-100 flex items-center gap-1">
                                            <Sparkles size={12} /> {card.name}
                                        </span>
                                    ) : null;
                                })}
                                {(!user.publicValues || user.publicValues.length === 0) && (
                                    <span className="text-slate-400 text-sm">公開されている資質はありません</span>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Basic Info Table */}
                    <section>
                        <h2 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center">
                                <Briefcase size={18} />
                            </span>
                            基本情報
                        </h2>
                        <div className="border border-slate-100 rounded-2xl overflow-hidden text-sm">
                            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] border-b border-slate-100 last:border-none">
                                <div className="bg-slate-50 p-4 font-bold text-slate-500">希望勤務地</div>
                                <div className="p-4 font-bold text-slate-800">
                                    {user.desiredConditions?.location?.join(', ') || '未設定'}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] border-b border-slate-100 last:border-none">
                                <div className="bg-slate-50 p-4 font-bold text-slate-500">希望業種</div>
                                <div className="p-4 font-bold text-slate-800">
                                    {user.desiredConditions?.industry?.join(', ') || '未設定'}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] border-b border-slate-100 last:border-none">
                                <div className="bg-slate-50 p-4 font-bold text-slate-500">資格・スキル</div>
                                <div className="p-4 font-bold text-slate-800">
                                    {user.qualifications?.join(', ') || 'なし'}
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
