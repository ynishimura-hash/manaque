"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, Lock, Eye, EyeOff } from 'lucide-react';

const PASSCODE = process.env.NEXT_PUBLIC_APP_PASSCODE || 'manaque2025';
const STORAGE_KEY = 'manaque_unlocked';

export default function WelcomePage() {
    const router = useRouter();
    const [input, setInput] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [shaking, setShaking] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY) === 'true') {
            router.replace('/dashboard');
        }
    }, [router]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input === PASSCODE) {
            localStorage.setItem(STORAGE_KEY, 'true');
            router.replace('/dashboard');
        } else {
            setError('パスコードが違います');
            setShaking(true);
            setInput('');
            setTimeout(() => setShaking(false), 500);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 flex items-center justify-center p-4">
            {/* 背景装飾 */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl" />
            </div>

            <div
                className={`relative w-full max-w-sm bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl ${shaking ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}
                style={shaking ? { animation: 'shake 0.5s ease-in-out' } : {}}
            >
                {/* ロゴ */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-600/30">
                        <GraduationCap size={32} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-black text-white tracking-tight">マナクエ</h1>
                    <p className="text-blue-300 text-sm font-bold mt-1">学んで、強くなれ。</p>
                </div>

                {/* パスコードフォーム */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2">
                            <Lock size={14} className="inline mr-1" />
                            パスコードを入力
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={input}
                                onChange={(e) => {
                                    setInput(e.target.value);
                                    setError('');
                                }}
                                placeholder="パスコード"
                                autoFocus
                                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 font-bold focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all pr-12"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {error && (
                            <p className="text-red-400 text-sm font-bold mt-2">{error}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3 rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-600/30"
                    >
                        入室する
                    </button>
                </form>
            </div>

            <style jsx global>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    20% { transform: translateX(-8px); }
                    40% { transform: translateX(8px); }
                    60% { transform: translateX(-6px); }
                    80% { transform: translateX(6px); }
                }
            `}</style>
        </div>
    );
}
