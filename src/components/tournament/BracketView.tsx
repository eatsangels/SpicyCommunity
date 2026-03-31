'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import MatchNode from './MatchNode';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAlert } from '@/components/ui/UnoAlertSystem';
import { useTranslations } from 'next-intl';
import { Trophy, Users, Zap, Radio } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function BracketView({ tournament, isAdmin = false }: { tournament: any, isAdmin?: boolean }) {
  const { toast } = useAlert();
  const t = useTranslations('Tournament');
  const tc = useTranslations('Common');
  const tWinner = useTranslations('WinnerCard');
  const [data, setData] = useState(tournament);
  const [isFinishing, setIsFinishing] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const supabase = createClient();

  // ─── Supabase Realtime: auto-refresh bracket for all viewers ───
  const refreshTournament = useCallback(async () => {
    const { data: fresh } = await supabase
      .from('tournaments')
      .select(`
        *,
        participants (*),
        rounds (
          *,
          matches (
            *,
            participant_a:participants!participant_a_id(*),
            participant_b:participants!participant_b_id(*)
          )
        )
      `)
      .eq('id', tournament.id)
      .single();

    if (fresh) {
      setData(fresh);
      setLastUpdate(new Date());
    }
  }, [tournament.id, supabase]);

  useEffect(() => {
    // Strategy: postgres_changes (no filter = avoids RLS broadcast issues)
    // + polling every 5s as fallback guarantee for ALL viewers
    const channel = supabase
      .channel(`bracket-${tournament.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches' },
        (payload: any) => {
          // Only refresh if this match belongs to our tournament
          if (
            payload?.new?.tournament_id === tournament.id ||
            payload?.old?.tournament_id === tournament.id
          ) {
            refreshTournament();
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tournaments' },
        (payload: any) => {
          if (payload?.new?.id === tournament.id) {
            refreshTournament();
          }
        }
      )
      .subscribe((status) => {
        console.log('[Bracket Realtime]', status);
      });

    // Polling fallback: refresh every 5 seconds in case websocket events miss
    const poller = setInterval(() => {
      refreshTournament();
    }, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(poller);
    };
  }, [tournament.id, refreshTournament, supabase]);

  // Auto-Adjustment / Dual-Axis Scaling Logic
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!containerRef.current || !contentRef.current) return;

    const observer = new ResizeObserver(() => {
      const parent = containerRef.current;
      const content = contentRef.current;
      if (!parent || !content) return;

      const viewportWidth = parent.clientWidth;
      const viewportHeight = parent.clientHeight;
      
      content.style.transform = 'none';
      const actualWidth = content.scrollWidth;
      const actualHeight = content.scrollHeight;
      
      // Use 16px safety margin (2rem combined)
      const widthScale = (viewportWidth - 32) / actualWidth;
      const heightScale = (viewportHeight - 32) / actualHeight;
      
      const newScale = Math.min(1, widthScale, heightScale);
      setScale(newScale);
      content.style.transform = `scale(${newScale})`;
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [data]);

  const sortedRounds = [...(data.rounds || [])].sort((a: any, b: any) => a.round_number - b.round_number);
  const activeRound = sortedRounds.find((r: any) => 
    r.matches?.some((m: any) => m.status !== 'completed')
  ) || sortedRounds[sortedRounds.length - 1];
  
  const activeRoundId = activeRound?.id;
  const totalRounds = sortedRounds.length;
  const activeRoundIdx = sortedRounds.findIndex((r: any) => r.id === activeRoundId);
  let activeStageName = t('round', { number: activeRound?.round_number });
  if (activeRoundIdx === totalRounds - 1) activeStageName = t('final');
  else if (activeRoundIdx === totalRounds - 2) activeStageName = t('semifinal');

  const handleUpdateScore = async (matchId: string, scoreA: number, scoreB: number) => {
    setData((prev: any) => {
      const newData = { ...prev };
      newData.rounds = newData.rounds.map((r: any) => ({
        ...r,
        matches: r.matches.map((m: any) => 
          m.id === matchId ? { ...m, score_a: scoreA, score_b: scoreB } : m
        ),
      }));
      return newData;
    });
  };

  const handleSetWinner = async (matchId: string, winnerId: string) => {
    try {
      let score_a = 0, score_b = 0;
      data.rounds.forEach((r: any) => {
        const m = r.matches?.find((m: any) => m.id === matchId);
        if (m) { score_a = m.score_a; score_b = m.score_b; }
      });

      const resp = await fetch(`/api/matches/${matchId}/winner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winnerId, score_a, score_b })
      });
      if (resp.ok) {
        // Refresh data in-place — no page reload needed
        await refreshTournament();
      } else {
        const errorData = await resp.json();
        toast(errorData.error || t('alerts.error_advancing'), 'error');
      }
    } catch (error: any) {
       toast(error.message, 'error');
    }
  };

  const handleFinishMatch = async (matchId: string) => {
    let score_a = 0, score_b = 0, part_a = null, part_b = null;
    data.rounds.forEach((r: any) => {
      const m = r.matches?.find((m: any) => m.id === matchId);
      if (m) { score_a = m.score_a || 0; score_b = m.score_b || 0; part_a = m.participant_a_id; part_b = m.participant_b_id; }
    });
    if (score_a === score_b) { toast(t('alerts.same_score'), 'warning'); return; }
    const winnerId = score_a > score_b ? part_a : part_b;
    if (!winnerId) { toast(t('alerts.missing_participants'), 'warning'); return; }
    setIsFinishing(matchId);
    await handleSetWinner(matchId, winnerId);
    setIsFinishing(null);
  };

  const finalRound = sortedRounds[totalRounds - 1];
  const finalMatch = finalRound?.matches?.[0];
  const winner = (finalMatch?.winner_id && finalMatch?.status === 'completed') ? 
    (data.participants || []).find((p: any) => p.id === finalMatch.winner_id) : null;

  return (
    <div translate="no" className="fixed inset-0 bg-zinc-950 text-white selection:bg-[#ffaa00] flex flex-col pt-[88px] md:pt-[96px] p-2 md:p-4 overflow-hidden">
      {/* BACKGROUND DECOR */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
          <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-[#ff5555] blur-[150px] rounded-full" />
          <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] bg-[#ffaa00] blur-[150px] rounded-full" />
      </div>

      <div className="relative z-10 flex flex-col h-full overflow-hidden">
        {/* RESTORED LUXURY LIVE HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-end gap-1.5 border-b border-white/5 pb-2 shrink-0">
            <div className="flex flex-col gap-0 items-center md:items-start text-center md:text-left w-full md:w-auto">
                <div className="flex items-center gap-2 mb-1.5">
                    {data.status === 'in_progress' && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded backdrop-blur-md">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_#ef4444]" />
                            <span className="text-[7px] md:text-[8px] font-black text-red-500 uppercase tracking-tighter italic leading-none">{tc('live')}</span>
                        </div>
                    )}
                    <div className="px-1.5 py-0.5 bg-[#ff5555]/20 border border-[#ff5555]/40 text-[#ff5555] text-[6px] md:text-[7px] font-black uppercase tracking-widest rounded flex items-center gap-1.5 backdrop-blur-sm leading-none">
                        <Zap size={7} fill="currentColor" />
                        Uno Edition
                    </div>
                    <div className="flex items-center gap-1.5 px-1.5 py-0.5 bg-white/5 border border-white/10 rounded backdrop-blur-sm leading-none">
                        <Users size={7} className="text-[#ffaa00]" />
                        <span className="text-[6px] md:text-[7px] font-black text-white/40 uppercase tracking-widest leading-none">
                            {t('participants', { count: data.participants?.length || 0 })}
                        </span>
                    </div>
                </div>

                <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter uppercase italic leading-none gradient-text-luxury transition-all duration-500 flex items-center gap-3">
                    {data.name}
                    <div className="h-px w-12 md:w-24 bg-gradient-to-r from-white/20 to-transparent hidden md:block" />
                </h1>
                {/* Realtime indicator */}
                {lastUpdate && (
                  <motion.div
                    key={lastUpdate.toISOString()}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1.5 text-[8px] font-bold text-[#ffaa00]/60 uppercase tracking-widest"
                  >
                    <Radio size={8} className="text-[#ffaa00] animate-pulse" />
                    {tc('updated_at', { time: lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) })}
                  </motion.div>
                )}
            </div>
            
            <div className="flex gap-2 flex-wrap justify-center mb-1.5">
                {/* Status Pill */}
                <div className="glass-pill px-3 py-1 flex items-center gap-2 border border-white/10 bg-white/5 backdrop-blur-xl rounded-md transition-all">
                    <div className={cn(
                        "w-2 h-2 rounded-full",
                        data.status === 'completed' ? "bg-[#ffaa00]" : "bg-[#55aa55] shadow-[0_0_5px_#55aa55]"
                    )} />
                    <span className={cn("text-[10px] md:text-xs font-black uppercase tracking-tight leading-none", data.status === 'completed' ? "text-[#ffaa00]" : "text-white")}>
                        {data.status === 'completed' ? t('status.completed') : t('status.active')}
                    </span>
                </div>

                {/* Stage Pill */}
                <div className="glass-pill px-3 py-1 flex items-center gap-2 border border-white/10 bg-white/5 backdrop-blur-xl rounded-md transition-all">
                    <Trophy size={10} className="text-[#ffaa00]" />
                    <span className="text-[10px] md:text-xs font-black uppercase text-white/80 tracking-tight leading-none">{activeStageName}</span>
                </div>
            </div>
        </header>

        {/* BRACKET VIEWPORT */}
        <div ref={containerRef} className="flex-1 w-full overflow-hidden relative flex items-center justify-center">
          <div ref={contentRef} className="flex gap-10 md:gap-16 lg:gap-24 items-center justify-start transition-all duration-500 ease-out origin-center">
            {sortedRounds.map((round: any, rIdx: number) => {
              let roundName = `Round ${round.round_number}`;
              if (rIdx === totalRounds - 1) roundName = "Final";
              else if (rIdx === totalRounds - 2) roundName = "Semifinal";

              const copyMatches = [...(round.matches || [])].sort((a,b) => (a.created_at || '').localeCompare(b.created_at || ''));
              const groupedMatches: any[][] = [];
              const usedIds = new Set();
              copyMatches.forEach(m => {
                if (usedIds.has(m.id)) return;
                if (m.next_match_id) {
                  const pair = copyMatches.find(other => other.next_match_id === m.next_match_id && other.id !== m.id);
                  if (pair) { groupedMatches.push([m, pair].sort((a,b) => (a.created_at || '').localeCompare(b.created_at || ''))); usedIds.add(m.id); usedIds.add(pair.id); } 
                  else { groupedMatches.push([m]); usedIds.add(m.id); }
                } else { groupedMatches.push([m]); usedIds.add(m.id); }
              });

              const finalMatches = groupedMatches.flatMap(group => group.map((m, idx) => ({ ...m, isTop: idx === 0, groupSize: group.length })));

              return (
                <div key={round.id} className="flex flex-col gap-4 min-w-[210px] md:min-w-[240px]">
                  <div className="relative flex items-center justify-center -mb-3">
                      <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/5" />
                      <h2 className={cn("px-4 text-[9px] md:text-[10px] font-black tracking-[0.4em] uppercase italic transition-colors", round.id === activeRoundId ? "text-[#ffaa00]" : "text-white/20")}>
                        {roundName}
                      </h2>
                      <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/5" />
                  </div>
                  
                  <div className="flex flex-col relative shrink-0">
                    {finalMatches.map((match: any) => {
                      const BASE_CELL_HEIGHT = 115; 
                      const roundMultiplier = Math.pow(2, rIdx);
                      const cellHeight = BASE_CELL_HEIGHT * roundMultiplier;
                      const verticalShift = cellHeight / 2;
                      const winnerLineColor = (match.winner_id && match.winner_id === match.participant_a_id) ? '#ff5555' : 
                                              (match.winner_id && match.winner_id === match.participant_b_id) ? '#ffaa00' : 'rgba(255,255,255,0.05)';

                      return (
                        <div key={match.id} className="relative flex items-center justify-center shrink-0" style={{ height: cellHeight }}>
                            <MatchNode match={match} isAdmin={isAdmin} onUpdateScore={isAdmin ? handleUpdateScore : undefined} onFinishMatch={isAdmin ? handleFinishMatch : undefined} isFinishing={isFinishing === match.id} />
                            {rIdx < totalRounds - 1 && match.next_match_id && match.groupSize > 0 && (
                                <div className="absolute left-[calc(100%+0.5rem)] top-1/2 w-10 md:w-16 lg:w-24 pointer-events-none overflow-visible z-0">
                                    <svg className="w-full h-[400%] overflow-visible">
                                        <path d={match.isTop ? `M 0,0 H 25 V ${verticalShift} H 50` : `M 0,0 H 25 V -${verticalShift} H 50`} className="stroke-white/5 fill-none stroke-[2px] blur-sm opacity-50" />
                                        <path d={match.isTop ? `M 0,0 H 25 V ${verticalShift} H 50` : `M 0,0 H 25 V -${verticalShift} H 50`} className="stroke-white/10 fill-none stroke-[0.5px] stroke-round" />
                                        {match.winner_id && (
                                            <motion.path initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} d={match.isTop ? `M 0,0 H 25 V ${verticalShift} H 50` : `M 0,0 H 25 V -${verticalShift} H 50`} style={{ stroke: winnerLineColor }} className="fill-none stroke-[1.5px] filter drop-shadow-[0_0_8px_currentColor]" />
                                        )}
                                    </svg>
                                </div>
                            )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* GRAND CHAMPION CARD */}
            {winner && (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center min-w-[320px] md:min-w-[380px] relative self-center py-6" >
                <div className="absolute inset-0 bg-[#ffaa00]/10 blur-[60px] rounded-full animate-pulse" />
                <div className="relative z-10 uno-card border-2 border-[#ffaa00]/50 bg-gradient-to-b from-zinc-900 to-black p-8 flex flex-col items-center text-center shadow-[0_0_40px_rgba(255,170,0,0.15)] min-h-[450px] rounded-xl">
                    <div className="absolute top-3 right-3">
                        <div className="w-10 h-10 rounded-full bg-[#ffaa00] flex items-center justify-center text-black font-black italic shadow-lg rotate-12 text-[12px]">W</div>
                    </div>
                    <motion.div animate={{ y: [0, -8, 0], rotate: [-0.5, 0.5, -0.5] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} className="relative w-48 h-48 mb-6 mt-1" >
                        <img src="/tourney_winner_trophy_uno.png" alt="Grand Trophy" className="w-full h-full object-contain filter drop-shadow-[0_0_20px_#ffaa00]" />
                    </motion.div>
                    <div className="space-y-1.5 mb-6">
                        <p className="text-[#ffaa00] text-[10px] font-black uppercase tracking-[0.3em] italic leading-tight">{tWinner('title')}</p>
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-black uppercase italic tracking-tighter gradient-text-luxury leading-none">{winner.name}</h2>
                    </div>
                    {winner.logo_url && (
                        <div className="w-20 h-20 rounded-xl bg-white/5 border border-white/10 overflow-hidden mb-6 p-3 shadow-lg">
                            <img src={winner.logo_url} alt={winner.name} className="w-full h-full object-contain" />
                        </div>
                    )}
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-[#ffaa00]/20 to-transparent mb-6" />
                    <div className="space-y-1.5">
                        <p className="text-white text-[11px] font-black uppercase tracking-[0.2em] italic leading-tight">{tWinner('congrats')}</p>
                        <p className="text-white/20 text-[9px] font-bold uppercase tracking-widest">{tWinner('description')}</p>
                    </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .gradient-text-luxury {
          background: linear-gradient(135deg, #fff 10%, #ffaa00 40%, #ff5555 60%, #5555ff 90%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          background-size: 200% auto;
          animation: shine 10s linear infinite;
        }
        @keyframes shine {
          to { background-position: 200% center; }
        }
        .glass-pill {
          box-shadow: 0 4px 16px -1px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
}
