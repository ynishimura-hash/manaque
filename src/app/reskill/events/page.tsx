"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Video, Users, ChevronRight, BookOpen, Clock, Filter, Search } from 'lucide-react';
import Link from 'next/link';

export default function EventListPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        const fetchEvents = async () => {
            const res = await fetch(`/api/reskill/events${filter !== 'all' ? `?type=${filter}` : ''}`);
            const data = await res.json();
            setEvents(data);
            setIsLoading(false);
        };
        fetchEvents();
    }, [filter]);

    const formatDateTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return {
            date: date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', weekday: 'short' }),
            time: date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
        };
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/reskill" className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-100">
                            <BookOpen size={24} />
                        </Link>
                        <h1 className="text-xl font-black tracking-tighter text-slate-900">Reskill University / イベント</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-12">
                {/* Title & Filters */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-2">イベント・セミナー</h2>
                        <p className="text-slate-500 font-bold">専門家から直接学べる、リアルタイムの学習体験。</p>
                    </div>

                    <div className="flex gap-2 bg-slate-200/50 p-1.5 rounded-2xl overflow-x-auto hide-scrollbar">
                        {[
                            { id: 'all', label: 'すべて', icon: <Filter size={16} /> },
                            { id: 'webinar', label: 'ウェビナー', icon: <Video size={16} /> },
                            { id: 'real', label: 'リアルセミナー', icon: <MapPin size={16} /> },
                            { id: 'event', label: 'その他イベント', icon: <Users size={16} /> }
                        ].map(t => (
                            <button
                                key={t.id}
                                onClick={() => setFilter(t.id)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs transition-all whitespace-nowrap ${filter === t.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                            >
                                {t.icon} {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : !Array.isArray(events) || events.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-[2.5rem] border border-slate-200 border-dashed">
                        <p className="text-slate-400 font-bold">該当するイベントが見つかりませんでした。</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {events.map((event) => {
                            const { date, time } = formatDateTime(event.start_at);
                            return (
                                <Link
                                    key={event.id}
                                    href={`/reskill/events/${event.id}`}
                                    className="group bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden hover:shadow-2xl transition-all h-full flex flex-col"
                                >
                                    <div className="aspect-video relative overflow-hidden">
                                        <img src={event.image_url || '/illustrations/dx_roadmap.png'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="" />
                                        <div className="absolute top-4 left-4">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black text-white shadow-lg backdrop-blur-md ${event.event_type === 'webinar' ? 'bg-blue-600/80' :
                                                event.event_type === 'real' ? 'bg-orange-600/80' : 'bg-slate-800/80'
                                                }`}>
                                                {event.event_type === 'webinar' ? 'WEBセミナー' :
                                                    event.event_type === 'real' ? 'リアルセミナー' : 'イベント'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-8 flex-1 flex flex-col">
                                        <div className="flex items-center gap-4 text-slate-400 font-black text-[10px] mb-4">
                                            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                                <Calendar size={14} className="text-blue-500" /> {date}
                                            </div>
                                            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                                <Clock size={14} className="text-blue-500" /> {time}〜
                                            </div>
                                        </div>

                                        <h3 className="text-xl font-black text-slate-800 mb-4 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                            {event.title}
                                        </h3>

                                        <div className="mt-auto space-y-4">
                                            {event.instructor && (
                                                <div className="flex items-center gap-3 border-t border-slate-50 pt-4">
                                                    <img src={event.instructor.profile_image || '/eis_logo_mark.png'} className="w-10 h-10 rounded-full border border-slate-200 object-cover" alt="" />
                                                    <div>
                                                        <p className="text-xs font-black text-slate-800 leading-none">{event.instructor.display_name}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 mt-1">{event.instructor.specialization}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
