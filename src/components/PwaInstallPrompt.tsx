"use client";

import React, { useEffect, useState } from 'react';
import { Download, X, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PwaInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showBanner, setShowBanner] = useState(false);
    const [isIos, setIsIos] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Service Worker登録
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(() => {});
        }

        // 既にPWAとして開いている場合は表示しない
        const standalone = window.matchMedia('(display-mode: standalone)').matches
            || (navigator as any).standalone === true;
        setIsStandalone(standalone);
        if (standalone) return;

        // iOS判定
        const ua = navigator.userAgent;
        const isIosDevice = /iPhone|iPad|iPod/.test(ua);
        setIsIos(isIosDevice);

        // 永久非表示または一時非表示チェック
        if (localStorage.getItem('pwa_install_never') === 'true') return;
        const dismissed = localStorage.getItem('pwa_install_dismissed');
        if (dismissed) {
            const dismissedAt = parseInt(dismissed, 10);
            if (Date.now() - dismissedAt < 24 * 60 * 60 * 1000) return;
        }

        // Chrome / Edge: beforeinstallprompt
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setShowBanner(true);
        };
        window.addEventListener('beforeinstallprompt', handler);

        // iOS Safari: 3秒後にバナー表示
        if (isIosDevice) {
            const timer = setTimeout(() => setShowBanner(true), 3000);
            return () => {
                clearTimeout(timer);
                window.removeEventListener('beforeinstallprompt', handler);
            };
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (deferredPrompt) {
            await deferredPrompt.prompt();
            const result = await deferredPrompt.userChoice;
            if (result.outcome === 'accepted') {
                setShowBanner(false);
            }
            setDeferredPrompt(null);
        }
    };

    const handleDismiss = () => {
        setShowBanner(false);
        localStorage.setItem('pwa_install_dismissed', String(Date.now()));
    };

    const handleNeverShow = () => {
        setShowBanner(false);
        localStorage.setItem('pwa_install_never', 'true');
    };

    if (isStandalone || !showBanner) return null;

    return (
        <div className="fixed bottom-20 left-3 right-3 z-[60] animate-in slide-in-from-bottom-4 fade-in duration-300">
            <div className="bg-slate-800 border border-slate-600 rounded-2xl shadow-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center shrink-0">
                    {isIos ? <Share size={20} className="text-indigo-400" /> : <Download size={20} className="text-indigo-400" />}
                </div>

                <div className="flex-grow min-w-0">
                    <p className="text-sm font-black text-white">ホーム画面に追加</p>
                    {isIos ? (
                        <p className="text-[11px] font-bold text-slate-400 mt-0.5">
                            Safari下部の<Share size={12} className="inline text-indigo-400 mx-0.5" />→「ホーム画面に追加」
                        </p>
                    ) : (
                        <p className="text-[11px] font-bold text-slate-400 mt-0.5">
                            アプリのように素早くアクセス
                        </p>
                    )}
                </div>

                {!isIos && deferredPrompt && (
                    <button
                        onClick={handleInstall}
                        className="shrink-0 bg-indigo-500 hover:bg-indigo-400 text-white font-black text-xs px-4 py-2 rounded-xl transition-colors active:scale-95"
                    >
                        追加
                    </button>
                )}

                <button
                    onClick={handleDismiss}
                    className="shrink-0 w-8 h-8 flex items-center justify-center text-slate-500 hover:text-white transition-colors"
                >
                    <X size={16} />
                </button>
            </div>
            <button
                onClick={handleNeverShow}
                className="mt-1.5 w-full text-center text-[10px] font-bold text-slate-500 hover:text-slate-300 py-1 transition-colors"
            >
                今後表示しない
            </button>
        </div>
    );
}
