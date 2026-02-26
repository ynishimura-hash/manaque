"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, GraduationCap, TrendingUp, User } from 'lucide-react';
import { clsx } from "clsx";

const navItems = [
    { name: 'ホーム', href: '/dashboard', icon: Home },
    { name: '学習', href: '/elearning', icon: GraduationCap },
    { name: '模擬試験', href: '/game/mock-exam', icon: TrendingUp },
    { name: 'マイページ', href: '/mypage', icon: User },
];

export default function MobileBottomNav() {
    const pathname = usePathname();

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-50 safe-area-bottom">
            <div className="flex items-stretch h-16">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={clsx(
                                "flex-1 flex flex-col items-center justify-center gap-1 min-h-[44px] transition-colors",
                                isActive
                                    ? "text-blue-600"
                                    : "text-slate-400 active:text-slate-600"
                            )}
                        >
                            <item.icon
                                size={22}
                                strokeWidth={isActive ? 2.5 : 2}
                                className={isActive ? "text-blue-600" : "text-slate-400"}
                            />
                            <span className={clsx(
                                "text-[10px] font-bold",
                                isActive ? "text-blue-600" : "text-slate-400"
                            )}>
                                {item.name}
                            </span>
                            {isActive && (
                                <span className="absolute bottom-0 w-8 h-0.5 bg-blue-500 rounded-full" />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
