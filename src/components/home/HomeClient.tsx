'use client';

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/routing";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Zap, Trophy, Radio, ChevronRight, Swords, Users, ChevronLeft, MessageSquare } from "lucide-react";
import { useLocale } from "next-intl";
import { useEffect, useState, useRef } from 'react';
import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import dynamic from 'next/dynamic';

// ── Lazy-load heavy/below-fold components ──────────────────────────────────
const ActivityFeed = dynamic(() => import('@/components/home/ActivityFeed'), { ssr: false });
const UpcomingCalendar = dynamic(() => import('@/components/home/UpcomingCalendar'), { ssr: false });

interface HomeClientProps {
  initialData?: {
    recentTeams: any[];
    liveTournaments: any[];
    scheduledTournaments: any[];
  };
}

export default function HomeClient({ initialData }: HomeClientProps) {
  const t = useTranslations("Index");
  const tc = useTranslations("Common");
  const ta = useTranslations("Activity");
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  const locale = useLocale();
  const arenaScrollRef = useRef<HTMLDivElement>(null);

  // ── Use server-fetched data, hydrate state once ──────────────────────────
  const [recentTeams, setRecentTeams] = useState<any[]>(initialData?.recentTeams || []);
  const [liveTournaments, setLiveTournaments] = useState<any[]>(initialData?.liveTournaments || []);
  const [scheduledTournaments, setScheduledTournaments] = useState<any[]>(initialData?.scheduledTournaments || []);

  // ── Derive liveMatch from live tournament ────────────────────────────────
  const liveMatch = (() => {
    const primary = liveTournaments[0];
    if (!primary) return null;
    const allRounds = primary.rounds ?? [];
    const latestRound = [...allRounds].sort((a: any, b: any) => b.round_number - a.round_number)[0];
    if (!latestRound) return null;
    return (
      latestRound.matches?.find((m: any) => m.status === 'ongoing') ??
      latestRound.matches?.find((m: any) => m.status === 'pending' && m.participant_a && m.participant_b) ??
      null
    );
  })();

  // ── Parallax (disabled — kept hooks to avoid order changes) ────────────
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 0]);
  const y2 = useTransform(scrollY, [0, 500], [0, 0]);

  useEffect(() => {
    setIsMounted(true);
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));

    // ── Only keep realtime for live match updates ────────────────────────
    const channel = supabase
      .channel('live-matches')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, async () => {
        const now = new Date().toISOString();
        const { data: inProgress } = await supabase
          .from('tournaments')
          .select(`
            id, name, status, scheduled_at,
            participants (id, name, logo_url),
            rounds (
              id, round_number,
              matches (
                id, status, score_a, score_b,
                participant_a:participants!participant_a_id(id, name, logo_url),
                participant_b:participants!participant_b_id(id, name, logo_url)
              )
            )
          `)
          .eq('status', 'in_progress')
          .order('created_at', { ascending: false });
        if (inProgress) setLiveTournaments(inProgress);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const scrollArena = (direction: 'left' | 'right') => {
    if (arenaScrollRef.current) {
      const { scrollLeft, clientWidth } = arenaScrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - 400 : scrollLeft + 400;
      arenaScrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-screen bg-black text-white selection:bg-[#ffaa00] selection:text-black overflow-x-hidden">

      {/* ─── LIVE TICKER BANNER ─── */}
      <AnimatePresence>
        {liveTournaments.length > 0 && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="fixed top-20 left-0 right-0 z-40 flex justify-center pointer-events-none"
          >
            <Link href={`/tournaments/${liveTournaments[0].id}`} className="pointer-events-auto">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="mx-4 flex items-center gap-3 bg-black/90 border border-[#ffaa00]/40 rounded-full px-5 py-2 shadow-[0_0_30px_rgba(255,170,0,0.15)] backdrop-blur-md cursor-pointer"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ffaa00] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ffaa00]" />
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#ffaa00]">{tc('live_now')}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/50 max-w-[140px] sm:max-w-xs break-words">
                  {liveTournaments[0].name}
                </span>
                {liveMatch?.participant_a && liveMatch?.participant_b && (
                  <>
                    <span className="hidden sm:block text-[10px] font-black uppercase text-white truncate max-w-[80px]">
                      {liveMatch.participant_a.name}
                    </span>
                    <Swords size={10} className="hidden sm:block text-[#ffaa00] shrink-0" />
                    <span className="hidden sm:block text-[10px] font-black uppercase text-white truncate max-w-[80px]">
                      {liveMatch.participant_b.name}
                    </span>
                  </>
                )}
                <ChevronRight size={12} className="text-[#ffaa00] shrink-0" />
              </motion.div>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative min-h-[100svh] flex flex-col items-center justify-center py-32 px-4 shadow-none">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <motion.div style={{ y: y2 }} className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Image src="/hero-bg.png" alt="Arena Background" fill priority className="object-cover opacity-30 scale-150 blur-[1px]" />
          </motion.div>
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/90 to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-transparent" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />

        </div>

        <motion.div style={{ y: y1 }} className="relative z-10 flex flex-col items-center text-center space-y-8 max-w-5xl">
          <div className="space-y-4">
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="px-6 py-2 bg-[#ff3333] rounded-full inline-block shadow-[0_0_40px_rgba(255,51,51,0.4)]">
              <span className="text-[10px] uppercase font-black tracking-[0.5em] text-white">{t("hero_badge")}</span>
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-8xl md:text-[11rem] font-black tracking-tighter leading-[0.85] uppercase italic">
              {t("hero_title_1")} <br /><span className="text-[#ffaa00]">{t("hero_title_2")}</span>
            </motion.h1>
          </div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="max-w-2xl text-xl md:text-2xl text-white/40 font-medium italic">
            {t("hero_subtitle")}
          </motion.p>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }} className="flex flex-wrap justify-center gap-4 sm:gap-6 pt-12">
            <Link href="/tournaments">
              <Button
                size="lg"
                className="h-14 sm:h-20 px-10 sm:px-16 rounded-full text-lg sm:text-2xl font-black uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 text-white relative overflow-hidden group"
                style={{
                  background: 'linear-gradient(145deg, rgba(224, 131, 9, 0.55) 0%, rgba(10,10,25,0.75) 60%, rgba(10,10,25,0.60) 100%)',
                  backdropFilter: 'blur(28px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(28px) saturate(180%)',
                  border: '1px solid rgba(236, 185, 16, 0.07)',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -1px 0 rgba(255,255,255,0.02)',
                }}
              >
                <span className="relative z-10">{tc("tournaments")}</span>
                <div className="absolute inset-0 bg-gradient-to-tr from-[#ffaa00]/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute top-0 left-6 right-6 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3) 50%, transparent)' }} />
              </Button>
            </Link>
            <a href="https://discord.gg/z86C3DXpKq" target="_blank" rel="noopener noreferrer">
              <Button
                size="lg"
                className="h-14 sm:h-20 px-10 sm:px-16 rounded-full text-lg sm:text-2xl font-black uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 text-white flex items-center gap-4 relative overflow-hidden group"
                style={{
                  background: 'linear-gradient(145deg, rgba(224, 131, 9, 0.55) 0%, rgba(10,10,25,0.75) 60%, rgba(10,10,25,0.60) 100%)',
                  backdropFilter: 'blur(28px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(28px) saturate(180%)',
                  border: '1px solid rgba(236, 185, 16, 0.07)',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -1px 0 rgba(255,255,255,0.02)',
                }}
              >
                <MessageSquare size={28} className="fill-white relative z-10" />
                <span className="relative z-10">Discord</span>
                <div className="absolute inset-0 bg-gradient-to-tr from-[#ffaa00]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute top-0 left-6 right-6 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3) 50%, transparent)' }} />
              </Button>
            </a>
          </motion.div>
        </motion.div>

        <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute bottom-8 md:bottom-12 flex flex-col items-center gap-4 opacity-70">
          <span className="text-[9px] uppercase font-black tracking-[0.3em] text-[#ffaa00] drop-shadow-[0_0_8px_rgba(255,170,0,0.5)]">{t("scroll_explore")}</span>
          <div className="w-px h-12 bg-gradient-to-b from-[#ffaa00] to-transparent" />
        </motion.div>
      </section>

      {/* ─── GLOBAL ACTIVITY FEED ─── */}
      <section className="relative z-10 px-4 mb-20">
        <ActivityFeed />
      </section>

      {/* ─── LIVE TOURNAMENT CARD ─── */}
      <AnimatePresence>
        {liveTournaments.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            className="relative z-10 px-4 sm:px-8 md:px-16 -mt-8 mb-16"
          >
            <Link href={`/tournaments/${liveTournaments[0].id}`}>
              <motion.div
                whileHover={{ scale: 1.01 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="relative overflow-hidden rounded-2xl border border-[#ffaa00]/30 bg-gradient-to-br from-[#ffaa00]/5 via-black to-black cursor-pointer group"
              >
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#ffaa00] to-transparent" />
                <div className="absolute bottom-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-[#ffaa00]/40 to-transparent" />
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#ffaa00]/5 rounded-full blur-3xl pointer-events-none" />

                <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ffaa00] opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#ffaa00]" />
                      </span>
                      <span className="text-[#ffaa00] text-[10px] font-black uppercase tracking-[0.4em]">{tc('live_tournament')}</span>
                    </div>
                    <h2 className="text-2xl sm:text-4xl font-black italic uppercase tracking-tighter text-white group-hover:text-[#ffaa00] transition-colors break-words leading-tight">
                      {liveTournaments[0].name}
                    </h2>
                    <div className="flex items-center gap-4 mt-2 text-[10px] font-bold uppercase tracking-widest text-white/30">
                      <span className="flex items-center gap-1.5">
                        <Users size={10} /> {tc('players', { count: liveTournaments[0].participants?.length ?? 0 })}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Radio size={10} className="text-[#ffaa00]" /> {tc('in_progress')}
                      </span>
                    </div>
                  </div>

                  {liveMatch?.participant_a && liveMatch?.participant_b && (
                    <div className="flex items-center gap-4 bg-white/[0.03] border border-white/5 rounded-xl px-6 py-4 shrink-0">
                      <div className="flex flex-col items-center gap-2 w-20 sm:w-28">
                        <div className="w-10 h-10 rounded-full bg-black border border-white/10 overflow-hidden flex items-center justify-center">
                          {liveMatch.participant_a.logo_url
                            ? <img src={liveMatch.participant_a.logo_url} className="w-full h-full object-contain" alt="" />
                            : <span className="font-black text-[#ffaa00] text-lg">{liveMatch.participant_a.name[0]}</span>
                          }
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-wider text-white text-center truncate w-full">{liveMatch.participant_a.name}</span>
                        {liveMatch.score_a != null && (
                          <span className="text-2xl font-black text-[#ffaa00]">{liveMatch.score_a}</span>
                        )}
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <Swords size={16} className="text-[#ffaa00]" />
                        <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">VS</span>
                      </div>
                      <div className="flex flex-col items-center gap-2 w-20 sm:w-28">
                        <div className="w-10 h-10 rounded-full bg-black border border-white/10 overflow-hidden flex items-center justify-center">
                          {liveMatch.participant_b.logo_url
                            ? <img src={liveMatch.participant_b.logo_url} className="w-full h-full object-contain" alt="" />
                            : <span className="font-black text-[#ffaa00] text-lg">{liveMatch.participant_b.name[0]}</span>
                          }
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-wider text-white text-center truncate w-full">{liveMatch.participant_b.name}</span>
                        {liveMatch.score_b != null && (
                          <span className="text-2xl font-black text-[#ffaa00]">{liveMatch.score_b}</span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="shrink-0 ml-auto group-hover:translate-x-1 sm:translate-x-0 transition-transform">
                    <div className="flex items-center gap-2 sm:gap-3 bg-white/[0.03] border border-white/10 group-hover:border-[#ffaa00]/40 rounded-xl sm:rounded-2xl px-4 py-3 sm:px-6 sm:py-4 transition-all group-hover:bg-[#ffaa00]/10">
                       <Trophy size={14} className="text-[#ffaa00] sm:w-[18px] sm:h-[18px]" />
                       <div className="flex flex-col items-start translate-y-0.5">
                          <span className="text-[#ffaa00] text-[10px] sm:text-xs font-black uppercase tracking-widest leading-none mb-0.5 sm:mb-1">{tc('view_bracket')}</span>
                          <span className="hidden sm:block text-[8px] text-white/20 uppercase font-black tracking-widest">{tc('real_time_update')}</span>
                       </div>
                       <ChevronRight size={12} className="text-[#ffaa00] sm:w-[16px] sm:h-[16px] ml-1 sm:ml-2" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </Link>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ─── ADDITIONAL LIVE ACTION GRID ─── */}
      <AnimatePresence>
         {liveTournaments.length > 1 && (
           <motion.section 
             initial={{ opacity: 0 }}
             whileInView={{ opacity: 1 }}
             viewport={{ once: true }}
             className="relative z-10 px-8 lg:px-16 mb-20"
           >
              <div className="flex items-center gap-4 mb-8">
                 <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/5" />
                 <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20">{tc('more_live_action')}</h2>
                 <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/5" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {liveTournaments.slice(1).map((tourney: any) => (
                  <Link key={tourney.id} href={`/tournaments/${tourney.id}`}>
                    <motion.div 
                      whileHover={{ y: -5 }}
                      className="p-6 bg-zinc-900/50 border border-white/5 rounded-[2rem] hover:border-[#ffaa00]/30 transition-all group"
                    >
                       <div className="flex justify-between items-start mb-4">
                          <div className="p-2 bg-white/5 rounded-xl text-[#ffaa00]">
                             <Trophy size={16} />
                          </div>
                          <div className="flex items-center gap-2 px-2 py-0.5 bg-[#ffaa00]/10 rounded border border-[#ffaa00]/20">
                             <div className="w-1 h-1 rounded-full bg-[#ffaa00] animate-pulse" />
                             <span className="text-[7px] font-black text-[#ffaa00] tracking-widest uppercase italic">{tc('live')}</span>
                          </div>
                       </div>
                       <h3 className="text-xl font-black uppercase italic tracking-tighter leading-tight group-hover:text-[#ffaa00] transition-colors mb-2">
                         {tourney.name}
                       </h3>
                       <div className="flex items-center justify-between text-[9px] font-bold text-white/20 uppercase tracking-widest">
                          <span>{tourney.participants?.length || 0} teams</span>
                          <span className="text-[#ffaa00]/40 group-hover:text-[#ffaa00] transition-colors">Enter Arena →</span>
                       </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
           </motion.section>
         )}
      </AnimatePresence>

      {/* Live Community Feed – teams marquee */}
      <section className="relative z-10 py-20 space-y-12">
        <div className="px-8 md:px-16 space-y-3">
          <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter gradient-text">{t("live_arena")}</h2>
          <p className="text-[9px] uppercase font-black tracking-[0.4em] text-white/20">{t("joined_table")}</p>
        </div>
        <div className="relative group/arena">
          {/* Navigation Buttons */}
          <div className="absolute -left-4 top-1/2 -translate-y-1/2 z-20 hidden md:flex items-center gap-2 opacity-0 group-hover/arena:opacity-100 transition-opacity pl-8">
            <button 
              onClick={() => scrollArena('left')}
              className="w-12 h-12 bg-black/80 border border-white/10 rounded-full flex items-center justify-center text-[#ffaa00] hover:bg-[#ffaa00] hover:text-black hover:border-[#ffaa00] transition-all shadow-2xl backdrop-blur-xl"
            >
              <ChevronLeft size={24} />
            </button>
          </div>
          <div className="absolute -right-4 top-1/2 -translate-y-1/2 z-20 hidden md:flex items-center gap-2 opacity-0 group-hover/arena:opacity-100 transition-opacity pr-8">
            <button 
              onClick={() => scrollArena('right')}
              className="w-12 h-12 bg-black/80 border border-white/10 rounded-full flex items-center justify-center text-[#ffaa00] hover:bg-[#ffaa00] hover:text-black hover:border-[#ffaa00] transition-all shadow-2xl backdrop-blur-xl"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          <div 
            ref={arenaScrollRef}
            className="w-full flex gap-5 overflow-x-auto pb-12 px-8 md:px-16 scrollbar-none snap-x snap-mandatory scroll-smooth group"
          >
            {/* Reduced from 4x to 2x duplication */}
            <div className="flex gap-5 shrink-0 animate-marquee hover:[animation-play-state:paused]">
              {[...recentTeams, ...recentTeams].map((team: any, i: number) => (
                <div key={`${team.id}-${i}`} className="w-36 h-48 sm:w-52 sm:h-64 bg-zinc-900 border border-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex flex-col items-center justify-between group/card hover:border-[#ffaa00]/40 transition-all hover:scale-105 shrink-0 transform-gpu snap-center">
                  <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-black border border-white/5 shadow-xl overflow-hidden flex items-center justify-center p-2 sm:p-2.5">
                    {team.logo_url
                      ? <img src={team.logo_url} className="w-full h-full object-contain" alt={team.name} loading="lazy" />
                      : <span className="text-xl sm:text-3xl font-black text-[#ffaa00]">{team.name[0]}</span>
                    }
                  </div>
                  <div className="text-center flex flex-col items-center w-full">
                    <h3 className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest truncate w-[90%]">{team.name}</h3>
                    <p className="text-[7px] sm:text-[8px] uppercase font-bold tracking-widest text-[#ffaa00] truncate w-[90%]">{team.tournaments?.name || ta('community_match')}</p>
                  </div>
                  <div className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-white/5 text-[6px] sm:text-[7px] font-black uppercase tracking-widest text-white/30" suppressHydrationWarning>
                    {isMounted ? tc('joined_at', { time: format(new Date(team.created_at), 'HH:mm') }) : '--:--'}
                  </div>
                </div>
              ))}
            </div>
            {recentTeams.length === 0 && (
              <div className="text-white/10 font-black uppercase text-lg italic tracking-tighter px-20">{t("waiting_challengers")}</div>
            )}
          </div>
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />
        </div>
      </section>

      <UpcomingCalendar tournaments={scheduledTournaments} locale={locale} user={user} />

      <footer className="relative z-10 border-t border-white/5 py-16 text-center text-white/20 text-[10px] font-black uppercase tracking-[0.5em]">
        Spicy Community <span className="text-primary">•</span> {t("footer_built")}
      </footer>
    </div>
  );
}
