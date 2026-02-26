"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layout as DashboardIcon, GraduationCap, TrendingUp, Settings, LogOut, LogIn, Menu } from 'lucide-react';
import MobileBottomNav from './MobileBottomNav';
import ScrollToTop from './ScrollToTop';

const MANAQUE_UNLOCK_KEY = 'manaque_unlocked';
const PROTECTED_ROUTES = ['/game', '/mypage', '/dashboard', '/elearning'];

interface NavItem {
    name: string;
    icon: any;
    href: string;
}

const NAV_ITEMS: NavItem[] = [
    { name: 'ダッシュボード', icon: DashboardIcon, href: '/dashboard' },
    { name: '学習', icon: GraduationCap, href: '/elearning' },
    { name: '模擬試験', icon: TrendingUp, href: '/game/mock-exam' },
    { name: 'マイページ', icon: Settings, href: '/mypage' },
];

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const [mounted, setMounted] = React.useState(false);
    const [isUnlocked, setIsUnlocked] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
        setIsUnlocked(localStorage.getItem(MANAQUE_UNLOCK_KEY) === 'true');
    }, []);

    // パスコード未解錠時は保護ルートから /welcome にリダイレクト
    React.useEffect(() => {
        if (!mounted) return;
        const unlocked = localStorage.getItem(MANAQUE_UNLOCK_KEY) === 'true';
        if (!unlocked) {
            const isProtected = PROTECTED_ROUTES.some(r => window.location.pathname.startsWith(r));
            if (isProtected) {
                window.location.href = '/welcome';
            }
        }
    }, [pathname, mounted]);

    const handleLogout = () => {
        localStorage.removeItem(MANAQUE_UNLOCK_KEY);
        window.location.href = '/welcome';
    };

    const isPublicPage = pathname === '/welcome' || pathname?.startsWith('/login');
    const isAdminDashboard = pathname?.startsWith('/admin');
    const isCompanyDashboard = pathname?.startsWith('/dashboard/company');
    const isBabyBase = pathname?.startsWith('/babybase');

    const renderNavItems = (onClick?: () => void) => (
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {NAV_ITEMS.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClick}
                    className={`relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
                        pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href))
                            ? 'bg-zinc-100 text-blue-600'
                            : 'text-zinc-500 hover:bg-zinc-50'
                    }`}
                >
                    <item.icon size={20} />
                    {item.name}
                </Link>
            ))}
        </nav>
    );

    if (isCompanyDashboard || isPublicPage || isBabyBase || isAdminDashboard) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen bg-zinc-50 flex flex-col md:flex-row">
            {/* PC Sidebar */}
            <aside className="hidden md:flex w-64 shrink-0 bg-white border-r border-zinc-200 flex-col h-screen sticky top-0">
                <div className="p-8 border-b border-zinc-100">
                    <Link href="/dashboard" className="w-full flex flex-col items-center group gap-2">
                        <GraduationCap size={40} className="text-blue-600 group-hover:scale-110 transition-transform" />
                        <span className="font-black text-slate-800 text-lg tracking-tighter group-hover:text-blue-600 transition-colors">マナクエ</span>
                    </Link>
                </div>

                {renderNavItems()}

                <div className="px-4 pb-6">
                    {!mounted ? (
                        <div className="w-full h-[46px] rounded-xl bg-slate-100 animate-pulse" />
                    ) : isUnlocked ? (
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-white bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors shadow-sm cursor-pointer"
                        >
                            <LogOut size={20} />
                            ログアウト
                        </button>
                    ) : (
                        <Link
                            href="/welcome"
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            <LogIn size={20} />
                            ログイン
                        </Link>
                    )}
                </div>
            </aside>

            {/* Mobile Header */}
            <header className="md:hidden h-16 bg-white border-b border-zinc-100 flex items-center justify-between px-6 sticky top-0 z-50">
                <button onClick={() => setIsMenuOpen(true)} className="p-1">
                    <Menu className="text-zinc-600" />
                </button>
                <Link href="/dashboard" className="flex items-center">
                    <GraduationCap size={24} className="text-blue-600" />
                    <span className="font-black text-slate-800 text-lg ml-2 tracking-tight">マナクエ</span>
                </Link>
                <div className="w-8" />
            </header>

            {/* Mobile Side Menu Overlay */}
            <div
                className={`fixed inset-0 bg-black/50 z-[100] transition-opacity duration-300 md:hidden ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsMenuOpen(false)}
            >
                <div
                    className={`absolute left-0 top-0 bottom-0 w-64 bg-white transition-transform duration-300 ease-out flex flex-col ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="p-6 border-b border-zinc-100 flex items-center justify-center">
                        <Link href="/dashboard" className="flex flex-col items-center gap-2" onClick={() => setIsMenuOpen(false)}>
                            <GraduationCap size={32} className="text-blue-600" />
                            <span className="font-black text-slate-800 text-lg tracking-tight">マナクエ</span>
                        </Link>
                    </div>

                    {renderNavItems(() => setIsMenuOpen(false))}

                    <div className="px-4 pb-6">
                        {!mounted ? (
                            <div className="w-full h-[46px] rounded-xl bg-slate-100 animate-pulse" />
                        ) : isUnlocked ? (
                            <button
                                onClick={() => { setIsMenuOpen(false); handleLogout(); }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-white bg-slate-800 rounded-xl cursor-pointer"
                            >
                                <LogOut size={20} />
                                ログアウト
                            </button>
                        ) : (
                            <Link
                                href="/welcome"
                                onClick={() => setIsMenuOpen(false)}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-white bg-blue-600 rounded-xl"
                            >
                                <LogIn size={20} />
                                ログイン
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 pb-24 md:pb-0 min-h-screen min-w-0">
                {children}
            </main>

            <ScrollToTop />
            <MobileBottomNav />
        </div>
    );
}
