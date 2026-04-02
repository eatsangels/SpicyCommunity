'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Link } from '@/i18n/routing';
import { 
  Trophy, 
  Users, 
  Gamepad2, 
  ArrowUpRight, 
  Activity 
} from 'lucide-react';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

export default function AdminDashboard() {
  const t = useTranslations('Admin');
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState({
    totalTournaments: 0,
    activeUsers: 0,
    gamesToday: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      // 1. Total Tournaments
      const { count: tCount } = await supabase
        .from('tournaments')
        .select('*', { count: 'exact', head: true });

      // 2. Active Tournaments (In Progress)
      const { count: activeCount } = await supabase
        .from('tournaments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'in_progress');

      // 3. Match Count (Total matches played today)
      const today = new Date().toISOString().split('T')[0];
      const { count: mCount } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);

      // 4. Recent Activity
      const { data: recent } = await supabase
        .from('tournaments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      setStatsData({
        totalTournaments: tCount || 0,
        activeUsers: activeCount || 0,
        gamesToday: mCount || 0
      });
      setRecentActivity(recent || []);
      setLoading(false);
    };

    fetchStats();
  }, [supabase]);

  const stats = [
    { label: t('total_tournaments'), value: statsData.totalTournaments.toString(), icon: Trophy, color: 'text-[#ffaa00]', trend: '+100%' },
    { label: t('active_users'), value: statsData.activeUsers.toString(), icon: Users, color: 'text-blue-400', trend: 'Live' },
    { label: t('games_today'), value: statsData.gamesToday.toString(), icon: Gamepad2, color: 'text-[#ff3333]', trend: 'New' },
  ];

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-black uppercase italic tracking-tighter gradient-text">
            {t('overview')}
        </h1>
        <p className="text-[10px] uppercase font-black tracking-widest text-white/30">
            {t('stats_summary')}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-8 bg-zinc-900 border border-white/5 rounded-3xl space-y-4 group hover:border-[#ffaa00]/30 transition-all hover:translate-y-[-5px]"
            >
              <div className="flex justify-between items-start">
                <div className={`p-3 bg-white/5 rounded-2xl ${stat.color}`}>
                   <Icon size={24} />
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded-full">
                  {stat.trend} <ArrowUpRight size={10} />
                </div>
              </div>
              <div>
                <p className="text-[9px] uppercase font-black tracking-[0.2em] text-white/30">{stat.label}</p>
                <p className="text-4xl font-black mt-1 italic">{stat.value}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Activity Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
           <Activity size={18} className="text-[#ffaa00]" />
           <h2 className="text-xl font-black uppercase italic tracking-tight">{t('recent_activity')}</h2>
        </div>
        
        <div className="bg-zinc-900 border border-white/5 rounded-3xl overflow-hidden shadow-2xl min-h-[200px]">
          {loading ? (
             <div className="p-12 text-center opacity-20 text-[10px] font-black uppercase tracking-widest animate-pulse">Syncing Arena...</div>
          ) : recentActivity.length === 0 ? (
             <div className="p-12 text-center opacity-20 text-[10px] font-black uppercase tracking-widest">No recent glory found</div>
          ) : (
            recentActivity.map((tourney, i) => (
              <Link 
                key={tourney.id} 
                href={`/tournaments/${tourney.id}`}
                className="p-6 border-b border-white/5 last:border-0 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-6">
                   <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold text-[#ffaa00]">
                      {tourney.name.substring(0, 2).toUpperCase()}
                   </div>
                   <div>
                      <p className="text-[11px] font-bold">New Tournament: <span className="text-[#ffaa00]">{tourney.name}</span></p>
                      <p className="text-[9px] uppercase tracking-widest text-white/20 mt-1">
                        {new Date(tourney.created_at).toLocaleTimeString()}
                      </p>
                   </div>
                </div>
                <span className="text-[9px] uppercase font-black tracking-widest text-white/20 group-hover:text-[#ffaa00] transition-colors flex items-center gap-1">
                   {t('manage')} <ArrowUpRight size={10} />
                </span>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
