"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Save, Plus, Trash2, ChevronDown, ChevronUp, RefreshCw, Upload, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';

// タブの定義
type TabId = 'stages' | 'questions' | 'equipment' | 'characters' | 'skills' | 'partners';
const TABS: { id: TabId; label: string }[] = [
    { id: 'stages', label: 'ステージ' },
    { id: 'questions', label: 'クイズ' },
    { id: 'equipment', label: '装備品' },
    { id: 'characters', label: 'キャラクター' },
    { id: 'skills', label: 'スキル' },
    { id: 'partners', label: 'パートナー' },
];

// 敵タイプの選択肢
const ENEMY_TYPES = ['swarm', 'speed', 'tank', 'boss'] as const;

// 敵タイプごとのデフォルトパラメーター
const ENEMY_DEFAULTS: Record<string, { hp: number; speed: number; attack: number; def: number }> = {
    swarm: { hp: 10, speed: 0.07, attack: 10, def: 3 },
    speed: { hp: 6, speed: 0.14, attack: 7, def: 1 },
    tank: { hp: 35, speed: 0.04, attack: 18, def: 12 },
    boss: { hp: 80, speed: 0.03, attack: 30, def: 20 },
};

const ENEMY_TYPE_LABELS: Record<string, string> = {
    swarm: '🐜 Swarm（小型群）',
    speed: '⚡ Speed（快速）',
    tank: '🛡️ Tank（重装）',
    boss: '💀 Boss（ボス）',
};
const RARITY_OPTIONS = ['N', 'R', 'SR', 'SSR'] as const;
const EFFECT_TYPES = ['NONE', 'EXP_BOOST', 'TIME_SLOW', 'SHIELD', 'QUICK_KILL', 'TICKET_DROP'] as const;
const EQUIP_TYPES = ['weapon', 'armor', 'accessory'] as const;
const SKILL_TARGET_TYPES = ['single', 'multi', 'all', 'dot', 'self'] as const;
const ELEMENT_TYPES = ['fire', 'water', 'thunder', 'earth', 'holy', 'dark', 'wind', 'ice'] as const;
const ELEMENT_LABELS: Record<string, string> = {
    fire: '🔥 炎', water: '💧 水', thunder: '⚡ 雷', earth: '🪨 地',
    holy: '✨ 聖', dark: '🌑 闇', wind: '🍃 風', ice: '❄️ 氷',
};

