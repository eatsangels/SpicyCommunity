'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { 
  LayoutDashboard, 
  Trophy, 
  Users, 
  Settings, 
  ChevronRight,
  LogOut,
  Shield,
  Calendar
} from 'lucide-react';

import Image from 'next/image';

export default function AdminSidebar() {
  const t = useTranslations('Admin');
  const pathname = usePathname();

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, href: '/admin', label: t('dashboard') },
    { id: 'tournaments', icon: Trophy, href: '/admin/tournaments', label: t('tournaments') },
    { id: 'calendar', icon: Calendar, href: '/admin/calendar', label: t('calendar') },
    { id: 'teams', icon: Shield, href: '/admin/teams', label: t('teams') },
    { id: 'users', icon: Users, href: '/admin/users', label: t('users') },
    { id: 'settings', icon: Settings, href: '/admin/settings', label: t('settings') },
  ];

  return (
    <div className="w-64 h-full bg-zinc-950 border-r border-white/5 flex flex-col">
      <div className="p-8">
        <div className="flex flex-col">
          <span className="text-3xl font-black italic tracking-tighter text-[#ffaa00] uppercase leading-none">
            SPICY
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-black tracking-widest text-[#ffaa00]/40 uppercase">ADMIN</span>
            <div className="h-px bg-[#ffaa00]/10 flex-1" />
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link 
              key={item.id} 
              href={item.href}
              className={`flex items-center justify-between p-4 rounded-2xl transition-all group ${
                isActive 
                  ? 'bg-[#ffaa00] text-black font-black shadow-[0_0_20px_rgba(255,170,0,0.2)]' 
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-4">
                <Icon size={18} strokeWidth={isActive ? 3 : 2} />
                <span className="text-[11px] uppercase tracking-widest">{item.label}</span>
              </div>
              {isActive && <ChevronRight size={14} />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5">
         <Link href="/" className="flex items-center gap-4 p-4 text-white/20 hover:text-white transition-colors text-[10px] uppercase font-black tracking-widest">
            <LogOut size={16} />
            Exit Admin
         </Link>
      </div>
    </div>
  );
}
