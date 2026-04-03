'use client';

import { useEffect, useState, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Users, Zap, Bell, Swords, ChevronDown, Crown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Database } from '@/types/database.types';
import { useTranslations } from 'next-intl';

type ActivityLog = Database['public']['Tables']['activity_log']['Row'];

interface ActivityItem extends Omit<ActivityLog, 'type' | 'payload'> {
  type: 'tournament_created' | 'participant_joined' | 'match_won' | 'tournament_champion';
  payload: any;
}

function TeamAvatar({ name, logo, highlight }: { name: string; logo?: string; highlight?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1 w-14">
      <div
        className={`w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center shrink-0 shadow-lg border transition-all ${
          highlight
            ? 'border-[#ffaa00]/60 ring-1 ring-[#ffaa00]/20 bg-black/60'
            : 'border-white/10 opacity-90 bg-black/60'
        }`}
      >
        {logo
          ? <img src={logo} alt={name} className={`w-full h-full object-contain ${!highlight ? 'grayscale opacity-60' : ''}`} />
          : <span className={`text-sm font-black ${highlight ? 'text-[#ffaa00]' : 'text-white/30'}`}>{name?.[0]?.toUpperCase() ?? '?'}</span>
        }
      </div>
      <span className={`text-[9px] font-black uppercase tracking-wider text-center truncate w-full ${highlight ? 'text-[#ffaa00]' : 'text-white/30'}`}>
        {name}
      </span>
    </div>
  );
}