export default function TDAdminPage() {
    const [config, setConfig] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<TabId>('stages');
    const [expandedStage, setExpandedStage] = useState<number | null>(null);

    // データ読み込み
    const loadConfig = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/tower-defense');
            if (!res.ok) throw new Error('読み込み失敗');
            const data = await res.json();
            setConfig(data);
        } catch (e) {
            toast.error('設定の読み込みに失敗しました');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadConfig(); }, [loadConfig]);

    // 保存
    const saveConfig = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/admin/tower-defense', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config),
            });
            if (!res.ok) throw new Error('保存失敗');
            toast.success('保存しました！');
        } catch (e) {
            toast.error('保存に失敗しました');
        } finally {
            setSaving(false);
        }
    };

    // 汎用的なネストされた値の更新
    const updateConfig = (path: (string | number)[], value: any) => {
        setConfig((prev: any) => {
            const next = JSON.parse(JSON.stringify(prev));
            let obj = next;
            for (let i = 0; i < path.length - 1; i++) {
                obj = obj[path[i]];
            }
            obj[path[path.length - 1]] = value;
            return next;
        });
    };

    if (loading || !config) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <RefreshCw className="animate-spin text-amber-400" size={32} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200">
            <Toaster position="top-right" />

            {/* ヘッダー */}
            <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/game/tower-defense" className="text-slate-400 hover:text-white transition-colors">
                            <ArrowLeft size={20} />
                        </Link>
                        <h1 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-rose-400">
                            ⚙ タワーディフェンス管理
                        </h1>
                    </div>
                    <button
                        onClick={saveConfig}
                        disabled={saving}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-bold px-6 py-2 rounded-full transition-colors shadow-lg"
                    >
                        <Save size={16} />
                        {saving ? '保存中...' : '保存'}
                    </button>
                </div>
            </header>

            {/* タブ */}
            <div className="max-w-7xl mx-auto px-4 pt-4">
                <div className="flex gap-1 bg-slate-900 rounded-xl p-1 border border-slate-800">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-all ${activeTab === tab.id
                                ? 'bg-amber-600 text-white shadow-md'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* コンテンツ */}
            <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">

                {/* ===== ステージタブ ===== */}
                {activeTab === 'stages' && (
                    <div className="space-y-4">
                        {config.stages.map((stage: any, si: number) => (
                            <div key={si} className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
                                {/* ステージヘッダー */}
                                <button
                                    onClick={() => setExpandedStage(expandedStage === si ? null : si)}
                                    className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${stage.isBoss ? 'bg-rose-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                                            {stage.isBoss ? 'BOSS' : `STAGE ${stage.id}`}
                                        </span>
                                        <span className="font-bold text-white">{stage.name}</span>
                                        <span className="text-slate-500 text-sm">敵{stage.enemies.length}体</span>
                                    </div>
                                    {expandedStage === si ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                </button>

                                {expandedStage === si && (
                                    <div className="border-t border-slate-700 p-4 space-y-4">
                                        {/* 基本情報 */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Field label="ID" value={stage.id} onChange={v => updateConfig(['stages', si, 'id'], Number(v))} type="number" />
                                            <Field label="ステージ名" value={stage.name} onChange={v => updateConfig(['stages', si, 'name'], v)} />
                                            <Field label="説明" value={stage.description} onChange={v => updateConfig(['stages', si, 'description'], v)} />
                                            <div className="flex items-center gap-3">
                                                <label className="text-sm text-slate-400 font-bold">ボス戦</label>
                                                <input
                                                    type="checkbox"
                                                    checked={stage.isBoss || false}
                                                    onChange={e => updateConfig(['stages', si, 'isBoss'], e.target.checked)}
                                                    className="w-5 h-5 accent-rose-500"
                                                />
                                            </div>
                                        </div>

                                        {/* 報酬 */}
                                        <div className="grid grid-cols-3 gap-4">
                                            <Field label="SP報酬" value={stage.reward.sp} onChange={v => updateConfig(['stages', si, 'reward', 'sp'], Number(v))} type="number" />
                                            <Field label="チケット報酬" value={stage.reward.tickets} onChange={v => updateConfig(['stages', si, 'reward', 'tickets'], Number(v))} type="number" />
                                            <Field label="卵チケット報酬" value={stage.reward.eggTickets || 0} onChange={v => updateConfig(['stages', si, 'reward', 'eggTickets'], Number(v))} type="number" />
                                        </div>

                                        {/* 敵一覧 */}
                                        <div>
                                            <h4 className="text-sm font-bold text-amber-400 mb-2">敵構成</h4>

                                            {/* 敵追加パネル: タイプ選択 + 追加ボタン */}
                                            <div className="flex items-center gap-2 mb-3 bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                                                <span className="text-xs text-slate-400 font-bold shrink-0">追加:</span>
                                                {ENEMY_TYPES.map(t => (
                                                    <button
                                                        key={t}
                                                        onClick={() => {
                                                            const defaults = ENEMY_DEFAULTS[t];
                                                            const newEnemy = { type: t, hp: defaults.hp, maxHp: defaults.hp, position: 0, speed: defaults.speed, attack: defaults.attack, def: defaults.def };
                                                            const newDelay = (stage.spawnDelay?.length > 0 ? Math.max(...stage.spawnDelay) + 100 : 0);
                                                            updateConfig(['stages', String(si), 'enemies'], [...stage.enemies, newEnemy]);
                                                            updateConfig(['stages', String(si), 'spawnDelay'], [...(stage.spawnDelay || []), newDelay]);
                                                            toast.success(`${ENEMY_TYPE_LABELS[t]} を追加しました`);
                                                        }}
                                                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105 active:scale-95 ${t === 'boss' ? 'bg-rose-600/80 hover:bg-rose-500 text-white' :
                                                            t === 'tank' ? 'bg-blue-600/80 hover:bg-blue-500 text-white' :
                                                                t === 'speed' ? 'bg-amber-600/80 hover:bg-amber-500 text-white' :
                                                                    'bg-slate-600/80 hover:bg-slate-500 text-white'
                                                            }`}
                                                    >
                                                        <Plus size={12} /> {ENEMY_TYPE_LABELS[t]}
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="overflow-x-auto">
                                                <table className="w-full text-xs">
                                                    <thead>
                                                        <tr className="text-slate-500 border-b border-slate-700">
                                                            <th className="p-2 text-left">#</th>
                                                            <th className="p-2 text-left">画像</th>
                                                            <th className="p-2 text-left">タイプ</th>
                                                            <th className="p-2">HP</th>
                                                            <th className="p-2">攻撃</th>
                                                            <th className="p-2">防御</th>
                                                            <th className="p-2">速度</th>
                                                            <th className="p-2">出現遅延</th>
                                                            <th className="p-2"></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {stage.enemies.map((enemy: any, ei: number) => (
                                                            <tr key={ei} className="border-b border-slate-800 hover:bg-slate-800/50">
                                                                <td className="p-2 text-slate-500">{ei + 1}</td>
                                                                <td className="p-2">
                                                                    <EnemyImageCell
                                                                        imageUrl={enemy.imageUrl}
                                                                        onUploaded={(url: string) => updateConfig(['stages', String(si), 'enemies', String(ei), 'imageUrl'], url)}
                                                                    />
                                                                </td>
                                                                <td className="p-2">
                                                                    <select
                                                                        value={enemy.type}
                                                                        onChange={e => {
                                                                            const newType = e.target.value;
                                                                            const defaults = ENEMY_DEFAULTS[newType];
                                                                            // タイプ変更時にデフォルトパラメーターを自動セット
                                                                            setConfig((prev: any) => {
                                                                                const next = JSON.parse(JSON.stringify(prev));
                                                                                next.stages[si].enemies[ei] = {
                                                                                    ...next.stages[si].enemies[ei],
                                                                                    type: newType,
                                                                                    hp: defaults.hp, maxHp: defaults.hp,
                                                                                    speed: defaults.speed, attack: defaults.attack, def: defaults.def,
                                                                                };
                                                                                return next;
                                                                            });
                                                                        }}
                                                                        className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white text-xs"
                                                                    >
                                                                        {ENEMY_TYPES.map(t => <option key={t} value={t}>{ENEMY_TYPE_LABELS[t]}</option>)}
                                                                    </select>
                                                                </td>
                                                                <td className="p-2">
                                                                    <input type="number" value={enemy.hp} onChange={e => { updateConfig(['stages', si, 'enemies', ei, 'hp'], Number(e.target.value)); updateConfig(['stages', si, 'enemies', ei, 'maxHp'], Number(e.target.value)); }}
                                                                        className="w-16 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white text-xs text-center" />
                                                                </td>
                                                                <td className="p-2">
                                                                    <input type="number" value={enemy.attack} onChange={e => updateConfig(['stages', si, 'enemies', ei, 'attack'], Number(e.target.value))}
                                                                        className="w-16 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white text-xs text-center" />
                                                                </td>
                                                                <td className="p-2">
                                                                    <input type="number" value={enemy.def} onChange={e => updateConfig(['stages', si, 'enemies', ei, 'def'], Number(e.target.value))}
                                                                        className="w-16 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white text-xs text-center" />
                                                                </td>
                                                                <td className="p-2">
                                                                    <input type="number" step="0.01" value={enemy.speed} onChange={e => updateConfig(['stages', si, 'enemies', ei, 'speed'], Number(e.target.value))}
                                                                        className="w-20 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white text-xs text-center" />
                                                                </td>
                                                                <td className="p-2">
                                                                    <input type="number" value={stage.spawnDelay?.[ei] ?? 0} onChange={e => updateConfig(['stages', si, 'spawnDelay', ei], Number(e.target.value))}
                                                                        className="w-20 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white text-xs text-center" />
                                                                </td>
                                                                <td className="p-2">
                                                                    <button onClick={() => {
                                                                        const newEnemies = [...stage.enemies]; newEnemies.splice(ei, 1);
                                                                        const newDelays = [...(stage.spawnDelay || [])]; newDelays.splice(ei, 1);
                                                                        updateConfig(['stages', si, 'enemies'], newEnemies);
                                                                        updateConfig(['stages', si, 'spawnDelay'], newDelays);
                                                                    }} className="text-rose-500 hover:text-rose-400"><Trash2 size={14} /></button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* ステージ追加 */}
                        <button
                            onClick={() => {
                                const newId = Math.max(...config.stages.map((s: any) => s.id)) + 1;
                                updateConfig(['stages'], [...config.stages, {
                                    id: newId, name: `STAGE ${newId}: 新ステージ`, description: '新しいステージの説明', isBoss: false,
                                    enemies: [{ type: 'swarm', hp: 10, maxHp: 10, position: 0, speed: 0.07, attack: 10, def: 3 }],
                                    spawnDelay: [0], reward: { sp: 30, tickets: 1 }
                                }]);
                            }}
                            className="w-full py-3 border-2 border-dashed border-slate-700 rounded-xl text-slate-500 hover:text-amber-400 hover:border-amber-500 transition-colors font-bold flex items-center justify-center gap-2"
                        >
                            <Plus size={18} /> 新しいステージを追加
                        </button>
                    </div>
                )}

                {/* ===== クイズタブ ===== */}
                {activeTab === 'questions' && (
                    <div className="space-y-4">
                        {config.questions.map((q: any, qi: number) => (
                            <div key={qi} className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-3">
                                <div className="flex items-start justify-between">
                                    <span className="text-xs text-slate-500 font-bold">Q{qi + 1}</span>
                                    <button onClick={() => {
                                        const nq = [...config.questions]; nq.splice(qi, 1);
                                        updateConfig(['questions'], nq);
                                    }} className="text-rose-500 hover:text-rose-400"><Trash2 size={14} /></button>
                                </div>
                                <Field label="問題文" value={q.q} onChange={v => updateConfig(['questions', qi, 'q'], v)} />
                                <div className="grid grid-cols-2 gap-2">
                                    {q.options.map((opt: string, oi: number) => (
                                        <div key={oi} className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                name={`q_${qi}_answer`}
                                                checked={q.answer === oi}
                                                onChange={() => updateConfig(['questions', qi, 'answer'], oi)}
                                                className="accent-emerald-500"
                                            />
                                            <input
                                                value={opt}
                                                onChange={e => {
                                                    const newOpts = [...q.options]; newOpts[oi] = e.target.value;
                                                    updateConfig(['questions', qi, 'options'], newOpts);
                                                }}
                                                className="flex-1 bg-slate-800 border border-slate-600 rounded px-3 py-1.5 text-sm text-white"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        <button
                            onClick={() => updateConfig(['questions'], [...config.questions, { q: '新しい問題', options: ['選択肢1', '選択肢2', '選択肢3', '選択肢4'], answer: 0 }])}
                            className="w-full py-3 border-2 border-dashed border-slate-700 rounded-xl text-slate-500 hover:text-amber-400 hover:border-amber-500 transition-colors font-bold flex items-center justify-center gap-2"
                        >
                            <Plus size={18} /> 新しい問題を追加
                        </button>
                    </div>
                )}

                {/* ===== 装備品タブ ===== */}
                {activeTab === 'equipment' && (
                    <div className="space-y-4">
                        {config.equipment.map((item: any, ii: number) => (
                            <div key={ii} className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black ${item.rarity === 'SSR' ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black' :
                                        item.rarity === 'SR' ? 'bg-purple-600 text-white' :
                                            item.rarity === 'R' ? 'bg-blue-600 text-white' : 'bg-slate-600 text-white'
                                        }`}>{item.rarity}</span>
                                    <button onClick={() => {
                                        const ne = [...config.equipment]; ne.splice(ii, 1);
                                        updateConfig(['equipment'], ne);
                                    }} className="text-rose-500 hover:text-rose-400"><Trash2 size={14} /></button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <Field label="ID" value={item.id} onChange={v => updateConfig(['equipment', ii, 'id'], v)} />
                                    <Field label="名前" value={item.name} onChange={v => updateConfig(['equipment', ii, 'name'], v)} />
                                    <div>
                                        <label className="text-xs text-slate-500 font-bold block mb-1">種別</label>
                                        <select value={item.type} onChange={e => updateConfig(['equipment', ii, 'type'], e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-1.5 text-sm text-white">
                                            {EQUIP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <Field label="説明" value={item.description} onChange={v => updateConfig(['equipment', ii, 'description'], v)} />
                                <ImageUpload label="装備画像" currentUrl={item.imageUrl} category="equipment" onUploaded={url => updateConfig(['equipment', String(ii), 'imageUrl'], url)} />
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-xs text-slate-500 font-bold block mb-1">レア度</label>
                                        <select value={item.rarity} onChange={e => updateConfig(['equipment', ii, 'rarity'], e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-1.5 text-sm text-white">
                                            {RARITY_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 font-bold block mb-1">効果タイプ</label>
                                        <select value={item.effectType} onChange={e => updateConfig(['equipment', ii, 'effectType'], e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-1.5 text-sm text-white">
                                            {EFFECT_TYPES.map(et => <option key={et} value={et}>{et}</option>)}
                                        </select>
                                    </div>
                                    <Field label="効果値" value={item.effectValue} onChange={v => updateConfig(['equipment', ii, 'effectValue'], Number(v))} type="number" />
                                </div>
                                <Field label="アイコン名" value={item.icon} onChange={v => updateConfig(['equipment', ii, 'icon'], v)} />
                            </div>
                        ))}
                        <button
                            onClick={() => updateConfig(['equipment'], [...config.equipment, {
                                id: `new_${Date.now()}`, name: '新しい装備', type: 'weapon', rarity: 'N', description: '新しい装備の説明',
                                effectType: 'NONE', effectValue: 0, icon: 'sword'
                            }])}
                            className="w-full py-3 border-2 border-dashed border-slate-700 rounded-xl text-slate-500 hover:text-amber-400 hover:border-amber-500 transition-colors font-bold flex items-center justify-center gap-2"
                        >
                            <Plus size={18} /> 新しい装備を追加
                        </button>
                    </div>
                )}

                {/* ===== キャラクタータブ ===== */}
                {activeTab === 'characters' && (
                    <div className="space-y-6">
                        {Object.entries(config.characters).map(([classId, charData]: [string, any]) => (
                            <div key={classId} className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-black text-amber-400">{charData.name}</h3>
                                    <button onClick={() => {
                                        const next = { ...config.characters };
                                        delete next[classId];
                                        updateConfig(['characters'], next);
                                        // スキルも同時に削除
                                        if (config.skills?.[classId]) {
                                            const nextSkills = { ...config.skills };
                                            delete nextSkills[classId];
                                            updateConfig(['skills'], nextSkills);
                                        }
                                        toast.success(`${charData.name} を削除しました`);
                                    }} className="text-rose-500 hover:text-rose-400 text-xs flex items-center gap-1">
                                        <Trash2 size={12} /> キャラ削除
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <Field label="ID" value={classId} onChange={() => { }} />
                                    <Field label="名前" value={charData.name} onChange={v => updateConfig(['characters', classId, 'name'], v)} />
                                    <Field label="説明" value={charData.description} onChange={v => updateConfig(['characters', classId, 'description'], v)} />
                                </div>

                                {/* 進化段階 */}
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-bold text-slate-400">進化段階 ({charData.stages.length}段階)</h4>
                                </div>
                                {charData.stages.map((stage: any, si: number) => (
                                    <div key={si} className="bg-slate-800/50 rounded-lg p-3 space-y-2 border border-slate-700">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-500">第{si + 1}段階</span>
                                            {charData.stages.length > 1 && (
                                                <button onClick={() => {
                                                    const newStages = [...charData.stages];
                                                    newStages.splice(si, 1);
                                                    updateConfig(['characters', classId, 'stages'], newStages);
                                                    toast.success(`第${si + 1}段階を削除しました`);
                                                }} className="text-rose-500 hover:text-rose-400">
                                                    <Trash2 size={12} />
                                                </button>
                                            )}
                                        </div>
                                        <ImageUpload label="キャラ画像" currentUrl={stage.imageUrl} category="character" onUploaded={url => updateConfig(['characters', classId, 'stages', String(si), 'imageUrl'], url)} />
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            <Field label="レベル" value={stage.level} onChange={v => updateConfig(['characters', classId, 'stages', si, 'level'], Number(v))} type="number" />
                                            <Field label="名前" value={stage.name} onChange={v => updateConfig(['characters', classId, 'stages', si, 'name'], v)} />
                                        </div>
                                        <div className="grid grid-cols-4 gap-2">
                                            <Field label="HP" value={stage.stats.hp} onChange={v => updateConfig(['characters', classId, 'stages', si, 'stats', 'hp'], Number(v))} type="number" />
                                            <Field label="ATK" value={stage.stats.atk} onChange={v => updateConfig(['characters', classId, 'stages', si, 'stats', 'atk'], Number(v))} type="number" />
                                            <Field label="DEF" value={stage.stats.def} onChange={v => updateConfig(['characters', classId, 'stages', si, 'stats', 'def'], Number(v))} type="number" />
                                            <Field label="SPD" value={stage.stats.spd} onChange={v => updateConfig(['characters', classId, 'stages', si, 'stats', 'spd'], Number(v))} type="number" />
                                        </div>
                                    </div>
                                ))}
                                {/* 進化段階追加ボタン */}
                                <button
                                    onClick={() => {
                                        const lastStage = charData.stages[charData.stages.length - 1];
                                        const nextLevel = (lastStage?.level ?? 0) + 5;
                                        const newStage = {
                                            level: nextLevel,
                                            name: `新しい進化形`,
                                            imageUrl: '',
                                            stats: {
                                                hp: Math.round((lastStage?.stats?.hp ?? 10) * 1.8),
                                                atk: Math.round((lastStage?.stats?.atk ?? 5) * 1.8),
                                                def: Math.round((lastStage?.stats?.def ?? 3) * 1.8),
                                                spd: Math.round((lastStage?.stats?.spd ?? 2) * 1.8),
                                            }
                                        };
                                        updateConfig(['characters', classId, 'stages'], [...charData.stages, newStage]);
                                        toast.success(`第${charData.stages.length + 1}段階を追加しました`);
                                    }}
                                    className="w-full py-2 border-2 border-dashed border-slate-700 rounded-lg text-slate-500 hover:text-emerald-400 hover:border-emerald-500 transition-colors text-sm font-bold flex items-center justify-center gap-2"
                                >
                                    <Plus size={14} /> 進化段階を追加（第{charData.stages.length + 1}段階）
                                </button>
                            </div>
                        ))}

                        {/* 新しいキャラクター（道）追加 */}
                        <button
                            onClick={() => {
                                const newId = `class_${Date.now()}`;
                                const newChar = {
                                    id: newId,
                                    name: '新しい道',
                                    description: '新しいキャラクターの説明',
                                    stages: [
                                        { level: 1, name: '初心者', imageUrl: '', stats: { hp: 8, atk: 4, def: 3, spd: 3 } },
                                        { level: 5, name: '中級者', imageUrl: '', stats: { hp: 22, atk: 14, def: 10, spd: 8 } },
                                        { level: 10, name: '達人', imageUrl: '', stats: { hp: 50, atk: 35, def: 25, spd: 18 } },
                                    ]
                                };
                                updateConfig(['characters', newId], newChar);
                                // スキルも空配列で追加
                                updateConfig(['skills', newId], []);
                                toast.success('新しいキャラクターを追加しました');
                            }}
                            className="w-full py-3 border-2 border-dashed border-slate-700 rounded-xl text-slate-500 hover:text-amber-400 hover:border-amber-500 transition-colors font-bold flex items-center justify-center gap-2"
                        >
                            <Plus size={18} /> 新しいキャラクター（〇〇の道）を追加
                        </button>
                    </div>
                )}

                {/* ===== スキルタブ ===== */}
                {activeTab === 'skills' && (
                    <div className="space-y-6">
                        {Object.entries(config.skills).map(([classId, skills]: [string, any]) => (
                            <div key={classId} className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-4">
                                <h3 className="text-lg font-black text-amber-400">
                                    {classId === 'warrior' ? '戦士' : classId === 'mage' ? '魔法使い' : '商人'}スキル
                                </h3>
                                {skills.map((skill: any, si: number) => (
                                    <div key={si} className="bg-slate-800/50 rounded-lg p-3 space-y-2 border border-slate-700">
                                        <div className="flex items-center justify-between">
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${skill.type === 'active' ? 'bg-amber-600 text-white' : 'bg-slate-600 text-slate-300'}`}>
                                                {skill.type === 'active' ? 'アクティブ' : 'パッシブ'}
                                            </span>
                                            <button onClick={() => {
                                                const ns = [...skills]; ns.splice(si, 1);
                                                updateConfig(['skills', classId], ns);
                                            }} className="text-rose-500 hover:text-rose-400"><Trash2 size={14} /></button>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            <Field label="ID" value={skill.id} onChange={v => updateConfig(['skills', classId, si, 'id'], v)} />
                                            <Field label="スキル名" value={skill.name} onChange={v => updateConfig(['skills', classId, si, 'name'], v)} />
                                            <Field label="説明" value={skill.description} onChange={v => updateConfig(['skills', classId, si, 'description'], v)} />
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            <Field label="SP消費" value={skill.spCost} onChange={v => updateConfig(['skills', classId, si, 'spCost'], Number(v))} type="number" />
                                            <Field label="必要Lv" value={skill.requiredLevel} onChange={v => updateConfig(['skills', classId, si, 'requiredLevel'], Number(v))} type="number" />
                                            {skill.type === 'active' && (
                                                <>
                                                    <Field label="MP消費" value={skill.mpCost ?? 0} onChange={v => updateConfig(['skills', classId, si, 'mpCost'], Number(v))} type="number" />
                                                    <div>
                                                        <label className="text-xs text-slate-500 font-bold block mb-1">対象タイプ</label>
                                                        <select value={skill.targetType ?? 'single'} onChange={e => updateConfig(['skills', classId, si, 'targetType'], e.target.value)}
                                                            className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-1.5 text-sm text-white">
                                                            {SKILL_TARGET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                        </select>
                                                    </div>
                                                    <Field label="ダメージ倍率" value={skill.damageMultiplier ?? 1} onChange={v => updateConfig(['skills', classId, si, 'damageMultiplier'], Number(v))} type="number" />
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <button
                                    onClick={() => updateConfig(['skills', classId], [...skills, {
                                        id: `${classId}_new_${Date.now()}`, name: '新スキル', description: '新しいスキルの説明',
                                        spCost: 5, requiredLevel: 2, type: 'active', color: 'from-gray-500 to-gray-700',
                                        mpCost: 10, targetType: 'single', damageMultiplier: 1.0
                                    }])}
                                    className="w-full py-2 border-2 border-dashed border-slate-700 rounded-lg text-slate-500 hover:text-amber-400 hover:border-amber-500 transition-colors text-sm font-bold flex items-center justify-center gap-2"
                                >
                                    <Plus size={14} /> スキル追加
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* ===== パートナータブ ===== */}
                {activeTab === 'partners' && config.partners && (
                    <div className="space-y-6">
                        {/* 卵ガチャ設定 */}
                        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-4">
                            <h3 className="text-lg font-black text-amber-400">🥚 卵ガチャ設定</h3>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                <Field label="1回のコスト（チケット）" value={config.partners.eggGacha?.costPerPull ?? 3} onChange={v => updateConfig(['partners', 'eggGacha', 'costPerPull'], Number(v))} type="number" />
                                <Field label="N排出率(%)" value={config.partners.eggGacha?.rates?.N ?? 60} onChange={v => updateConfig(['partners', 'eggGacha', 'rates', 'N'], Number(v))} type="number" />
                                <Field label="R排出率(%)" value={config.partners.eggGacha?.rates?.R ?? 25} onChange={v => updateConfig(['partners', 'eggGacha', 'rates', 'R'], Number(v))} type="number" />
                                <Field label="SR排出率(%)" value={config.partners.eggGacha?.rates?.SR ?? 12} onChange={v => updateConfig(['partners', 'eggGacha', 'rates', 'SR'], Number(v))} type="number" />
                                <Field label="SSR排出率(%)" value={config.partners.eggGacha?.rates?.SSR ?? 3} onChange={v => updateConfig(['partners', 'eggGacha', 'rates', 'SSR'], Number(v))} type="number" />
                            </div>
                            <Field label="融合に必要な同キャラ数" value={config.partners.fusionRequired ?? 3} onChange={v => updateConfig(['partners', 'fusionRequired'], Number(v))} type="number" />
                        </div>

                        {/* パートナー一覧 */}
                        {(config.partners.list || []).map((partner: any, pi: number) => (
                            <div key={pi} className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black ${partner.rarity === 'SSR' ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black' :
                                            partner.rarity === 'SR' ? 'bg-purple-600 text-white' :
                                                partner.rarity === 'R' ? 'bg-blue-600 text-white' : 'bg-slate-600 text-white'
                                            }`}>{partner.rarity}</span>
                                        <span className="text-white font-bold">{partner.name}</span>
                                        <span className="text-xs text-slate-500">{ELEMENT_LABELS[partner.element] || partner.element}</span>
                                    </div>
                                    <button onClick={() => {
                                        const np = [...config.partners.list]; np.splice(pi, 1);
                                        updateConfig(['partners', 'list'], np);
                                    }} className="text-rose-500 hover:text-rose-400"><Trash2 size={14} /></button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <Field label="ID" value={partner.id} onChange={v => updateConfig(['partners', 'list', String(pi), 'id'], v)} />
                                    <Field label="名前" value={partner.name} onChange={v => updateConfig(['partners', 'list', String(pi), 'name'], v)} />
                                    <div>
                                        <label className="text-xs text-slate-500 font-bold block mb-1">属性</label>
                                        <select value={partner.element} onChange={e => updateConfig(['partners', 'list', String(pi), 'element'], e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-1.5 text-sm text-white">
                                            {ELEMENT_TYPES.map(el => <option key={el} value={el}>{ELEMENT_LABELS[el]}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <Field label="説明" value={partner.description} onChange={v => updateConfig(['partners', 'list', String(pi), 'description'], v)} />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-slate-500 font-bold block mb-1">レア度</label>
                                        <select value={partner.rarity} onChange={e => updateConfig(['partners', 'list', String(pi), 'rarity'], e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-1.5 text-sm text-white">
                                            {RARITY_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                    </div>
                                    <ImageUpload label="サムネイル画像" currentUrl={partner.imageUrl} category="partner" onUploaded={url => updateConfig(['partners', 'list', String(pi), 'imageUrl'], url)} />
                                </div>

                                {/* 進化段階 */}
                                <h4 className="text-sm font-bold text-slate-400 pt-2">進化段階</h4>
                                {(partner.stages || []).map((stage: any, si: number) => (
                                    <div key={si} className="bg-slate-800/50 rounded-lg p-3 space-y-2 border border-slate-700">
                                        <ImageUpload label={`Lv.${stage.level} 画像`} currentUrl={stage.imageUrl} category="partner" onUploaded={url => updateConfig(['partners', 'list', String(pi), 'stages', String(si), 'imageUrl'], url)} />
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            <Field label="レベル" value={stage.level} onChange={v => updateConfig(['partners', 'list', String(pi), 'stages', String(si), 'level'], Number(v))} type="number" />
                                            <Field label="名前" value={stage.name} onChange={v => updateConfig(['partners', 'list', String(pi), 'stages', String(si), 'name'], v)} />
                                            <Field label="スキルID" value={stage.skill || ''} onChange={v => updateConfig(['partners', 'list', String(pi), 'stages', String(si), 'skill'], v)} />
                                        </div>
                                        <div className="grid grid-cols-4 gap-2">
                                            <Field label="HP" value={stage.stats.hp} onChange={v => updateConfig(['partners', 'list', String(pi), 'stages', String(si), 'stats', 'hp'], Number(v))} type="number" />
                                            <Field label="ATK" value={stage.stats.atk} onChange={v => updateConfig(['partners', 'list', String(pi), 'stages', String(si), 'stats', 'atk'], Number(v))} type="number" />
                                            <Field label="DEF" value={stage.stats.def} onChange={v => updateConfig(['partners', 'list', String(pi), 'stages', String(si), 'stats', 'def'], Number(v))} type="number" />
                                            <Field label="SPD" value={stage.stats.spd} onChange={v => updateConfig(['partners', 'list', String(pi), 'stages', String(si), 'stats', 'spd'], Number(v))} type="number" />
                                            <Field label="TD攻撃間隔(秒)" value={stage.stats.tdAttackInterval ?? 5} onChange={v => updateConfig(['partners', 'list', String(pi), 'stages', String(si), 'stats', 'tdAttackInterval'], Number(v))} type="number" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}

                        {/* パートナー追加ボタン */}
                        <button
                            onClick={() => updateConfig(['partners', 'list'], [...(config.partners.list || []), {
                                id: `pet_new_${Date.now()}`, name: '新パートナー', rarity: 'N', description: '新しいパートナー',
                                element: 'fire', imageUrl: '',
                                stages: [
                                    { level: 1, name: '赤ちゃん', imageUrl: '', stats: { hp: 5, atk: 3, def: 1, spd: 2, tdAttackInterval: 5 }, skill: '' },
                                    { level: 5, name: '成長期', imageUrl: '', stats: { hp: 15, atk: 10, def: 4, spd: 5, tdAttackInterval: 4 }, skill: '' },
                                    { level: 10, name: '最終形態', imageUrl: '', stats: { hp: 35, atk: 25, def: 10, spd: 10, tdAttackInterval: 3 }, skill: '' },
                                ]
                            }])}
                            className="w-full py-3 border-2 border-dashed border-slate-700 rounded-xl text-slate-500 hover:text-amber-400 hover:border-amber-500 transition-colors font-bold flex items-center justify-center gap-2"
                        >
                            <Plus size={18} /> 新しいパートナーを追加
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}

// 汎用フィールドコンポーネント
function Field({ label, value, onChange, type = 'text' }: { label: string; value: any; onChange: (v: string) => void; type?: string }) {
    return (
        <div>
            <label className="text-xs text-slate-500 font-bold block mb-1">{label}</label>
            <input
                type={type}
                value={value}
                step={type === 'number' ? 'any' : undefined}
                onChange={e => onChange(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-1.5 text-sm text-white focus:border-amber-500 focus:outline-none transition-colors"
            />
        </div>
    );
}

// 画像アップロード＋プレビューコンポーネント
function ImageUpload({ label, currentUrl, category, onUploaded }: { label: string; currentUrl?: string; category: string; onUploaded: (url: string) => void }) {
    const [uploading, setUploading] = React.useState(false);
    const fileRef = React.useRef<HTMLInputElement>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('category', category);
            const res = await fetch('/api/admin/tower-defense/upload', { method: 'POST', body: formData });
            if (!res.ok) throw new Error('Upload failed');
            const data = await res.json();
            onUploaded(data.url);
            toast.success('画像をアップロードしました');
        } catch {
            toast.error('アップロードに失敗しました');
        } finally {
            setUploading(false);
            if (fileRef.current) fileRef.current.value = '';
        }
    };

    return (
        <div className="flex items-center gap-3">
            {/* プレビュー */}
            <div className="w-16 h-16 rounded-lg border border-slate-600 bg-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                {currentUrl ? (
                    <img src={currentUrl} alt={label} className="w-full h-full object-contain" />
                ) : (
                    <ImageIcon size={20} className="text-slate-600" />
                )}
            </div>
            <div className="flex-1">
                <label className="text-xs text-slate-500 font-bold block mb-1">{label}</label>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                        <Upload size={12} />
                        {uploading ? 'アップロード中...' : '画像を選択'}
                    </button>
                    {currentUrl && <span className="text-[10px] text-slate-500 truncate max-w-[200px]">{currentUrl}</span>}
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
            </div>
        </div>
    );
}

// 敵テーブル行用のコンパクトな画像アップロードセル
function EnemyImageCell({ imageUrl, onUploaded }: { imageUrl?: string; onUploaded: (url: string) => void }) {
    const [uploading, setUploading] = React.useState(false);
    const fileRef = React.useRef<HTMLInputElement>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('category', 'enemy');
            const res = await fetch('/api/admin/tower-defense/upload', { method: 'POST', body: formData });
            if (!res.ok) throw new Error('Upload failed');
            const data = await res.json();
            onUploaded(data.url);
            toast.success('敵画像をアップロードしました');
        } catch {
            toast.error('アップロードに失敗しました');
        } finally {
            setUploading(false);
            if (fileRef.current) fileRef.current.value = '';
        }
    };

    return (
        <div>
            <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-10 h-10 rounded border border-slate-600 bg-slate-800 flex items-center justify-center overflow-hidden hover:border-amber-500 transition-colors cursor-pointer"
                title="クリックで画像アップロード"
            >
                {uploading ? (
                    <RefreshCw size={12} className="animate-spin text-amber-400" />
                ) : imageUrl ? (
                    <img src={imageUrl} alt="enemy" className="w-full h-full object-contain" />
                ) : (
                    <ImageIcon size={14} className="text-slate-600" />
                )}
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
        </div>
    );
}
