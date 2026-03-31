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
  Shield
} from 'lucide-react';

import Image from 'next/image';

export default function AdminSidebar() {
  const t = useTranslations('Admin');
  const pathname = usePathname();

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, href: '/admin', label: t('dashboard') },
    { id: 'tournaments', icon: Trophy, href: '/admin/tournaments', label: t('tournaments') },
    { id: 'teams', icon: Shield, href: '/admin/teams', label: t('teams') },
    { id: 'users', icon: Users, href: '/admin/users', label: t('users') },
    { id: 'settings', icon: Settings, href: '/admin/settings', label: t('settings') },
  ];

  return (
    <div className="w-64 h-full bg-zinc-950 border-r border-white/5 flex flex-col">
      <div className="p-8">
        <div className="text-xl font-black italic flex items-center gap-4">
            <div className="relative w-8 h-8 overflow-hidden rounded-lg bg-white/5 border border-white/10">
                <Image 
                  src="/logo.png" 
                  alt="Admin Logo" 
                  fill 
                  className="object-contain p-1"
                />
            </div>
            <span className="text-[#ffaa00]">ADMIN</span>
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
