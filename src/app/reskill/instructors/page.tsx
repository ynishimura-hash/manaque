"use client";

import React, { useState, useEffect } from 'react';
import { Users, ChevronRight, BookOpen, Star, Sparkles } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

export default function InstructorListPage() {
    const [instructors, setInstructors] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchInstructors = async () => {
            const res = await fetch('/api/reskill/instructors');
            const data = await res.json();
            setInstructors(data);
            setIsLoading(false);
        };
        fetchInstructors();
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/reskill" className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-100">
                            <BookOpen size={24} />
                        </Link>
                        <h1 className="text-xl font-black tracking-tighter text-slate-900">Reskill University / 講師一覧</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-12">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-4">エキスパート講師陣</h2>
                    <p className="text-slate-500 font-bold max-w-2xl mx-auto">
                        愛媛の第一線で活躍するプロフェッショナルたちが、あなたのスキルアップをサポートします。
                    </p>
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : !Array.isArray(instructors) || instructors.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-[2.5rem] border border-slate-200 border-dashed">
                        <p className="text-slate-400 font-bold">該当する講師が見つかりませんでした。</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {instructors.map((instructor) => (
                            <div key={instructor.id} className="bg-white rounded-[2.5rem] border border-slate-200 p-8 hover:shadow-2xl transition-all group relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-[100px] -z-0 opacity-50 group-hover:scale-125 transition-transform duration-700"></div>

                                <div className="relative z-10 flex flex-col items-center text-center">
                                    <div className="relative mb-6">
                                        <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden group-hover:scale-105 transition-transform cursor-pointer">
                                            <img src={instructor.profile_image || `/eis_logo_mark.png`} className="w-full h-full object-cover" alt="" />
                                        </div>
                                        {instructor.is_official && (
                                            <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-full shadow-lg border-2 border-white">
                                                <Star size={16} fill="currentColor" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="mb-4">
                                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full mb-2 inline-block">
                                            {instructor.specialization || 'Professional'}
                                        </span>
                                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">{instructor.display_name}</h3>
                                    </div>

                                    <p className="text-slate-500 font-medium text-sm leading-relaxed mb-8 line-clamp-3">
                                        {instructor.bio || '講師の紹介文がまだありません。'}
                                    </p>

                                    <div className="flex gap-2 mt-auto">
                                        <Link
                                            href={`/reskill/events?instructor_id=${instructor.id}`}
                                            className="px-6 py-3 bg-slate-900 text-white font-black text-sm rounded-2xl hover:bg-black transition-all shadow-lg active:scale-95 flex items-center gap-2"
                                        >
                                            講座を見る <ChevronRight size={16} />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
