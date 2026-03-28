"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layout as DashboardIcon, GraduationCap, TrendingUp, Settings, LogIn, Menu } from 'lucide-react';
import MobileBottomNav from './MobileBottomNav';
import ScrollToTop from './ScrollToTop';


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

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const isPublicPage = pathname?.startsWith('/login');
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
                    <Link
                        href="/login"
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <LogIn size={20} />
                        ログイン
                    </Link>
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
                        <Link
                            href="/login"
                            onClick={() => setIsMenuOpen(false)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-white bg-blue-600 rounded-xl"
                        >
                            <LogIn size={20} />
                            ログイン
                        </Link>
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
