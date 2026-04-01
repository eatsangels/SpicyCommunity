'use client';

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/routing";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Zap, Trophy, Radio, ChevronRight, Swords, Users } from "lucide-react";
import { Lightning } from "@/components/ui/hero-odyssey";
import UpcomingCalendar from "@/components/home/UpcomingCalendar";
import { useLocale } from "next-intl";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function HomePage() {
  const t = useTranslations("Index");
  const tc = useTranslations("Common");
  const ta = useTranslations("Auth");
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, -100]);
  const y2 = useTransform(scrollY, [0, 500], [0, 60]);
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [recentTeams, setRecentTeams] = useState<any[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [liveTournament, setLiveTournament] = useState<any>(null);
  const [liveMatch, setLiveMatch] = useState<any>(null);
  const [scheduledTournaments, setScheduledTournaments] = useState<any[]>([]);
  const locale = useLocale();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));

    const fetchTeams = async () => {
      setLoadingTeams(true);
      const { data, error } = await supabase
        .from('participants')
        .select('*, tournaments(name)')
        .order('created_at', { ascending: false })
        .limit(12);
      if (!error) setRecentTeams(data || []);
      setLoadingTeams(false);
    };

    const fetchLiveTournament = async () => {
      // Try in_progress first, fallback to draft (active tournaments not yet started)
      let { data: tournament } = await supabase
        .from('tournaments')
        .select(`
          id, name, status,
          participants (id, name, logo_url),
          rounds (
            id, round_number,
            matches (
              id, status,
              score_a, score_b,
              participant_a:participants!participant_a_id(id, name, logo_url),
              participant_b:participants!participant_b_id(id, name, logo_url)
            )
          )
        `)
        .eq('status', 'in_progress')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Fallback: show any non-completed tournament
      if (!tournament) {
        const { data: fallback } = await supabase
          .from('tournaments')
          .select(`
            id, name, status,
            participants (id, name, logo_url),
            rounds (
              id, round_number,
              matches (
                id, status,
                score_a, score_b,
                participant_a:participants!participant_a_id(id, name, logo_url),
                participant_b:participants!participant_b_id(id, name, logo_url)
              )
            )
          `)
          .neq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        tournament = fallback;
      }

      if (tournament) {
        setLiveTournament(tournament);
        // Find the most recent ongoing or pending match in the latest round
        const allRounds = tournament.rounds ?? [];
        const latestRound = [...allRounds].sort((a: any, b: any) => b.round_number - a.round_number)[0];
        if (latestRound) {
          const activeMatch = latestRound.matches?.find((m: any) => m.status === 'ongoing')
            ?? latestRound.matches?.find((m: any) => m.status === 'pending' && m.participant_a && m.participant_b);
          setLiveMatch(activeMatch ?? null);
        }
      }
    };

    const fetchScheduledTournaments = async () => {
      const { data } = await supabase
        .from('tournaments')
        .select('*, participants(id, name)')
        .eq('status', 'scheduled')
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true });
      setScheduledTournaments(data || []);
    };

    fetchTeams();
    fetchLiveTournament();
    fetchScheduledTournaments();

    // Real-time subscription for matches
    const channel = supabase
      .channel('live-matches')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => {
        fetchLiveTournament();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.refresh();
  };

  return (
    <div className="relative min-h-screen bg-black text-white selection:bg-[#ffaa00] selection:text-black overflow-x-hidden">

      {/* ─── LIVE TICKER BANNER ─── */}
      <AnimatePresence>
        {liveTournament && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="fixed top-20 left-0 right-0 z-40 flex justify-center pointer-events-none"
          >
            <Link href={`/tournaments/${liveTournament.id}`} className="pointer-events-auto">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="mx-4 flex items-center gap-3 bg-black/90 border border-[#ffaa00]/40 rounded-full px-5 py-2 shadow-[0_0_30px_rgba(255,170,0,0.15)] backdrop-blur-md cursor-pointer"
              >
                {/* Pulsing dot */}
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ffaa00] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ffaa00]" />
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#ffaa00]">{tc('live_now')}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/50 max-w-[140px] sm:max-w-xs break-words">
                  {liveTournament.name}
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
      <section className="relative min-h-[110vh] flex flex-col items-center justify-center py-32 px-4 shadow-none">
        {/* Background */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <motion.div style={{ y: y2 }} className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Image src="/hero-bg.png" alt="Arena Background" fill priority className="object-cover opacity-30 scale-150 blur-[1px]" />
            <div className="relative w-[1000px] h-[1000px] opacity-10 blur-[2px] mix-blend-screen">
              <Image src="/logo.png" alt="Logo Watermark" fill sizes="1000px" className="object-contain" />
            </div>
          </motion.div>
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/90 to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-transparent" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
          {/* WebGL Lightning — red-orange hue matching the hero palette */}
          <div className="absolute inset-0 z-[1] mix-blend-screen opacity-80">
            <Lightning hue={10} xOffset={0} speed={1.3} intensity={0.5} size={2} />
          </div>
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
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }} className="flex flex-wrap justify-center gap-6 pt-12">
            <Link href="/tournaments">
              <Button size="lg" className="h-20 px-16 rounded-full text-2xl font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 bg-[#ffaa00] text-black hover:bg-[#ffaa00]/90 shadow-[0_0_60px_rgba(255,170,0,0.2)]">
                {tc("tournaments")}
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute bottom-10 flex flex-col items-center gap-4 opacity-10">
          <span className="text-[8px] uppercase font-black tracking-widest">{t("scroll_explore")}</span>
          <div className="w-px h-12 bg-white" />
        </motion.div>
      </section>

      {/* ─── LIVE TOURNAMENT CARD ─── */}
      <AnimatePresence>
        {liveTournament && (
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            className="relative z-10 px-4 sm:px-8 md:px-16 -mt-8 mb-16"
          >
            <Link href={`/tournaments/${liveTournament.id}`}>
              <motion.div
                whileHover={{ scale: 1.01 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="relative overflow-hidden rounded-2xl border border-[#ffaa00]/30 bg-gradient-to-br from-[#ffaa00]/5 via-black to-black cursor-pointer group"
              >
                {/* Header glow line */}
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#ffaa00] to-transparent" />
                {/* Bottom glow */}
                <div className="absolute bottom-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-[#ffaa00]/40 to-transparent" />
                {/* BG glow blob */}
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#ffaa00]/5 rounded-full blur-3xl pointer-events-none" />

                <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  {/* Left: Status + Title */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ffaa00] opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#ffaa00]" />
                      </span>
                      <span className="text-[#ffaa00] text-[10px] font-black uppercase tracking-[0.4em]">{tc('live_tournament')}</span>
                    </div>
                    <h2 className="text-2xl sm:text-4xl font-black italic uppercase tracking-tighter text-white group-hover:text-[#ffaa00] transition-colors break-words leading-tight">
                      {liveTournament.name}
                    </h2>
                    <div className="flex items-center gap-4 mt-2 text-[10px] font-bold uppercase tracking-widest text-white/30">
                      <span className="flex items-center gap-1.5">
                        <Users size={10} /> {tc('players', { count: liveTournament.participants?.length ?? 0 })}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Radio size={10} className="text-[#ffaa00]" /> {tc('in_progress')}
                      </span>
                    </div>
                  </div>

                  {/* Center: Current Match */}
                  {liveMatch?.participant_a && liveMatch?.participant_b ? (
                    <div className="flex items-center gap-4 bg-white/[0.03] border border-white/5 rounded-xl px-6 py-4 shrink-0">
                      {/* Player A */}
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

                      {/* VS */}
                      <div className="flex flex-col items-center gap-1">
                        <Swords size={16} className="text-[#ffaa00]" />
                        <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">VS</span>
                      </div>

                      {/* Player B */}
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
                  ) : (
                     <div className="flex items-center gap-2 bg-white/[0.03] border border-white/5 rounded-xl px-6 py-4 text-white/20 text-xs font-bold uppercase tracking-widest">
                       <Trophy size={14} /> {tc('view_bracket')}
                     </div>
                  )}

                  {/* Right: CTA */}
                  <div className="shrink-0 flex flex-col items-center sm:items-end gap-2">
                    <div className="flex items-center gap-2 text-[#ffaa00] text-[10px] font-black uppercase tracking-widest group-hover:gap-3 transition-all">
                      {tc('view_bracket')} <ChevronRight size={12} />
                    </div>
                    <span className="text-[8px] text-white/20 uppercase tracking-widest">{tc('real_time_update')}</span>
                  </div>
                </div>
              </motion.div>
            </Link>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Live Community Feed */}
      <section className="relative z-10 py-20 space-y-12">
        <div className="px-8 md:px-16 space-y-3">
          <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter gradient-text">{t("live_arena")}</h2>
          <p className="text-[9px] uppercase font-black tracking-[0.4em] text-white/20">{t("joined_table")}</p>
        </div>
        <div className="flex overflow-hidden gap-5 px-8 md:px-16 group">
          <motion.div className="flex gap-5 shrink-0" animate={{ x: [0, -1000] }} transition={{ duration: 45, repeat: Infinity, ease: "linear" }}>
            {[...recentTeams, ...recentTeams].map((team, i) => (
              <div key={`${team.id}-${i}`} className="w-36 h-48 sm:w-52 sm:h-64 bg-zinc-900 border border-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex flex-col items-center justify-between group/card hover:border-[#ffaa00]/40 transition-all hover:scale-105 shrink-0">
                <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-black border border-white/5 shadow-xl overflow-hidden flex items-center justify-center p-2 sm:p-2.5">
                  {team.logo_url
                    ? <img src={team.logo_url} className="w-full h-full object-contain" alt={team.name} />
                    : <span className="text-xl sm:text-3xl font-black text-[#ffaa00]">{team.name[0]}</span>
                  }
                </div>
                <div className="text-center space-y-1">
                  <h3 className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest truncate w-28 sm:w-40">{team.name}</h3>
                  <p className="text-[6px] sm:text-[8px] uppercase font-bold tracking-widest text-[#ffaa00] truncate max-w-[100px] sm:max-w-none">{team.tournaments?.name || 'Local Duel'}</p>
                </div>
                <div className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-white/5 text-[6px] sm:text-[7px] font-black uppercase tracking-widest text-white/30">
                  {tc('joined_at', { time: new Date(team.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })}
                </div>
              </div>
            ))}
            {recentTeams.length === 0 && !loadingTeams && (
              <div className="text-white/10 font-black uppercase text-lg italic tracking-tighter">{t("waiting_challengers")}</div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Upcoming Tournaments Calendar */}
      <UpcomingCalendar tournaments={scheduledTournaments} locale={locale} />

      <footer className="relative z-10 border-t border-white/5 py-16 text-center text-white/20 text-[10px] font-black uppercase tracking-[0.5em]">
        Spicy Community <span className="text-primary">•</span> {t("footer_built")}
      </footer>
    </div>
  );
}
