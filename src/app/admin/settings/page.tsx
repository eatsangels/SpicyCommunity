'use client';

import { useTranslations } from 'next-intl';
import { 
  Settings, 
  Globe, 
  Lock, 
  Database,
  Bell,
  Eye,
  Save,
  Trophy,
  History
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminSettingsPage() {
  const t = useTranslations('Admin');

  return (
    <div className="space-y-12 max-w-4xl">
      <div className="space-y-2">
        <div className="flex items-center gap-3 text-[#ffaa00]">
          <Settings size={24} />
          <h1 className="text-4xl font-black uppercase italic tracking-tighter">{t('settings')}</h1>
        </div>
        <p className="text-[10px] uppercase font-black tracking-[0.4em] text-white/30">Platform Global Configurations</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Settings Groups */}
        {[
          { icon: Globe, title: "Public Interface", desc: "Manage how guest users see the arena." },
          { icon: Trophy, title: "Tournament Defaults", desc: "Set default rules for new single elimination brackets." },
          { icon: Lock, title: "Security & RLS", desc: "Configure row-level security and ownership rules." },
          { icon: Database, title: "Database Sync", desc: "Force re-indexing of matches and participant logos." }
        ].map((group, i) => (
          <div key={i} className="group p-8 bg-zinc-900/50 border border-white/5 rounded-[2.5rem] flex items-center justify-between hover:bg-white/[0.02] transition-colors overflow-hidden relative">
             <div className="flex items-center gap-8 relative z-10">
                <div className="w-16 h-16 bg-black rounded-3xl flex items-center justify-center text-[#ffaa00] border border-white/5 group-hover:border-[#ffaa00]/40 transition-all">
                   <group.icon size={28} />
                </div>
                <div>
                   <h3 className="text-xl font-black uppercase italic tracking-tight">{group.title}</h3>
                   <p className="text-[11px] font-medium text-white/30">{group.desc}</p>
                </div>
             </div>

             <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-6 bg-white/5 rounded-full relative cursor-pointer group-hover:bg-white/10 transition-colors">
                   <div className="absolute right-1 top-1 w-4 h-4 bg-[#ffaa00] rounded-full shadow-[0_0_10px_rgba(255,170,0,0.5)]" />
                </div>
                <button className="p-3 text-white/10 hover:text-white transition-colors">
                   <Save size={20} />
                </button>
             </div>
             
             {/* Decor */}
             <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-[#ffaa00]/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ))}
      </div>

      <div className="pt-8 border-t border-white/5 flex gap-4">
         <Button className="h-14 px-8 bg-[#ffaa00] text-black font-black uppercase tracking-widest rounded-2xl hover:bg-[#ffaa00]/90">
            Apply All Changes
         </Button>
         <Button variant="ghost" className="h-14 px-8 text-white/20 font-black uppercase tracking-widest hover:text-white">
            Reset to Defaults
         </Button>
      </div>
    </div>
  );
}
