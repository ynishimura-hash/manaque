'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/appStore';
import { Calendar, Users, ChevronRight, CheckCircle2, XCircle, Search, Filter, ArrowUpRight, Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import EventFormModal from '@/components/admin/reskill/EventFormModal';

export default function AdminEventsPage() {
    const { activeRole } = useAppStore();
    const [events, setEvents] = useState<any[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [participants, setParticipants] = useState<any[]>([]);
    const [isLoadingEvents, setIsLoadingEvents] = useState(true);
    const [isLoadingParticipants, setIsLoadingParticipants] = useState(false);
    const [showMobileDetail, setShowMobileDetail] = useState(false); // Mobile state

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<any | null>(null);
    const [isParticipantModalOpen, setIsParticipantModalOpen] = useState(false);

    // Filter & Sort State
    const [filterType, setFilterType] = useState<string>('all');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const [refreshKey, setRefreshKey] = useState(0);

    // CRUD Handlers
    const handleCreate = () => {
        setEditingEvent(null);
        setIsModalOpen(true);
    };

    const handleEdit = () => {
        const event = events.find(e => e.id === selectedEventId);
        if (!event) return;
        setEditingEvent(event);
        setIsModalOpen(true);
    };

    const handleDelete = async () => {
        const event = events.find(e => e.id === selectedEventId);
        if (!event) return;
        if (!confirm('本当にこのイベントを削除しますか？\n登録済みの参加者データも全て削除されます。')) return;

        try {
            const res = await fetch(`/api/reskill/events/${event.id}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Delete failed');

            toast.success('イベントを削除しました');
            setSelectedEventId(null);
            setRefreshKey(prev => prev + 1);
        } catch (error) {
            console.error(error);
            toast.error('削除に失敗しました');
        }
    };

    const handleFormSuccess = () => {
        setRefreshKey(prev => prev + 1);
    };

    const toggleAttendance = async (applicationId: string, currentStatus: boolean) => {
        // Optimistic update
        setParticipants(prev => prev.map(p =>
            p.id === applicationId ? { ...p, attended: !currentStatus } : p
        ));

        try {
            const res = await fetch('/api/reskill/applications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: applicationId, // Send ID for Admin update
                    event_id: selectedEventId,
                    // We need to send status as well because the API updates it. 
                    // Ideally API should handle partial updates better, but current implementation expects status.
                    // Actually, looking at API, it updates both. We should send current status or just attended?
                    // The API code I wrote: .update({ status: body.status, attended: body.attended ... })
                    // If I send undefined status, it might wipe it? 
                    // Let's send the current status.
                    status: participants.find(p => p.id === applicationId)?.status,
                    attended: !currentStatus
                })
            });

            if (!res.ok) {
                const text = await res.text();
                try {
                    const errorData = JSON.parse(text);
                    throw new Error(errorData.error || 'Update failed');
                } catch (e) {
                    console.error('API Error Response:', text);
                    throw new Error(`Server returned ${res.status} ${res.statusText}. Check console for details.`);
                }
            }
            toast.success('出欠状況を更新しました');
        } catch (error: any) {
            console.error('Attendance update error:', error);
            toast.error(error.message);
            // Revert
            setParticipants(prev => prev.map(p =>
                p.id === applicationId ? { ...p, attended: currentStatus } : p
            ));
        }
    };

    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        const fetchEvents = async () => {
            setIsLoadingEvents(true);
            try {
                const params = new URLSearchParams();
                if (filterType !== 'all') params.append('type', filterType);
                if (startDate) params.append('from', startDate);
                if (endDate) params.append('to', endDate);
                params.append('sort', sortOrder);

                const res = await fetch(`/api/reskill/events?${params.toString()}`, { signal });
                if (!res.ok) throw new Error('Failed to fetch events');

                const data = await res.json();
                if (!signal.aborted) {
                    setEvents(data);
                    // Only set default selection if nothing selected or list was empty
                    // On mobile, we DON'T want to auto-select, or if we do, we don't want to auto-show detail.
                    // But for desktop we do.
                    // Let's keep auto-select but `showMobileDetail` defaults to false.
                    if (data.length > 0 && !selectedEventId) setSelectedEventId(data[0].id);
                }
            } catch (err: any) {
                if (err.name !== 'AbortError') {
                    console.error(err);
                    toast.error('イベント一覧の取得に失敗しました');
                }
            } finally {
                if (!signal.aborted) {
                    setIsLoadingEvents(false);
                }
            }
        };

        fetchEvents();

        return () => {
            controller.abort();
        };
    }, [filterType, startDate, endDate, sortOrder, refreshKey]);

    // Fetch participants when event is selected
    // Fetch participants when event is selected
    useEffect(() => {
        if (!selectedEventId) return;

        const controller = new AbortController();
        const signal = controller.signal;

        const fetchParticipants = async () => {
            setIsLoadingParticipants(true);
            try {
                const res = await fetch(`/api/reskill/applications?event_id=${selectedEventId}`, { signal });
                if (!res.ok) throw new Error('Failed to fetch participants');

                const data = await res.json();
                if (!signal.aborted) {
                    setParticipants(data);
                }
            } catch (err: any) {
                if (err.name !== 'AbortError') {
                    console.error(err);
                }
            } finally {
                if (!signal.aborted) {
                    setIsLoadingParticipants(false);
                }
            }
        };
        fetchParticipants();

        return () => {
            controller.abort();
        };
    }, [selectedEventId]);

    // When event is selected, on mobile show value
    const handleEventSelect = (eventId: string) => {
        setSelectedEventId(eventId);
        setShowMobileDetail(true);
    };

    const activeEvent = events.find(e => e.id === selectedEventId);

    const renderParticipantDetailModal = () => (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-5xl h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
                {/* Modal Header */}
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-100">
                            <Users size={28} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-blue-50 text-blue-600`}>
                                    {activeEvent?.event_type === 'webinar' ? 'WEBセミナー' : 'リアルセミナー'}
                                </span>
                                <h3 className="text-xl font-black text-slate-900">{activeEvent?.title}</h3>
                            </div>
                            <p className="text-sm text-slate-500 font-bold">
                                参加者一覧詳細：全 {participants.length} 名
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsParticipantModalOpen(false)}
                        className="p-3 hover:bg-slate-100 rounded-full transition-all cursor-pointer text-slate-400 hover:text-slate-600"
                    >
                        <XCircle size={32} />
                    </button>
                </div>

                {/* Modal Content */}
                <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        {participants.map((app) => (
                            <div key={app.id} className={`bg-white p-4 rounded-2xl border transition-all hover:shadow-md flex items-center justify-between group ${app.attended ? 'border-blue-200 bg-blue-50/10' : 'border-slate-100'}`}>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={app.attended || false}
                                        onChange={() => toggleAttendance(app.id, app.attended)}
                                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    />
                                    <div className="w-10 h-10 rounded-xl border border-slate-100 shadow-sm overflow-hidden bg-slate-100 shrink-0">
                                        <img
                                            src={app.user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${app.user?.full_name || 'User'}`}
                                            alt=""
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-sm font-black text-slate-900 truncate">
                                                {app.user?.full_name || '名前なし'}
                                            </h4>
                                            {app.status === 'applied' ? (
                                                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[8px] font-black rounded-md shrink-0">
                                                    申込済
                                                </span>
                                            ) : (
                                                <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 text-[8px] font-black rounded-md shrink-0">
                                                    辞退
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-400 truncate">
                                            {app.user?.school_name || app.user?.university || '所属情報なし'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="hidden sm:flex flex-col items-end">
                                        <span className="text-[9px] font-bold text-slate-400">
                                            {new Date(app.created_at).toLocaleDateString()}
                                        </span>
                                        {app.attended && (
                                            <span className="text-[9px] font-black text-blue-600 flex items-center gap-0.5">
                                                <CheckCircle2 size={8} /> 出席
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => toggleAttendance(app.id, app.attended)}
                                        className={`px-3 py-1.5 rounded-lg font-black text-[10px] transition-all cursor-pointer shrink-0 ${app.attended
                                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                                            : 'bg-white border border-slate-200 text-slate-400 hover:border-blue-200 hover:text-blue-500'
                                            }`}
                                    >
                                        {app.attended ? '出席解除' : '出席'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    {participants.length === 0 && (
                        <div className="h-64 flex flex-col items-center justify-center text-slate-300">
                            <Users size={64} className="mb-4 opacity-20" />
                            <p className="text-lg font-bold">参加者データが存在しません</p>
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="p-8 border-t border-slate-100 bg-white shrink-0 flex items-center justify-between">
                    <p className="text-xs text-slate-400 font-bold tracking-tight">
                        ※ 出席状況の変更はリアルタイムで保存されます。
                    </p>
                    <div className="flex gap-4">
                        <button className="px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl text-sm hover:bg-slate-200 transition-all flex items-center gap-2">
                            CSVエクスポート
                        </button>
                        <button
                            onClick={() => setIsParticipantModalOpen(false)}
                            className="px-8 py-3 bg-slate-900 text-white font-bold rounded-2xl text-sm hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                        >
                            閉じる
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-auto lg:h-[calc(100vh-80px)] gap-6">
            {/* Header */}
            <div className="shrink-0 flex items-end justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Event Management</h1>
                    <p className="text-slate-500 font-bold mt-2">
                        リスキル大学のイベント・セミナーおよび参加者の管理を行います。
                    </p>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                >
                    <Plus size={20} /> 新規イベント作成
                </button>
            </div>

            {/* Horizontal Filter Bar */}
            <div className="shrink-0 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 w-full lg:w-auto">
                    <div className="flex items-center gap-2 text-slate-700 font-bold shrink-0">
                        <Filter size={20} />
                        <span className="hidden lg:inline">絞り込み:</span>
                    </div>

                    {/* Type Filter */}
                    <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
                        {['all', 'webinar', 'real'].map(type => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${filterType === type
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                {type === 'all' ? 'すべて' : type === 'webinar' ? 'WEB' : 'リアル'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row items-center gap-4 w-full lg:w-auto">
                    {/* Date Filter */}
                    <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100 w-full lg:w-auto">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-transparent text-xs font-bold text-slate-600 outline-none px-2 w-full lg:w-auto"
                        />
                        <span className="text-slate-400 text-xs font-bold">~</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-transparent text-xs font-bold text-slate-600 outline-none px-2 w-full lg:w-auto"
                        />
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-auto lg:ml-0">
                        {/* Sort Order */}
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            <button
                                onClick={() => setSortOrder('desc')}
                                className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all ${sortOrder === 'desc' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                            >
                                最新順
                            </button>
                            <button
                                onClick={() => setSortOrder('asc')}
                                className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all ${sortOrder === 'asc' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                            >
                                開催順
                            </button>
                        </div>

                        {/* Reset */}
                        <button
                            onClick={() => {
                                setFilterType('all');
                                setStartDate('');
                                setEndDate('');
                                setSortOrder('desc');
                            }}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="検索条件をリセット"
                        >
                            <XCircle size={20} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
                {/* Event Sidebar */}
                <div className={`lg:col-span-1 flex-col h-full min-h-0 ${showMobileDetail ? 'hidden lg:flex' : 'flex'}`}>

                    <div className="shrink-0 flex items-center justify-between px-2 mb-2">
                        <h2 className="text-lg font-black text-slate-800">開催イベント一覧</h2>
                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold">{events.length}件</span>
                    </div>

                    {isLoadingEvents ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-24 bg-white rounded-2xl border border-slate-200 animate-pulse"></div>
                            ))}
                        </div>
                    ) : events.length === 0 ? (
                        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 border-dashed text-slate-400 font-bold">
                            イベントが見つかりません。
                            <button onClick={handleCreate} className="mt-4 text-blue-600 underline block w-full">
                                最初のイベントを作成
                            </button>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto pr-2 space-y-3 pb-10">
                            {events.map(event => (
                                <button
                                    key={event.id}
                                    onClick={() => handleEventSelect(event.id)}
                                    className={`w-full text-left p-5 rounded-2xl border transition-all group ${selectedEventId === event.id
                                        ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-200'
                                        : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:shadow-md'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${selectedEventId === event.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                            {event.event_type === 'webinar' ? 'WEBセミナー' : 'リアルセミナー'}
                                        </span>
                                        <span className={`text-[10px] font-bold ${selectedEventId === event.id ? 'text-white/80' : 'text-slate-400'}`}>
                                            {event.capacity}名定員
                                        </span>
                                    </div>
                                    <h3 className="font-bold leading-snug line-clamp-2 mb-3">{event.title}</h3>
                                    <div className={`flex items-center justify-between text-xs font-bold ${selectedEventId === event.id ? 'text-white/90' : 'text-slate-400'}`}>
                                        <div className="flex items-center gap-1.5">
                                            <Calendar size={14} />
                                            {new Date(event.start_at).toLocaleDateString()}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Users size={14} />
                                            <span className={selectedEventId === event.id ? 'text-white' : 'text-slate-600'}>
                                                講師: {event.instructor?.display_name || '未設定'}
                                            </span>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Participant List View */}
                <div className={`lg:col-span-2 h-full min-h-0 ${showMobileDetail ? 'flex' : 'hidden lg:flex'}`}>
                    {selectedEventId ? (
                        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 h-full flex flex-col w-full">
                            {/* Mobile Back Button */}
                            <div className="lg:hidden mb-4">
                                <button
                                    onClick={() => setShowMobileDetail(false)}
                                    className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-800"
                                >
                                    <ChevronRight size={20} className="rotate-180" /> イベント一覧に戻る
                                </button>
                            </div>

                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8 border-b border-slate-100 pb-6 shrink-0">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-blue-50 text-blue-600`}>
                                            {activeEvent?.event_type === 'webinar' ? 'WEBセミナー' : 'リアルセミナー'}
                                        </span>
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${activeEvent?.status === 'published' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                            {activeEvent?.status}
                                        </span>
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-900 mb-2">{activeEvent?.title}</h2>
                                    <div className="text-slate-500 text-sm font-bold flex flex-wrap items-center gap-4 mb-4">
                                        <span className="flex items-center gap-1.5"><Users size={16} className="text-blue-500" /> 参加者: {participants.filter(p => p.status === 'applied').length}名 (キャンセル: {participants.filter(p => p.status === 'cancelled').length}名)</span>
                                    </div>

                                    <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-600 space-y-2">
                                        <p><strong>講師:</strong> {activeEvent?.instructor?.display_name || '未設定'}</p>
                                        <p><strong>日時:</strong> {new Date(activeEvent?.start_at).toLocaleString()} ~ {new Date(activeEvent?.end_at).toLocaleString()}</p>
                                        <p><strong>場所/URL:</strong> {activeEvent?.event_type === 'webinar' ? activeEvent?.web_url : activeEvent?.location}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 shrink-0">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleEdit}
                                            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-50 transition-all flex items-center gap-2"
                                        >
                                            <Edit2 size={16} /> 編集
                                        </button>
                                        <button
                                            onClick={handleDelete}
                                            className="px-4 py-2 bg-white border border-red-200 text-red-500 font-bold rounded-xl text-sm hover:bg-red-50 transition-all flex items-center gap-2"
                                        >
                                            <Trash2 size={16} /> 削除
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => setIsParticipantModalOpen(true)}
                                        className="px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-sm hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-slate-200 justify-center"
                                    >
                                        参加者詳細ビュー <Users size={16} />
                                    </button>
                                    <button className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm justify-center">
                                        CSVダウンロード <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-2">
                                {isLoadingParticipants ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
                                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                                        <span className="font-bold text-sm">参加者データを読み込み中...</span>
                                    </div>
                                ) : participants.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-10">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
                                            <Users size={32} />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-800 mb-1">参加者はまだいません</h3>
                                        <p className="text-slate-400 font-bold text-sm">申し込みがあるまでお待ちください。</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3 pb-8">
                                        {participants.map((app) => (
                                            <div key={app.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all group ${app.attended ? 'bg-blue-50/50 border-blue-200' : 'bg-slate-50 border-slate-100 hover:bg-white hover:shadow-md hover:border-blue-100'
                                                }`}>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center justify-center pr-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={app.attended || false}
                                                            onChange={() => toggleAttendance(app.id, app.attended)}
                                                            className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                        />
                                                    </div>
                                                    <div className="w-12 h-12 rounded-xl border border-white shadow-sm overflow-hidden bg-slate-200 shrink-0">
                                                        <img
                                                            src={app.user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${app.user?.full_name || 'User'}`}
                                                            alt=""
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-slate-900 flex items-center gap-2">
                                                            {app.user?.full_name || '名前なし'}
                                                            <span className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-400 font-bold">一般受講生</span>
                                                        </h4>
                                                        <p className="text-xs font-bold text-slate-400 mt-0.5 flex items-center gap-1">
                                                            {app.user?.school_name || app.user?.university || '所属情報なし'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    {app.status === 'applied' ? (
                                                        <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full">
                                                            <CheckCircle2 size={12} /> 参加予定
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-700 text-[10px] font-black rounded-full">
                                                            <XCircle size={12} /> キャンセル
                                                        </span>
                                                    )}
                                                    <div className="text-[10px] font-bold text-slate-400">
                                                        申込日: {new Date(app.created_at).toLocaleDateString()}
                                                    </div>
                                                    {app.attended && (
                                                        <div className="text-[10px] font-bold text-blue-600 flex items-center gap-1">
                                                            <CheckCircle2 size={10} /> 出席済み
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-[2.5rem] border border-slate-200 border-dashed p-10 text-center flex flex-col items-center justify-center h-full text-slate-300">
                            <Calendar size={48} className="mb-4 opacity-50" />
                            <p className="font-bold text-lg">左側のリストからイベントを選択してください</p>
                            {/* Create Button on mobile too */}
                            <button onClick={handleCreate} className="mt-4 px-6 py-2 bg-blue-50 text-blue-600 rounded-full font-bold hover:bg-blue-100 transition-colors">
                                新しいイベントを作成
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <EventFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleFormSuccess}
                event={editingEvent}
            />

            {isParticipantModalOpen && renderParticipantDetailModal()}
        </div>
    );
}
