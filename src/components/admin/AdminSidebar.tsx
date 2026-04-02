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

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function AdminSidebar() {
  const t = useTranslations('Admin');
  const pathname = usePathname();
  const supabase = createClient();
  const [role, setRole] = useState<string>('user');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('profiles').select('role').eq('id', user.id).single()
          .then(({ data }) => {
            if (data) setRole(data.role as string);
          });
      }
    });
  }, [supabase]);

  const allItems = [
    { id: 'dashboard', icon: LayoutDashboard, href: '/admin', label: t('dashboard') },
    { id: 'tournaments', icon: Trophy, href: '/admin/tournaments', label: t('tournaments') },
    { id: 'calendar', icon: Calendar, href: '/admin/calendar', label: t('calendar') },
    { id: 'teams', icon: Shield, href: '/admin/teams', label: t('teams') },
    { id: 'users', icon: Users, href: '/admin/users', label: t('users') },
    { id: 'settings', icon: Settings, href: '/admin/settings', label: t('settings') },
  ];

  const menuItems = allItems.filter(item => {
    if (role === 'moderator' && item.id === 'users') return false;
    return true;
  });

  return (
    <>
      {/* Mobile Horizontal Menu */}
      <div className="md:hidden flex items-center gap-2 overflow-x-auto w-full px-4 py-3 bg-zinc-950 border-b border-[#ffaa00]/10 shrink-0 no-scrollbar">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link 
              key={`mob-${item.id}`} 
              href={item.href}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                isActive 
                  ? 'bg-[#ffaa00] text-black font-black shadow-[0_0_15px_rgba(255,170,0,0.3)] italic' 
                  : 'text-white/40 hover:text-white bg-white/5 hover:bg-white/10'
              }`}
            >
              <Icon size={14} strokeWidth={isActive ? 3 : 2} />
              <span className="text-[9px] uppercase tracking-widest leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 h-full bg-zinc-950 border-r border-[#ffaa00]/10 flex-col shrink-0">
        <div className="p-8">
          <div className="flex flex-col">
            <span className="text-3xl font-black italic tracking-tighter text-[#ffaa00] uppercase leading-none">
              SPICY
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-black tracking-widest text-[#ffaa00]/40 uppercase flex-shrink-0">ADMIN</span>
              <div className="h-px bg-[#ffaa00]/10 flex-1" />
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link 
                key={item.id} 
                href={item.href}
                className={`flex items-center justify-between p-4 rounded-2xl transition-all group ${
                  isActive 
                    ? 'bg-[#ffaa00] text-black font-black shadow-[0_0_20px_rgba(255,170,0,0.2)] italic' 
                    : 'text-white/40 hover:text-[#ffaa00] hover:bg-[#ffaa00]/5'
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

        <div className="p-4 border-t border-[#ffaa00]/10">
           <Link href="/" className="flex items-center gap-4 p-4 text-red-500/50 hover:text-red-500 transition-colors text-[10px] uppercase font-black tracking-widest">
              <LogOut size={16} />
              Exit Admin
           </Link>
        </div>
      </div>
    </>
  );
}
