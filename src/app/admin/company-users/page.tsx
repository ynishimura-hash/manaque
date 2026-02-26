"use client";

import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import {
    Users, Shield, Building2, User, Loader2,
    Search, Mail, Trash2, CheckSquare, Square, MoreVertical,
    Eye, KeyRound, Link as LinkIcon, Unlink, PlusCircle, Edit, Save, X,
    Briefcase
} from 'lucide-react';
import { differenceInYears } from 'date-fns';

// ユーザーの型定義
type Profile = {
    id: string;
    email: string;
    full_name: string;
    user_type: 'student' | 'company' | 'specialist' | 'admin' | 'instructor' | 'partner';
    avatar_url: string | null;
    created_at: string;
    dob: string | null;
    occupation_status: 'student' | 'worker' | null;
    company_name?: string;
    department?: string;
    position?: string;
    phone?: string;
};

// 企業情報の型定義
type Organization = {
    id: string;
    name: string;
    user_id: string | null; // 紐付いているユーザーID
    logo_url?: string;
};

export default function AdminCompanyUsersPage() {
    const supabase = createClient();
    const [users, setUsers] = useState<Profile[]>([]);
    const [rawUsers, setRawUsers] = useState<Profile[]>([]);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    // フィルタ・検索
    const [filter, setFilter] = useState<'all' | 'linked' | 'unlinked'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'name_asc' | 'name_desc'>('newest');
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

    // 詳細・編集用
    const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editFormData, setEditFormData] = useState<Partial<Profile>>({});
    const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
    const [menuDirection, setMenuDirection] = useState<'down' | 'up'>('down');

    // 紐付けモーダル用
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [targetUser, setTargetUser] = useState<Profile | null>(null);
    const [selectedOrgId, setSelectedOrgId] = useState<string>('');

    // 詳細表示モーダル用
    const [showDetailModal, setShowDetailModal] = useState(false);

    // 初期データ取得
    const fetchData = async () => {
        setLoading(true);
        try {
            // 企業ユーザーのみ取得
            const usersRes = await fetch('/api/admin/users?filter=company');
            const usersData = await usersRes.json();

            // 全企業情報取得
            const orgsRes = await fetch('/api/admin/companies?limit=1000'); // 全件取得想定
            const orgsData = await orgsRes.json();

            if (usersData.users) setRawUsers(usersData.users);
            if (orgsData.companies) setOrganizations(orgsData.companies);

        } catch (error) {
            console.error('Failed to fetch data:', error);
            toast.error('データの取得に失敗しました');
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    // フィルタリングとソート
    useEffect(() => {
        let result = [...rawUsers];

        // 検索
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(u =>
                (u.full_name?.toLowerCase() || '').includes(query) ||
                (u.email?.toLowerCase() || '').includes(query) ||
                (u.company_name?.toLowerCase() || '').includes(query)
            );
        }

        // 紐付け状態でのフィルタ
        if (filter === 'linked') {
            result = result.filter(u => organizations.some(o => o.user_id === u.id));
        } else if (filter === 'unlinked') {
            result = result.filter(u => !organizations.some(o => o.user_id === u.id));
        }

        // ソート
        result.sort((a, b) => {
            if (sortOrder === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            if (sortOrder === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            if (sortOrder === 'name_asc') return (a.full_name || '').localeCompare(b.full_name || '');
            if (sortOrder === 'name_desc') return (b.full_name || '').localeCompare(a.full_name || '');
            return 0;
        });

        setUsers(result);
    }, [rawUsers, organizations, searchQuery, filter, sortOrder]);

    // ユーザーに紐付く企業情報を取得
    const getLinkedOrg = (userId: string) => {
        return organizations.find(o => o.user_id === userId);
    };

    // 紐付け処理
    const handleLinkOrg = async () => {
        if (!targetUser || !selectedOrgId) return;

        try {
            const { error } = await supabase
                .from('organizations')
                .update({ user_id: targetUser.id })
                .eq('id', selectedOrgId);

            if (error) throw error;

            toast.success('企業情報を紐付けました');
            fetchData(); // リフレッシュ
            setShowLinkModal(false);
            setTargetUser(null);
            setSelectedOrgId('');
        } catch (error) {
            console.error(error);
            toast.error('紐付けに失敗しました');
        }
    };

    // 紐付け解除処理
    const handleUnlinkOrg = async (orgId: string) => {
        if (!confirm('紐付けを解除しますか？')) return;

        try {
            const { error } = await supabase
                .from('organizations')
                .update({ user_id: null })
                .eq('id', orgId);

            if (error) throw error;

            toast.success('紐付けを解除しました');
            fetchData(); // リフレッシュ
        } catch (error) {
            console.error(error);
            toast.error('解除に失敗しました');
        }
    };

    // プロフィール更新処理
    const handleUpdateProfile = async () => {
        if (!selectedUser) return;
        setProcessingId(selectedUser.id);
        try {
            // API経由で更新
            const res = await fetch('/api/admin/users/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update_profile',
                    userIds: [selectedUser.id],
                    value: editFormData
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success('プロフィールを更新しました');
                // ローカルステート更新
                const updatedUsers = rawUsers.map(u => u.id === selectedUser.id ? { ...u, ...editFormData } : u);
                setRawUsers(updatedUsers as Profile[]);
                setSelectedUser({ ...selectedUser, ...editFormData } as Profile);
                setIsEditing(false);
            } else {
                toast.error(data.error || '更新に失敗しました');
            }
        } catch (error) {
            console.error(error);
            toast.error('更新に失敗しました');
        }
        setProcessingId(null);
    };

    // ユーザー削除処理
    const handleDeleteUser = async (userId: string) => {
        if (!confirm('このユーザーアカウントを完全に削除します。企業情報との紐付けも解除されます。\n本当によろしいですか？')) return;

        setProcessingId(userId);
        try {
            const res = await fetch('/api/admin/users/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'delete',
                    userIds: [userId]
                })
            });
            const data = await res.json();

            if (data.success) {
                toast.success('ユーザーを削除しました');
                fetchData(); // リフレッシュ
                if (selectedUser?.id === userId) {
                    setShowDetailModal(false);
                    setSelectedUser(null);
                }
            } else {
                toast.error(data.error || '削除に失敗しました');
            }
        } catch (error) {
            console.error(error);
            toast.error('削除でエラーが発生しました');
        }
        setProcessingId(null);
    };

    // アクションメニュー外クリック検知
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (openActionMenuId && !(event.target as Element).closest('.action-menu-container')) {
                setOpenActionMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openActionMenuId]);

    // 全選択・解除
    const handleSelectAll = () => {
        if (selectedUserIds.size === users.length && users.length > 0) {
            setSelectedUserIds(new Set());
        } else {
            setSelectedUserIds(new Set(users.map(u => u.id)));
        }
    };

    const toggleSelectUser = (id: string) => {
        const newSet = new Set(selectedUserIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedUserIds(newSet);
    };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                    <Building2 className="text-blue-600" />
                    企業アカウント管理
                </h1>
                <p className="text-slate-500 font-bold mt-1">
                    企業アカウントと企業情報の紐付け状況を確認・編集します。
                </p>
            </div>

            {/* コントロールバー */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 mb-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="企業名、担当者名、メールで検索"
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        {[
                            { id: 'all', label: 'すべて' },
                            { id: 'linked', label: '紐付け済み' },
                            { id: 'unlinked', label: '未設定' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setFilter(tab.id as any)}
                                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${filter === tab.id
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value as any)}
                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                        <option value="newest">新しい順</option>
                        <option value="oldest">古い順</option>
                        <option value="name_asc">名前順(昇順)</option>
                        <option value="name_desc">名前順(降順)</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="animate-spin text-slate-400" />
                </div>
            ) : users.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
                    <Building2 className="mx-auto text-slate-300 mb-4" size={48} />
                    <p className="text-slate-500 font-bold">
                        該当する企業アカウントが見つかりません。
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 w-10">
                                    <button onClick={handleSelectAll} className="flex items-center justify-center text-slate-400 hover:text-slate-600">
                                        {users.length > 0 && selectedUserIds.size === users.length ? (
                                            <CheckSquare size={20} className="text-blue-600" />
                                        ) : (
                                            <Square size={20} />
                                        )}
                                    </button>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">企業名 / 担当者</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">紐付け状況</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">登録日</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">アクション</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {users.map((user) => {
                                const linkedOrg = getLinkedOrg(user.id);
                                return (
                                    <tr key={user.id} className={`hover:bg-slate-50 transition-colors ${selectedUserIds.has(user.id) ? 'bg-blue-50/50' : ''}`}>
                                        <td className="px-6 py-4">
                                            <button onClick={() => toggleSelectUser(user.id)} className="flex items-center justify-center text-slate-400 hover:text-slate-600">
                                                {selectedUserIds.has(user.id) ? (
                                                    <CheckSquare size={20} className="text-blue-600" />
                                                ) : (
                                                    <Square size={20} />
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                                                    {user.avatar_url ? (
                                                        <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User className="text-slate-400" size={20} />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-800 text-base">
                                                        {linkedOrg?.name || user.company_name || '企業名未設定'}
                                                    </div>
                                                    <div className="text-sm text-slate-500 mt-0.5 flex items-center gap-1">
                                                        <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">担当</span>
                                                        {user.full_name || '未設定'}
                                                    </div>
                                                    <div className="text-xs text-slate-400 mt-0.5">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {linkedOrg ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full whitespace-nowrap">
                                                        紐付け済み
                                                    </span>
                                                    <div className="text-sm font-bold text-slate-700 truncate max-w-[200px]" title={linkedOrg.name}>
                                                        {linkedOrg.name}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                                                    未設定
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500 font-medium whitespace-nowrap">
                                            {new Date(user.created_at).toLocaleDateString('ja-JP')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="relative group action-menu-container">
                                                <button
                                                    onClick={(e) => {
                                                        const isBottom = e.clientY > window.innerHeight / 2;
                                                        setMenuDirection(isBottom ? 'up' : 'down');
                                                        setOpenActionMenuId(openActionMenuId === user.id ? null : user.id);
                                                    }}
                                                    className={`p-2 rounded-lg transition-colors ${openActionMenuId === user.id ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:bg-slate-200 hover:text-slate-600'}`}
                                                >
                                                    <MoreVertical size={18} />
                                                </button>

                                                {openActionMenuId === user.id && (
                                                    <div className={`absolute right-0 ${menuDirection === 'up' ? 'bottom-full mb-1' : 'top-full mt-1'} w-56 bg-white rounded-xl shadow-xl border border-slate-100 p-1 z-50 animate-in fade-in zoom-in-95 duration-100`}>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedUser(user);
                                                                setEditFormData(user);
                                                                setIsEditing(false);
                                                                setShowDetailModal(true);
                                                                setOpenActionMenuId(null);
                                                            }}
                                                            className="w-full text-left px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-lg flex items-center gap-2"
                                                        >
                                                            <Eye size={14} /> 詳細を見る
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedUser(user);
                                                                setEditFormData(user);
                                                                setIsEditing(true);
                                                                setShowDetailModal(true);
                                                                setOpenActionMenuId(null);
                                                            }}
                                                            className="w-full text-left px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-lg flex items-center gap-2"
                                                        >
                                                            <Edit size={14} /> 編集
                                                        </button>

                                                        <div className="h-[1px] bg-slate-100 my-1"></div>

                                                        {linkedOrg ? (
                                                            <>
                                                                <button
                                                                    onClick={() => {
                                                                        window.open(`/companies/${linkedOrg.id}`, '_blank');
                                                                        setOpenActionMenuId(null);
                                                                    }}
                                                                    className="w-full text-left px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-lg flex items-center gap-2"
                                                                >
                                                                    <Building2 size={14} /> 企業情報を見る
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        handleUnlinkOrg(linkedOrg.id);
                                                                        setOpenActionMenuId(null);
                                                                    }}
                                                                    className="w-full text-left px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
                                                                >
                                                                    <Unlink size={14} /> 紐付けを解除
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    onClick={() => {
                                                                        setTargetUser(user);
                                                                        setSelectedOrgId('');
                                                                        setShowLinkModal(true);
                                                                        setOpenActionMenuId(null);
                                                                    }}
                                                                    className="w-full text-left px-3 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-2"
                                                                >
                                                                    <LinkIcon size={14} /> 企業情報を紐付ける
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        window.location.href = `/admin/management?tab=company_infos&open_create=true&link_user_id=${user.id}`;
                                                                    }}
                                                                    className="w-full text-left px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-lg flex items-center gap-2"
                                                                >
                                                                    <PlusCircle size={14} /> 企業情報を新規作成
                                                                </button>
                                                            </>
                                                        )}

                                                        <div className="h-[1px] bg-slate-100 my-1"></div>

                                                        <button
                                                            onClick={() => {
                                                                handleDeleteUser(user.id);
                                                                setOpenActionMenuId(null);
                                                            }}
                                                            className="w-full text-left px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
                                                        >
                                                            <Trash2 size={14} /> アカウント削除
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* 紐付けモーダル */}
            {showLinkModal && targetUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200">
                        <h2 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2">
                            <LinkIcon className="text-blue-600" />
                            企業情報の紐付け
                        </h2>
                        <p className="text-sm text-slate-500 mb-6">
                            ユーザー <strong>{targetUser.full_name} ({targetUser.email})</strong> に紐付ける企業情報を選択してください。
                        </p>

                        <div className="mb-6">
                            <label className="block text-sm font-bold text-slate-600 mb-2">
                                未紐付けの企業一覧
                            </label>
                            <select
                                value={selectedOrgId}
                                onChange={(e) => setSelectedOrgId(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            >
                                <option value="">選択してください...</option>
                                {organizations
                                    .filter(o => o.user_id === null) // 未紐付けのみ
                                    .map(org => (
                                        <option key={org.id} value={org.id}>
                                            {org.name}
                                        </option>
                                    ))}
                            </select>
                            {organizations.filter(o => o.user_id === null).length === 0 && (
                                <p className="text-xs text-red-500 mt-2 font-bold">
                                    ※ 未紐付けの企業情報がありません。「データ管理」から作成してください。
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowLinkModal(false)}
                                className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={handleLinkOrg}
                                disabled={!selectedOrgId}
                                className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                紐付ける
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 詳細・編集モーダル */}
            {showDetailModal && selectedUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="sticky top-0 bg-white border-b border-slate-100 p-4 flex items-center justify-between z-10">
                            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                {isEditing ? <Edit className="text-blue-600" /> : <Building2 className="text-blue-600" />}
                                {isEditing ? '企業アカウント編集' : '企業アカウント詳細'}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowDetailModal(false);
                                    setIsEditing(false);
                                }}
                                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="flex items-start gap-6 mb-8">
                                <div className="w-24 h-24 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center shrink-0 border-4 border-white shadow-lg">
                                    {selectedUser.avatar_url ? (
                                        <img src={selectedUser.avatar_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="text-slate-300" size={40} />
                                    )}
                                </div>
                                <div className="flex-1">
                                    {isEditing ? (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-1">
                                                    企業名
                                                </label>
                                                {(() => {
                                                    const linkedOrg = getLinkedOrg(selectedUser.id);
                                                    if (linkedOrg) {
                                                        return (
                                                            <div>
                                                                <input
                                                                    type="text"
                                                                    value={linkedOrg.name}
                                                                    disabled
                                                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg font-bold text-slate-500 bg-slate-100 cursor-not-allowed"
                                                                />
                                                                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1 font-bold">
                                                                    <Building2 size={12} />
                                                                    企業情報と紐付いているため、ここでは変更できません。
                                                                </p>
                                                                <button
                                                                    onClick={() => window.open(`/admin/management?tab=company_infos&edit_id=${linkedOrg.id}`, '_blank')}
                                                                    className="text-xs text-blue-600 font-bold hover:underline mt-1 block"
                                                                >
                                                                    企業情報を編集する &rarr;
                                                                </button>
                                                            </div>
                                                        );
                                                    } else {
                                                        return (
                                                            <input
                                                                type="text"
                                                                value={editFormData.company_name || ''}
                                                                onChange={(e) => setEditFormData({ ...editFormData, company_name: e.target.value })}
                                                                className="w-full px-4 py-2 border border-slate-200 rounded-lg font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                                                placeholder="株式会社〇〇"
                                                            />
                                                        );
                                                    }
                                                })()}
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-1">
                                                    担当者名
                                                </label>
                                                <input
                                                    type="text"
                                                    value={editFormData.full_name || ''}
                                                    onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                                    placeholder="担当者名"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-1">
                                                    メールアドレス（ログインID）
                                                </label>
                                                <input
                                                    type="email"
                                                    value={editFormData.email || ''}
                                                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                                />
                                                <p className="text-xs text-slate-400 mt-1">※変更するとログインIDが変わります。本人への通知が必要です。</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-800 mb-1">
                                                {selectedUser.company_name || getLinkedOrg(selectedUser.id)?.name || '企業名未設定'}
                                            </h3>
                                            <div className="flex items-center gap-2 text-slate-600 font-bold mb-2">
                                                <User size={16} />
                                                <span>担当: {selectedUser.full_name || '未設定'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-500 font-bold">
                                                <Mail size={14} />
                                                {selectedUser.email}
                                            </div>
                                            <div className="mt-4 flex flex-wrap gap-2">
                                                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                                                    企業アカウント
                                                </span>
                                                <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">
                                                    登録日: {new Date(selectedUser.created_at).toLocaleDateString('ja-JP')}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                                <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                                    <LinkIcon size={18} className="text-slate-400" />
                                    紐付け企業情報
                                </h4>

                                {(() => {
                                    const linkedOrg = getLinkedOrg(selectedUser.id);
                                    if (linkedOrg) {
                                        return (
                                            <div className="bg-white p-4 rounded-lg border border-slate-200 flex items-center justify-between">
                                                <div>
                                                    <div className="text-sm text-slate-500 font-bold mb-1">企業名</div>
                                                    <div className="text-lg font-black text-slate-800">{linkedOrg.name}</div>
                                                </div>
                                                <button
                                                    onClick={() => window.open(`/companies/${linkedOrg.id}`, '_blank')}
                                                    className="px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                >
                                                    ページを確認
                                                </button>
                                            </div>
                                        );
                                    } else {
                                        return (
                                            <div className="bg-white p-6 rounded-lg border border-slate-200 border-dashed text-center">
                                                <p className="text-slate-500 font-bold mb-3">企業情報が紐付いていません</p>
                                                <div className="flex flex-col gap-3 justify-center sm:flex-row">
                                                    <button
                                                        onClick={() => {
                                                            setShowDetailModal(false);
                                                            setTargetUser(selectedUser);
                                                            setSelectedOrgId('');
                                                            setShowLinkModal(true);
                                                        }}
                                                        className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center justify-center gap-2"
                                                    >
                                                        <LinkIcon size={16} />
                                                        既存の企業を紐付ける
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            window.location.href = `/admin/management?tab=company_infos&open_create=true&link_user_id=${selectedUser.id}`;
                                                        }}
                                                        className="px-4 py-2 bg-white border border-slate-300 text-slate-600 font-bold rounded-lg hover:bg-slate-50 transition-colors text-sm flex items-center justify-center gap-2"
                                                    >
                                                        <PlusCircle size={16} />
                                                        企業情報を新規作成
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    }
                                })()}
                            </div>
                        </div>

                        <div className="sticky bottom-0 bg-slate-50 p-4 border-t border-slate-200 flex justify-end gap-3 rounded-b-2xl">
                            {isEditing ? (
                                <>
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-lg transition-colors"
                                    >
                                        キャンセル
                                    </button>
                                    <button
                                        onClick={handleUpdateProfile}
                                        disabled={!!processingId}
                                        className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {processingId ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                                        保存する
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => handleDeleteUser(selectedUser.id)}
                                        className="px-4 py-2 text-red-600 font-bold hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 mr-auto"
                                    >
                                        <Trash2 size={16} /> アカウント削除
                                    </button>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                    >
                                        <Edit size={16} /> 編集する
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