export default function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const supabase = createClient();
  const t = useTranslations('Activity');

  useEffect(() => {
    const fetchInitialActivities = async () => {
      const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (data) setActivities(data as unknown as ActivityItem[]);
      if (error) console.error('Error fetching activities:', error);
    };

    fetchInitialActivities();

    const channel = supabase
      .channel('activity-log-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_log' }, (payload) => {
        setActivities((prev) => [payload.new as ActivityItem, ...prev].slice(0, 20));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'tournament_created':  return <Trophy className="text-[#ffaa00]" size={15} />;
      case 'participant_joined':  return <Users className="text-blue-300" size={15} />;
      case 'match_won':           return <Swords className="text-[#ffaa00]" size={15} />;
      case 'tournament_champion': return <Crown className="text-yellow-300" size={15} />;
      default:                    return <Bell className="text-white/40" size={15} />;
    }
  };

  const renderContent = (activity: ActivityItem) => {
    const { type, payload } = activity;
    if (!payload) return <p className="text-xs text-white/40">{t('waiting')}</p>;
    const tournamentName = payload.tournament_name || t('community_match');

    try {
      switch (type) {
        case 'tournament_created':
          return (
            <p className="text-xs font-medium text-white/80 leading-snug">
              {t.rich('tournament_created', {
                name: (chunks: ReactNode) => <span className="text-[#ffaa00] font-bold">{payload.name}</span>
              })}
            </p>
          );

        case 'participant_joined':
          return (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                {payload.logo_url
                  ? <img src={payload.logo_url} alt={payload.name} className="w-full h-full object-contain" />
                  : <span className="text-[10px] font-black text-blue-300">{payload.name?.[0]?.toUpperCase() ?? '?'}</span>
                }
              </div>
              <p className="text-xs font-medium text-white/80 leading-snug">
                {t.rich('participant_joined', {
                  name: (chunks: ReactNode) => <span className="text-blue-300 font-bold">{payload.name}</span>,
                  tournament: (chunks: ReactNode) => <span className="text-white/50">{tournamentName}</span>
                })}
              </p>
            </div>
          );

        case 'match_won':
          return (
            <div className="w-full">
              <p className="text-[9px] uppercase font-bold tracking-widest text-white/25 mb-2">
                Round {payload.round_number} &bull; <span className="text-[#ffaa00]/40">{tournamentName}</span>
              </p>
              <div className="flex items-center justify-between gap-1">
                <TeamAvatar name={payload.winner_name} logo={payload.winner_logo} highlight />
                <div className="flex flex-col items-center gap-0.5 shrink-0 pb-3">
                  <Swords size={13} className="text-[#ffaa00]/80" />
                  <span className="text-[7px] font-black uppercase tracking-widest text-white/20">beat</span>
                </div>
                {payload.loser_name && (
                  <TeamAvatar name={payload.loser_name} logo={payload.loser_logo} highlight={false} />
                )}
              </div>
            </div>
          );

        case 'tournament_champion':
          return (
            <div className="w-full">
              <p className="text-[9px] uppercase font-bold tracking-widest text-yellow-300/60 mb-2">
                {t('tournament_champion')} &bull; <span className="text-white/25">{payload.tournament_name}</span>
              </p>
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <div
                    className="w-11 h-11 rounded-xl overflow-hidden flex items-center justify-center border border-yellow-300/40 ring-1 ring-yellow-300/10"
                    style={{ boxShadow: '0 0 18px rgba(253,224,71,0.15)' }}
                  >
                    {payload.champion_logo
                      ? <img src={payload.champion_logo} alt={payload.champion_name} className="w-full h-full object-contain" />
                      : <span className="text-lg font-black text-yellow-300">{payload.champion_name?.[0]?.toUpperCase() ?? '🏆'}</span>
                    }
                  </div>
                  <div className="absolute -top-2 -right-2 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center shadow-md">
                    <Crown size={9} className="text-black" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-yellow-300 truncate leading-tight">{payload.champion_name}</p>
                  <p className="text-[10px] text-white/40 font-medium mt-0.5">Congratulations, Champion! 🎉</p>
                </div>
              </div>
            </div>
          );

        default:
          return <p className="text-xs text-white/40">{t('waiting')}</p>;
      }
    } catch (e) {
      return <p className="text-xs text-white/40">Broadcasting live activity...</p>;
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* ── Liquid Glass Panel ── */}
      <div
        className="relative rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, rgba(224, 131, 9, 0.55) 0%, rgba(10,10,25,0.75) 60%, rgba(10,10,25,0.60) 100%)',
          backdropFilter: 'blur(28px) saturate(180%)',
          WebkitBackdropFilter: 'blur(28px) saturate(180%)',
          border: '1px solid rgba(236, 185, 16, 0.07)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -1px 0 rgba(255,255,255,0.02)',
        }}
      >
        {/* Specular highlight strip at top */}
        <div
          className="absolute top-0 left-4 right-4 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5) 40%, rgba(255,255,255,0.5) 60%, transparent)' }}
        />
        {/* Inner light refraction */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 30% 0%, rgba(255,255,255,0.07) 0%, transparent 60%)' }}
        />

        <div className="relative p-5">
          {/* ── Toggle Header ── */}
          <button
            onClick={() => setIsOpen((prev) => !prev)}
            className="flex items-center gap-3 mb-5 w-full group cursor-pointer"
          >
            {/* Live dot */}
            <div className="relative flex h-2.5 w-2.5 shrink-0">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ffaa00] opacity-60 ${!isOpen ? 'opacity-0' : ''}`} />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#ffaa00] shadow-[0_0_8px_rgba(255,170,0,0.8)]" />
            </div>

            <h2 className="text-[11px] font-black uppercase tracking-[0.35em] text-white/50 group-hover:text-white/80 transition-colors flex-1 text-left">
              {t('live_feed')}
            </h2>

            <motion.div
              animate={{ rotate: isOpen ? 0 : -90 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="text-white/25 group-hover:text-white/60 transition-colors"
            >
              <ChevronDown size={14} />
            </motion.div>
          </button>

          {/* ── Collapsible Body ── */}
          <AnimatePresence initial={false}>
            {isOpen && (
              <motion.div
                key="feed-body"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div
                  className="space-y-2 overflow-y-auto max-h-[480px] scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                  style={{
                    maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
                  }}
                >
                  <AnimatePresence initial={false}>
                    {activities.length > 0 ? (
                      activities.map((activity) => (
                        <motion.div
                          key={activity.id}
                          initial={{ opacity: 0, y: -12, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.18 } }}
                          layout
                          className="group relative flex items-start gap-3 p-3 rounded-2xl transition-all duration-200"
                          style={{
                            background: 'linear-gradient(135deg, rgba(10,10,25,0.50) 0%, rgba(10,10,25,0.70) 100%)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.07)',
                          }}
                          whileHover={{
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.11) 0%, rgba(255,255,255,0.05) 100%)',
                          } as any}
                        >
                          {/* Icon bubble */}
                          <div
                            className="mt-0.5 p-2 rounded-xl shrink-0"
                            style={{
                              background: 'rgba(10,10,25,0.50)',
                              border: '1px solid rgba(255,255,255,0.07)',
                              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
                            }}
                          >
                            {getIcon(activity.type)}
                          </div>

                          <div className="flex-1 min-w-0 space-y-1">
                            {renderContent(activity)}
                            <span className="text-[9px] uppercase font-bold tracking-widest text-white/20">
                              {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: enUS })}
                            </span>
                          </div>

                          {/* Hover zap */}
                          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Zap size={9} className="text-[#ffaa00]/60 animate-pulse" />
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <Zap className="text-white/10 mb-3 animate-pulse" size={28} />
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/20 italic">{t('waiting')}</p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>

                {activities.length > 5 && (
                  <p className="mt-3 text-center text-[8px] font-black uppercase tracking-[0.3em] text-white/20 animate-bounce">
                    Scroll for more
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom specular edge */}
        <div
          className="absolute bottom-0 left-6 right-6 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08) 50%, transparent)' }}
        />
      </div>
    </div>
  );
}
