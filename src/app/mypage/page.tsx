"use client";

import React, { useEffect } from 'react';
import { User, Settings, LogOut, Trophy, Home, BookOpen, Target, AlertCircle, Headphones } from 'lucide-react';
import { useAppStore } from '@/lib/appStore';
import { useGamificationStore } from '@/store/useGamificationStore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getFallbackAvatarUrl } from '@/lib/avatarUtils';
import { isFeatureEnabled } from '@/config/features';

const DEMO_USER_ID = '061fbf87-f36e-4612-80b4-dedc77b55d5e';

export default function MyPage() {
    const { users, currentUserId, authStatus, activeRole, fetchUsers } = useAppStore();
    const router = useRouter();

    const {
        level,
        exp,
        completedLessons,
        earnedBadges,
        streakCount,
        weaknessLibrary
    } = useGamificationStore();

    useEffect(() => {
        if (authStatus === 'authenticated' && users.length === 0) {
            fetchUsers();
        }

        if (authStatus === 'unauthenticated') {
            const timer = setTimeout(() => {
                router.replace('/login');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [authStatus, users.length, fetchUsers, router]);

    const effectiveId = currentUserId === 'u_yuji' ? DEMO_USER_ID : currentUserId;
    let currentUser = users.find((u: any) => u.id === effectiveId);

    if (!currentUser && activeRole === 'admin') {
        currentUser = users.find((u: any) => u.id === DEMO_USER_ID) || users[0];
    }

    if (!currentUser) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-10 bg-slate-50 gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <div className="text-center">
                    <p className="font-bold text-slate-800">プロファイルを取得中...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            <div className="bg-white p-6 pb-10 rounded-b-[2rem] shadow-sm mb-6 relative">
                <Link href="/dashboard" className="absolute top-6 left-6 text-slate-400 hover:text-blue-600 transition-colors flex items-center gap-1 text-xs font-bold">
                    <Home size={16} />
                    ホームへ戻る
                </Link>
                <div className="flex flex-col items-center mt-6">
                    <img
                        src={currentUser.image || getFallbackAvatarUrl(currentUser.id, currentUser.gender)}
                        alt={currentUser.name}
                        className="w-24 h-24 rounded-full object-cover border-4 border-slate-50 shadow-md mb-4"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (!target.getAttribute('data-error-tried')) {
                                target.setAttribute('data-error-tried', 'true');
                                target.src = getFallbackAvatarUrl(currentUser.id, currentUser.gender);
                            }
                        }}
                    />
                    <h1 className="text-xl font-black text-slate-800 mb-1">{currentUser.name}</h1>
                    <p className="text-sm text-slate-500 font-bold">販売士3級 学習者</p>
                </div>
            </div>

            <div className="p-4 max-w-md mx-auto">
                {/* 資格学習ステータス概要 */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] p-6 text-white shadow-xl mb-6 relative overflow-hidden">
                    <div className="absolute right-[-5%] top-[-10%] opacity-10">
                        <Trophy size={140} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4 border-b border-white/20 pb-4">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-blue-200">Current Level</p>
                                <h2 className="text-3xl font-black">Level {level}</h2>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black uppercase tracking-widest text-blue-200">Total EXP</p>
                                <h2 className="text-2xl font-black">{exp}</h2>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs font-bold text-blue-200 mb-1">完了レッスン</p>
                                <p className="font-black text-xl flex items-center gap-2">
                                    <BookOpen size={16} />
                                    {completedLessons.length}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-blue-200 mb-1">現在のストリーク</p>
                                <p className="font-black text-xl flex items-center gap-2">
                                    <Trophy size={16} />
                                    {streakCount} 日
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 学習関連ショートカット */}
                <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest pl-2 mb-3">Learning Tools</h3>
                <div className="space-y-3 mb-8">
                    {/* コース一覧へ */}
                    <Link href="/elearning" className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors group">
                        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                            <BookOpen size={20} />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-black text-slate-800">コース学習を続ける</h4>
                            <p className="text-[10px] font-bold text-slate-500">カリキュラム一覧へ移動します</p>
                        </div>
                        <div className="text-slate-300 group-hover:text-blue-600 transition-colors">→</div>
                    </Link>

                    {/* 弱点克服へ */}
                    {isFeatureEnabled('WEAKNESS_OVERCOME') && (
                        <Link href="/game/弱点" className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors group">
                            <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-600 group-hover:scale-110 transition-transform relative">
                                <AlertCircle size={20} />
                                {weaknessLibrary.length > 0 && (
                                    <div className="absolute -top-1 -right-1 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white">
                                        {weaknessLibrary.length}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-black text-slate-800">弱点克服モード</h4>
                                <p className="text-[10px] font-bold text-slate-500">間違えた問題を復習します</p>
                            </div>
                            <div className="text-slate-300 group-hover:text-rose-600 transition-colors">→</div>
                        </Link>
                    )}

                    {/* 耳だけ学習へ */}
                    {isFeatureEnabled('AUDIO_ONLY_MODE') && (
                        <Link href="/game/audio-only" className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors group">
                            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                                <Headphones size={20} />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-black text-slate-800">耳だけ学習モード</h4>
                                <p className="text-[10px] font-bold text-slate-500">バックグラウンドで音声学習します</p>
                            </div>
                            <div className="text-slate-300 group-hover:text-emerald-600 transition-colors">→</div>
                        </Link>
                    )}

                    {/* 模擬試験へ */}
                    {isFeatureEnabled('MOCK_EXAM_TIME_ATTACK') && (
                        <Link href="/game/mock-exam" className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors group">
                            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                                <Target size={20} />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-black text-slate-800">模擬試験タイムアタック</h4>
                                <p className="text-[10px] font-bold text-slate-500">知識の定着度を測ります</p>
                            </div>
                            <div className="text-slate-300 group-hover:text-indigo-600 transition-colors">→</div>
                        </Link>
                    )}
                </div>

                <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest pl-2 mb-3">Account</h3>
                <div className="space-y-3">
                    <Link href="/mypage/edit" className="bg-white p-4 rounded-xl shadow-sm flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors">
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600">
                            <User size={18} />
                        </div>
                        <div className="flex-1 font-bold text-slate-700">プロフィール編集</div>
                        <div className="text-slate-300">→</div>
                    </Link>

                    <Link href="/settings" className="bg-white p-4 rounded-xl shadow-sm flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors">
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600">
                            <Settings size={18} />
                        </div>
                        <div className="flex-1 font-bold text-slate-700">設定</div>
                        <div className="text-slate-300">→</div>
                    </Link>

                    <div
                        onClick={async () => {
                            const { logout } = useAppStore.getState();
                            await logout();
                            window.location.replace('/');
                        }}
                        className="bg-white p-4 rounded-xl shadow-sm flex items-center gap-4 cursor-pointer hover:bg-red-50 transition-colors text-red-500 group"
                    >
                        <div className="w-10 h-10 bg-red-50 group-hover:bg-red-100 transition-colors rounded-full flex items-center justify-center">
                            <LogOut size={18} />
                        </div>
                        <div className="flex-1 font-bold">ログアウト</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
