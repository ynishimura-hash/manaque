"use client";

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/appStore';
import { Users, BookOpen, ChevronRight, Calendar, CheckCircle2, XCircle, Search, Filter } from 'lucide-react';
import Link from 'next/link';

export default function ParticipantManagementPage() {
    const { activeRole, authStatus, currentUserId } = useAppStore();
    const [events, setEvents] = useState<any[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [participants, setParticipants] = useState<any[]>([]);
    const [isLoadingEvents, setIsLoadingEvents] = useState(true);
    const [isLoadingParticipants, setIsLoadingParticipants] = useState(false);

    // Initial load: Fetch events for this instructor
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                // If admin, show all events. If instructor, filter by their ID.
                // For simplicity, we'll fetch all and the API/RLS will handle the rest
                const res = await fetch('/api/reskill/events');
                const data = await res.json();
                setEvents(data);
                if (data.length > 0) setSelectedEventId(data[0].id);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoadingEvents(false);
            }
        };
        if (authStatus === 'authenticated') fetchEvents();
    }, [authStatus]);

    // Fetch participants when event is selected
    useEffect(() => {
        if (!selectedEventId) return;
        const fetchParticipants = async () => {
            setIsLoadingParticipants(true);
            try {
                const res = await fetch(`/api/reskill/applications?event_id=${selectedEventId}`);
                const data = await res.json();
                // For instructors, the user requested to hide cancelled ones
                // For admins, show all
                const filtered = activeRole === 'admin' ? data : data.filter((p: any) => p.status === 'applied');
                setParticipants(filtered);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoadingParticipants(false);
            }
        };
        fetchParticipants();
    }, [selectedEventId, activeRole]);

    const activeEvent = events.find(e => e.id === selectedEventId);

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/reskill" className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-100">
                            <BookOpen size={24} />
                        </Link>
                        <h1 className="text-xl font-black tracking-tighter text-slate-900">Reskill University / 参加者管理</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Event Sidebar */}
                    <div className="lg:col-span-1 space-y-4">
                        <h2 className="text-lg font-black text-slate-800 mb-4 px-2">講座を選択</h2>
                        {isLoadingEvents ? (
                            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 animate-pulse text-slate-400 font-bold">
                                読み込み中...
                            </div>
                        ) : events.length === 0 ? (
                            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 border-dashed text-slate-400 font-bold">
                                担当講座が見つかりません。
                            </div>
                        ) : (
                            events.map(event => (
                                <button
                                    key={event.id}
                                    onClick={() => setSelectedEventId(event.id)}
                                    className={`w-full text-left p-6 rounded-[2rem] border transition-all ${selectedEventId === event.id
                                            ? 'bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-900/10'
                                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                        }`}
                                >
                                    <span className={`text-[10px] font-black uppercase tracking-widest mb-2 block ${selectedEventId === event.id ? 'text-blue-400' : 'text-slate-400'}`}>
                                        {event.event_type === 'webinar' ? 'WEBセミナー' : 'リアルセミナー'}
                                    </span>
                                    <h3 className="font-black leading-snug line-clamp-2">{event.title}</h3>
                                    <div className={`flex items-center gap-2 mt-4 text-[10px] font-bold ${selectedEventId === event.id ? 'text-white/60' : 'text-slate-400'}`}>
                                        <Calendar size={12} /> {new Date(event.start_at).toLocaleDateString()}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>

                    {/* Participant List View */}
                    <div className="lg:col-span-2">
                        {selectedEventId ? (
                            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm p-8 md:p-12 h-full">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 border-b border-slate-100 pb-10">
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-900 mb-2">{activeEvent?.title}</h2>
                                        <p className="text-slate-500 font-bold flex items-center gap-2">
                                            <Users size={18} className="text-blue-600" />参加者リスト ({participants.length}名)
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="px-6 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-200 transition-all flex items-center gap-2">
                                            CSV出力 <ChevronRight size={14} />
                                        </button>
                                    </div>
                                </div>

                                {isLoadingParticipants ? (
                                    <div className="py-20 flex justify-center">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                                    </div>
                                ) : participants.length === 0 ? (
                                    <div className="py-20 text-center">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                            <Users size={32} />
                                        </div>
                                        <p className="text-slate-400 font-bold">まだ参加申し込みはありません。</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {participants.map((app) => (
                                            <div key={app.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-white hover:shadow-lg hover:border-blue-100 transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-14 h-14 rounded-full border-2 border-white shadow-sm overflow-hidden bg-slate-200">
                                                        <img src={app.user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${app.user?.full_name}`} alt="" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-slate-900">{app.user?.full_name || '名前なし'}</h4>
                                                        <p className="text-xs font-bold text-slate-400 mt-0.5">{app.user?.school_name || app.user?.university || '所属情報なし'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    {app.status === 'applied' ? (
                                                        <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full">
                                                            <CheckCircle2 size={12} /> 参加
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-700 text-[10px] font-black rounded-full">
                                                            <XCircle size={12} /> キャンセル済み
                                                        </span>
                                                    )}
                                                    <div className="text-[10px] font-bold text-slate-300">
                                                        {new Date(app.created_at).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-white rounded-[3rem] border border-slate-200 border-dashed p-20 text-center flex flex-col items-center justify-center h-full">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-200">
                                    <Calendar size={40} />
                                </div>
                                <h3 className="text-xl font-black text-slate-300">講座を選択して参加者を確認</h3>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
