"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Calendar, MapPin, Video, Users, ChevronLeft, BookOpen, Clock, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function EventDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [event, setEvent] = useState<any>(null);
    const [application, setApplication] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<'apply' | 'cancel'>('apply');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [eventRes, appRes] = await Promise.all([
                    fetch(`/api/reskill/events/${id}`),
                    fetch(`/api/reskill/applications?event_id=${id}`)
                ]);

                const eventData = await eventRes.json();
                const appData = await appRes.json();

                setEvent(eventData);
                // The applications API returns an array, find the user's one if it exists
                // In a real scenario, RLS would ensure this is only the current user's or all for admin
                // Here we just grab the first one assuming RLS is active
                setApplication(Array.isArray(appData) && appData.length > 0 ? appData[0] : null);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleAction = async () => {
        setIsActionLoading(true);
        try {
            if (modalMode === 'apply') {
                const res = await fetch('/api/reskill/applications', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ event_id: id })
                });
                const data = await res.json();
                setApplication(data);
            } else {
                const res = await fetch('/api/reskill/applications', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ event_id: id, status: 'cancelled' })
                });
                const data = await res.json();
                setApplication(data);
            }
            setShowModal(false);
        } catch (err) {
            console.error(err);
        } finally {
            setIsActionLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!event) return <div>Event not found</div>;

    const isApplied = application && application.status === 'applied';
    const isCancelled = application && application.status === 'cancelled';

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/reskill/events" className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-100">
                            <ChevronLeft size={24} />
                        </Link>
                        <h1 className="text-xl font-black tracking-tighter text-slate-900">イベント詳細</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-12">
                <div className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-sm">
                    {/* Hero Image */}
                    <div className="aspect-video relative">
                        <img src={event.image_url || '/illustrations/dx_roadmap.png'} className="w-full h-full object-cover" alt="" />
                        <div className="absolute top-6 left-6">
                            <span className={`px-6 py-2 rounded-full font-black text-white shadow-xl backdrop-blur-md ${event.event_type === 'webinar' ? 'bg-blue-600/90' :
                                event.event_type === 'real' ? 'bg-orange-600/90' : 'bg-slate-800/90'
                                }`}>
                                {event.event_type === 'webinar' ? 'WEBセミナー' :
                                    event.event_type === 'real' ? 'リアルセミナー' : 'イベント'}
                            </span>
                        </div>
                    </div>

                    <div className="p-8 md:p-12">
                        {/* Title & Stats */}
                        <div className="mb-10">
                            <h2 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight mb-6">
                                {event.title}
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                                        <Calendar size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase">開催日程</p>
                                        <p className="text-sm font-black text-slate-800">
                                            {new Date(event.start_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                                        <Clock size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase">開催時間</p>
                                        <p className="text-sm font-black text-slate-800">
                                            {new Date(event.start_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })} 〜
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Location/URL Section */}
                        <div className="mb-12 p-6 bg-slate-900 rounded-[2rem] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
                                    {event.event_type === 'webinar' ? <Video size={28} /> : <MapPin size={28} />}
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">
                                        {event.event_type === 'webinar' ? '視聴方法' : '開催場所'}
                                    </p>
                                    <p className="text-lg font-black">{event.event_type === 'webinar' ? 'オンライン配信' : event.location || '愛媛県内会場'}</p>
                                </div>
                            </div>
                            {event.event_type === 'webinar' && isApplied && (
                                <a href={event.web_url} target="_blank" className="px-8 py-3 bg-blue-500 hover:bg-blue-400 text-white font-black rounded-xl transition-all flex items-center gap-2">
                                    視聴URLを開く <ArrowRight size={18} />
                                </a>
                            )}
                        </div>

                        {/* Description */}
                        <div className="prose max-w-none mb-12">
                            <h4 className="text-lg font-black text-slate-800 mb-4 border-l-4 border-blue-600 pl-4">概要</h4>
                            <p className="text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">
                                {event.description}
                            </p>
                        </div>

                        {/* Instructor Profile */}
                        {event.instructor && (
                            <div className="bg-slate-50 rounded-[2.5rem] p-8 md:p-10 border border-slate-100 mb-12 flex flex-col md:flex-row items-center gap-8">
                                <div className="w-32 h-32 md:w-40 md:h-40 shrink-0 rounded-[2rem] border-4 border-white shadow-xl overflow-hidden">
                                    <img src={event.instructor.profile_image || '/eis_logo_mark.png'} className="w-full h-full object-cover" alt="" />
                                </div>
                                <div className="text-center md:text-left">
                                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-100 px-3 py-1 rounded-full mb-3 inline-block">
                                        Instructor
                                    </span>
                                    <h3 className="text-2xl font-black text-slate-900 mb-2">{event.instructor.display_name}</h3>
                                    <p className="text-sm font-bold text-slate-400 mb-4">{event.instructor.specialization}</p>
                                    <p className="text-slate-500 text-sm font-medium leading-relaxed line-clamp-3">
                                        {event.instructor.bio}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Action Area */}
                        <div className="flex flex-col items-center gap-4 pt-8 border-t border-slate-100">
                            {isApplied ? (
                                <div className="w-full text-center">
                                    <div className="bg-emerald-50 text-emerald-700 px-6 py-4 rounded-2xl flex items-center justify-center gap-3 font-black mb-4 border border-emerald-100">
                                        <CheckCircle2 size={24} /> 申し込み済みです
                                    </div>
                                    <button
                                        onClick={() => { setModalMode('cancel'); setShowModal(true); }}
                                        className="text-slate-400 hover:text-rose-500 font-bold text-sm transition-colors py-2 px-4"
                                    >
                                        申し込みをキャンセルする
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => { setModalMode('apply'); setShowModal(true); }}
                                    className="w-full max-w-md bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-[2rem] shadow-xl shadow-blue-600/20 transition-all active:scale-95 flex items-center justify-center gap-3 text-lg"
                                >
                                    参加を申し込む <Play size={20} fill="currentColor" />
                                </button>
                            )}
                            <p className="text-[10px] font-bold text-slate-400 text-center max-w-sm">
                                キャンセルは開催前日まで可能です。<br />
                                当日のキャンセルは公式LINEよりご連絡下さい。
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Confirmation Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
                    <div className="bg-white rounded-[3rem] p-8 md:p-12 max-w-sm w-full relative z-10 shadow-2xl scale-100 animate-in fade-in zoom-in duration-200">
                        <div className="text-center mb-8">
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${modalMode === 'apply' ? 'bg-blue-100 text-blue-600' : 'bg-rose-100 text-rose-600'
                                }`}>
                                {modalMode === 'apply' ? <BookOpen size={40} /> : <AlertCircle size={40} />}
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-2">
                                {modalMode === 'apply' ? '申し込みますか？' : 'キャンセルしますか？'}
                            </h3>
                            <p className="text-slate-500 font-bold text-sm">
                                {modalMode === 'apply'
                                    ? 'この講座への参加を申し込みます。よろしいですか？'
                                    : '参加予約を取り消します。よろしいですか？'}
                            </p>
                        </div>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleAction}
                                disabled={isActionLoading}
                                className={`w-full py-4 rounded-2xl font-black shadow-lg transition-all active:scale-95 flex items-center justify-center ${modalMode === 'apply'
                                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'
                                    : 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-200'
                                    }`}
                            >
                                {isActionLoading ? '処理中...' : modalMode === 'apply' ? 'はい、申し込みます' : 'はい、キャンセルします'}
                            </button>
                            <button
                                onClick={() => setShowModal(false)}
                                disabled={isActionLoading}
                                className="w-full py-4 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all"
                            >
                                いいえ、戻ります
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Minimal Play icon since lucide-react was used in code but might need manual definition or import
function Play({ size, fill, className }: any) {
    return (
        <svg
            width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}
        >
            <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
    );
}

