'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import MatchNode from './MatchNode';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAlert } from '@/components/ui/UnoAlertSystem';
import { useTranslations, useLocale } from 'next-intl';
import { Trophy, Users, Zap, Radio, ChevronLeft, ChevronRight, Download, Plus, Minus, RotateCcw, Maximize, Ban } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function BracketView({ tournament, isAdmin = false }: { tournament: any, isAdmin?: boolean }) {
  const { toast } = useAlert();
  const t = useTranslations('Tournament');
  const tc = useTranslations('Common');
  const tWinner = useTranslations('WinnerCard');
  const locale = useLocale();
  const [data, setData] = useState(tournament);
  const [isFinishing, setIsFinishing] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const syncTimers = useRef<Record<string, any>>({});
  const isEditing = useRef<Set<string>>(new Set());
  const bracketRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showWinnerCard, setShowWinnerCard] = useState(true);

  const downloadBracket = async () => {
    if (!bracketRef.current) return;
    setIsDownloading(true);
    
    try {
      const { toPng } = await import('html-to-image');
      
      // 1. Create a deep clone for normalized capture
      const original = bracketRef.current;
      const clone = original.cloneNode(true) as HTMLElement;
      
      // 2. Prepare the sandbox container (off-screen)
      const sandbox = document.createElement('div');
      sandbox.style.position = 'fixed';
      sandbox.style.left = '-9999px';
      sandbox.style.top = '0';
      sandbox.style.width = 'max-content';
      sandbox.style.height = 'max-content';
      sandbox.style.background = '#09090b';
      sandbox.style.padding = '80px';
      sandbox.className = 'bracket-capture-sandbox';
      
      // 3. Attach clone to sandbox
      sandbox.appendChild(clone);
      document.body.appendChild(sandbox);

      // 4. Reset scale and layout of the clone to capture everything side-by-side
      clone.style.width = 'max-content';
      clone.style.height = 'max-content';
      clone.style.display = 'inline-block'; // Shrink-wrap content
      clone.style.backgroundColor = '#09090b';

      const viewport = clone.querySelector('.motion-viewport') as HTMLElement;
      if (viewport) {
        viewport.style.transform = 'none';
        viewport.style.position = 'relative';
        viewport.style.width = 'max-content';
        viewport.style.height = 'max-content';
        viewport.style.display = 'flex';
        viewport.style.justifyContent = 'flex-start';
        viewport.style.alignItems = 'center';
        viewport.style.padding = '0'; 
      }

      const container = clone.querySelector('.container-viewport') as HTMLElement;
      if (container) {
        container.style.overflow = 'visible';
        container.style.width = 'max-content'; // Ensure it doesn't stretch to full screen
        container.style.height = 'auto';
        container.style.display = 'block';
        container.style.flex = '0 0 auto';
      }

      // CREATE A CLEAN SIDE-BY-SIDE WRAPPER (Bracket | Winner Card)
      const contentWrapper = document.createElement('div');
      contentWrapper.style.display = 'flex';
      contentWrapper.style.flexDirection = 'row';
      contentWrapper.style.alignItems = 'center';
      contentWrapper.style.gap = '100px';
      contentWrapper.style.marginTop = '60px'; // Space from header
      
      const winnerCard = clone.querySelector('.winner-card-export') as HTMLElement;
      if (winnerCard && container) {
        // Move container and winnerCard into the new wrapper
        const parent = container.parentElement;
        if (parent) {
          parent.appendChild(contentWrapper);
          contentWrapper.appendChild(container);
          
          // Reposition winner card
          winnerCard.style.position = 'relative'; 
          winnerCard.style.top = '0';
          winnerCard.style.left = '0';
          winnerCard.style.transform = 'none';
          winnerCard.style.margin = '0';
          winnerCard.style.display = 'block'; 
          winnerCard.style.flexShrink = '0';
          winnerCard.style.width = '420px';
          winnerCard.style.opacity = '1';
          winnerCard.style.animation = 'none';
          winnerCard.style.transition = 'none';
          
          contentWrapper.appendChild(winnerCard);
        }
      }

      // Hide other interactive UI
      clone.querySelectorAll('[id="zoom-controls"], .zoom-controls, button, .glass-pill').forEach((el: any) => {
         el.style.display = 'none';
      });

      // Header normalization for perfectly sharp tournament name
      const header = clone.querySelector('header') as HTMLElement;
      if (header) {
        header.style.width = 'max-content';
        header.style.display = 'flex';
        header.style.flexDirection = 'column';
        header.style.alignItems = 'flex-start';
        header.style.justifyContent = 'flex-start';
        header.style.paddingBottom = '30px';
        header.style.borderBottom = '2px solid rgba(255,255,255,0.05)';
        header.style.marginBottom = '20px';
        
        // Target the Title specifically for PRO Style
        const title = header.querySelector('h1') as HTMLElement;
        if (title) {
          title.style.lineHeight = '1.2';
          title.style.paddingTop = '20px';
          title.style.paddingBottom = '10px';
          title.style.marginBottom = '0';
          title.style.whiteSpace = 'nowrap';
          title.style.overflow = 'visible';
          title.style.fontWeight = '900';
          title.style.fontStyle = 'italic';
          title.style.display = 'flex';
          title.style.alignItems = 'center';
          title.style.gap = '15px';
          
          // Split for Dual Gradient (Brand Style)
          const nameText = title.innerText.trim();
          const parts = nameText.split(' ');
          if (parts.length >= 2) {
            const firstPart = parts[0].toUpperCase();
            const restPart = parts.slice(1).join(' ').toUpperCase();
            
            title.innerHTML = `
              <span style="
                background: linear-gradient(to right, #818cf8, #c084fc, #e879f9);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                display: inline-block;
              ">${firstPart}</span>
              <span style="
                background: linear-gradient(to right, #fbbf24, #f59e0b, #ea580c);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                display: inline-block;
              ">${restPart}</span>
            `;
          } else {
            title.style.background = 'linear-gradient(to right, #818cf8, #fbbf24)';
            title.style.webkitBackgroundClip = 'text';
            title.style.webkitTextFillColor = 'transparent';
          }
        }

        // Target the Metadata (Live/Teams badge)
        const badges = header.querySelector('.flex.items-center.gap-2') as HTMLElement;
        if (badges) {
          badges.style.marginTop = '10px';
          badges.style.opacity = '0.9';
        }
      }

      // Final cleanup of styles that break captures
      clone.querySelectorAll('[class*="backdrop-blur"]').forEach((el: any) => {
        el.style.backdropFilter = 'none';
        el.style.webkitBackdropFilter = 'none';
        el.style.backgroundColor = 'rgba(24, 24, 27, 0.98)';
      });

      clone.querySelectorAll('*').forEach((el: any) => {
        el.style.animationPlayState = 'paused';
        el.style.transition = 'none';
      });

      // 5. Capture the normalized clone
      await new Promise(resolve => setTimeout(resolve, 800)); // More time for layout to settle

      const dataUrl = await toPng(clone, {
        pixelRatio: 2,
        backgroundColor: '#09090b',
        skipFonts: false,
      });

      // 6. Finish & Download
      const link = document.createElement('a');
      link.download = `${data.name.replace(/\s+/g, '_')}_bracket.png`;
      link.href = dataUrl;
      link.click();

      // 7. Cleanup sandbox
      document.body.removeChild(sandbox);
    } catch (e) {
      console.error('Download failed:', e);
      toast(t('alerts.download_error') || 'Error downloading image', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

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
            participant_b:participants!participant_b_id(*),
            box_score
          )
        )
      `)
      .eq('id', tournament.id)
      .single();

    if (fresh) {
      setData((prev: any) => {
        if (!prev) return fresh;
        // Merge fresh data but keep local versions of matches currently being edited
        const merged = { ...fresh };
        if (merged.rounds) {
          merged.rounds = merged.rounds.map((fr: any) => {
            const prevRound = prev.rounds?.find((pr: any) => pr.id === fr.id);
            return {
              ...fr,
              matches: fr.matches?.map((fm: any) => {
                if (isEditing.current.has(fm.id)) {
                  const localMatch = prevRound?.matches?.find((pm: any) => pm.id === fm.id);
                  return localMatch || fm;
                }
                return fm;
              })
            };
          });
        }
        return merged;
      });
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

  // ─── Zoom & Pan Handlers ───
  const handleAutoFit = useCallback(() => {
    if (!containerRef.current || !contentRef.current) return;
    
    // Use requestAnimationFrame to ensure children are rendered and measured
    requestAnimationFrame(() => {
      const container = containerRef.current!.getBoundingClientRect();
      const content = contentRef.current!.getBoundingClientRect();
      
      // Calculate raw content size (before zoom)
      // Since motion.div is scaled, content.width is already zoomed
      const currentZoom = zoom; // Capture current zoom
      const rawWidth = content.width / currentZoom;
      const rawHeight = content.height / currentZoom;
      
      if (rawWidth === 0 || rawHeight === 0) return;

      const padding = 60; 
      const availableWidth = container.width - padding * 2;
      const availableHeight = container.height - padding * 2;
      
      const scaleX = availableWidth / rawWidth;
      const scaleY = availableHeight / rawHeight;
      
      // Target zoom: fit the smaller dimension, but cap at 1.0 (don't over-zoom small brackets)
      let newZoom = Math.min(scaleX, scaleY);
      if (newZoom > 1) newZoom = 1;
      if (newZoom < 0.2) newZoom = 0.2; // Cap minimum zoom

      setZoom(newZoom);
      setOffset({ x: 0, y: 0 }); // Center origin
    });
  }, [zoom]);

  // Initial Auto-Fit
  const hasAutoFitted = useRef(false);
  useEffect(() => {
    if (data.rounds?.length > 0 && !hasAutoFitted.current) {
      // Small delay to ensure layout has settled
      const timer = setTimeout(() => {
        handleAutoFit();
        hasAutoFitted.current = true;
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [data.rounds, handleAutoFit]);

  const handleZoom = (delta: number) => {
    setZoom(prev => Math.min(Math.max(0.1, prev + delta), 3));
  };

  const resetView = () => {
    handleAutoFit();
  };

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

  const handleUpdateScore = async (matchId: string, scoreA: number, scoreB: number, boxScore?: any[]) => {
    // 1. Update local state immediately
    setData((prev: any) => {
      const newData = { ...prev };
      newData.rounds = newData.rounds.map((r: any) => ({
        ...r,
        matches: r.matches.map((m: any) => 
          m.id === matchId ? { ...m, score_a: scoreA, score_b: scoreB, box_score: boxScore } : m
        ),
      }));
      return newData;
    });

    // 2. Mark as being edited to prevent refresh-overwrite
    isEditing.current.add(matchId);

    // 3. Debounce the server update
    if (syncTimers.current[matchId]) {
      clearTimeout(syncTimers.current[matchId]);
    }

    syncTimers.current[matchId] = setTimeout(async () => {
      try {
        const resp = await fetch(`/api/matches/${matchId}/score`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ score_a: scoreA, score_b: scoreB, box_score: boxScore })
        });
        
        if (!resp.ok) throw new Error('Sync failed');
        
        // Success: allow local state to be updated by remote next time
        // We wait a bit (2s) to ensure the server update has propagated to the poller's next cycle
        setTimeout(() => {
          isEditing.current.delete(matchId);
        }, 2000);
      } catch (error) {
        console.error('Score sync error:', error);
        toast('Error syncing score', 'error');
        // On error, let the next refresh restore the server value
        isEditing.current.delete(matchId);
      }
    }, 1000);
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

  const handleResetMatch = async (matchId: string) => {
    const confirmed = await confirm(t('alerts.confirm_reset'));
    if (!confirmed) return;

    setIsResetting(matchId);
    try {
      const resp = await fetch(`/api/matches/${matchId}/reset`, {
        method: 'POST',
      });
      
      if (resp.ok) {
        toast(t('alerts.match_reset_success') || 'Match reset successfully', 'success');
        await refreshTournament();
      } else {
        const errorData = await resp.json();
        toast(errorData.error || t('alerts.error_resetting'), 'error');
      }
    } catch (error: any) {
      toast(error.message, 'error');
    } finally {
      setIsResetting(null);
      refreshTournament();
    }
  };
  
  const handleDisqualifyParticipant = async (matchId: string, participantId: string, participantName: string) => {
    const confirmed = await confirm(`${t('disqualify_confirm').replace('{name}', participantName)}`);
    if (!confirmed) return;

    setIsResetting(matchId);
    try {
      const response = await fetch(`/api/matches/${matchId}/disqualify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disqualifiedId: participantId }),
      });

      if (response.ok) {
        toast(t('alerts.disqualify_success') || 'Participant disqualified successfully.', 'success');
      } else {
        toast(t('alerts.error_resetting'), 'error');
      }
    } catch (error) {
      toast(t('alerts.error_resetting'), 'error');
    }
    setIsResetting(null);
    refreshTournament();
  };

  const handleDisqualifyBoth = async (matchId: string) => {
    const confirmed = await confirm(t('disqualify_both_confirm'));
    if (!confirmed) return;

    setIsResetting(matchId);
    try {
      const response = await fetch(`/api/matches/${matchId}/disqualify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disqualifiedId: 'both' }),
      });

      if (response.ok) {
        toast(t('alerts.disqualify_success') || 'Both participants disqualified.', 'success');
      } else {
        toast(t('alerts.error_resetting'), 'error');
      }
    } catch (error) {
      toast(t('alerts.error_resetting'), 'error');
    }
    setIsResetting(null);
    refreshTournament();
  };

  const finalRound = sortedRounds[totalRounds - 1];
  const finalMatch = finalRound?.matches?.[0];
  const winner = (finalMatch?.winner_id && finalMatch?.status === 'completed') ? 
    (data.participants || []).find((p: any) => p.id === finalMatch.winner_id) : null;

  // Derive matches for "Live & Recent Results" ticker (show all matches with players)
  const tickerMatches = sortedRounds
    .flatMap((r: any) => r.matches || [])
    .filter((m: any) => m.participant_a_id && m.participant_b_id)
    .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime());
  
  const tickerScrollRef = useRef<HTMLDivElement>(null);

  const scrollTicker = (direction: 'left' | 'right') => {
    if (tickerScrollRef.current) {
      const { scrollLeft } = tickerScrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - 300 : scrollLeft + 300;
      tickerScrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <div translate="no" className="fixed inset-0 bg-zinc-950 text-white selection:bg-[#ffaa00] flex flex-col pt-[88px] md:pt-[96px] p-2 md:p-4 overflow-hidden">
      {/* BACKGROUND DECOR */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
          <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-[#ff5555] blur-[150px] rounded-full" />
          <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] bg-[#ffaa00] blur-[150px] rounded-full" />
      </div>

      <div ref={bracketRef} className="relative z-10 flex flex-col h-full overflow-hidden bg-[#09090b]">
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

                <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter uppercase italic leading-none gradient-text-luxury transition-all duration-500 flex items-center gap-3 pr-2 pb-1">
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

                {/* Download and Toggle Winner buttons — only when completed */}
                {data.status === 'completed' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowWinnerCard(!showWinnerCard)}
                      className={cn(
                        "glass-pill px-3 py-1 flex items-center gap-1.5 border backdrop-blur-xl rounded-md transition-all active:scale-95",
                        showWinnerCard 
                          ? "border-[#ffaa00]/30 bg-[#ffaa00]/10 text-[#ffaa00] hover:bg-[#ffaa00]/20" 
                          : "border-white/10 bg-white/5 text-white/40 hover:bg-white/10"
                      )}
                      title={showWinnerCard ? tWinner('hide_champion') : tWinner('show_champion')}
                    >
                      <Trophy size={10} className={showWinnerCard ? "text-[#ffaa00]" : "text-white/40"} />
                      <span className="text-[10px] font-black uppercase tracking-tight leading-none">
                        {showWinnerCard ? tWinner('hide_champion') : tWinner('show_champion')}
                      </span>
                    </button>

                    <button
                      onClick={downloadBracket}
                      disabled={isDownloading}
                      className="glass-pill px-3 py-1 flex items-center gap-1.5 border border-[#ffaa00]/30 bg-[#ffaa00]/10 backdrop-blur-xl rounded-md transition-all hover:bg-[#ffaa00]/20 hover:border-[#ffaa00]/60 active:scale-95 disabled:opacity-50"
                    >
                      {isDownloading
                        ? <Zap size={10} className="text-[#ffaa00] animate-spin" />
                        : <Download size={10} className="text-[#ffaa00]" />
                      }
                      <span className="text-[10px] font-black uppercase tracking-tight leading-none text-[#ffaa00]">
                        {isDownloading ? 'Exporting...' : 'Download'}
                      </span>
                    </button>
                  </div>
                )}
            </div>
        </header>

        {/* BRACKET VIEWPORT */}
        <div
          ref={containerRef}
          className="container-viewport flex-1 w-full overflow-hidden relative cursor-grab active:cursor-grabbing select-none"
        >
          <motion.div 
            drag
            dragMomentum={false}
            animate={{ scale: zoom, x: offset.x, y: offset.y }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            onDragEnd={(_, info) => {
               setOffset(prev => ({
                 x: prev.x + info.offset.x,
                 y: prev.y + info.offset.y
               }));
            }}
            className="motion-viewport absolute inset-0 flex items-center justify-center origin-center"
          >
            <div ref={contentRef} className="flex gap-6 md:gap-16 lg:gap-24 items-center justify-center py-20 px-10 md:py-48 md:px-48">
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
                <div key={round.id} className="flex flex-col gap-4 min-w-[240px] md:min-w-[280px]">
                  <div className="relative flex items-center justify-center mb-2 md:mb-4">
                      <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/10" />
                      <h2 className={cn("px-4 text-sm md:text-base lg:text-lg font-black tracking-[0.4em] uppercase italic transition-colors whitespace-nowrap", round.id === activeRoundId ? "text-[#ffaa00] drop-shadow-[0_0_8px_rgba(255,170,0,0.5)]" : "text-white/40")}>
                        {roundName}
                      </h2>
                      <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/5" />
                  </div>
                  
                  <div className="flex flex-col relative shrink-0">
                    {finalMatches.map((match: any) => {
                      const BASE_CELL_HEIGHT = 180; 
                      const roundMultiplier = Math.pow(2, rIdx);
                      const cellHeight = BASE_CELL_HEIGHT * roundMultiplier;
                      const verticalShift = cellHeight / 2;
                      const winnerLineColor = (match.winner_id && match.winner_id === match.participant_a_id) ? '#ff5555' : 
                                              (match.winner_id && match.winner_id === match.participant_b_id) ? '#ffaa00' : 'rgba(255,255,255,0.05)';

                      return (
                        <div key={match.id} className="relative flex items-center justify-center shrink-0" style={{ height: cellHeight }}>
                            <MatchNode 
                               match={match} 
                               isAdmin={isAdmin} 
                               onUpdateScore={isAdmin ? handleUpdateScore : undefined} 
                               onFinishMatch={isAdmin ? handleFinishMatch : undefined} 
                               onResetMatch={handleResetMatch}
                               onDisqualify={handleDisqualifyParticipant}
                               onDisqualifyBoth={handleDisqualifyBoth}
                               isFinishing={isFinishing === match.id} 
                               isResetting={isResetting === match.id}
                             />
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
          </div>
          </motion.div>
        </div>

        {/* ZOOM CONTROLS */}
        <div id="zoom-controls" className="absolute bottom-4 right-4 lg:bottom-6 lg:right-6 z-[100] flex flex-col gap-1 lg:gap-2 p-1.5 lg:p-2 bg-black/80 border border-white/10 rounded-xl lg:rounded-2xl backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-t border-white/20 glass-pill transition-all overflow-hidden">
          <button
            onClick={() => handleZoom(0.1)}
            className="p-2 lg:p-3 text-white/40 hover:text-[#ffaa00] hover:bg-[#ffaa00]/10 rounded-lg lg:rounded-xl transition-all active:scale-95 group"
            title={t('zoom_in')}
          >
            <Plus className="w-4 h-4 lg:w-5 lg:h-5 group-hover:drop-shadow-[0_0_8px_rgba(255,170,0,0.5)]" />
          </button>
          <div className="h-px w-6 lg:w-8 mx-auto bg-white/5" />
          <button
            onClick={() => handleZoom(-0.1)}
            className="p-2 lg:p-3 text-white/40 hover:text-[#ffaa00] hover:bg-[#ffaa00]/10 rounded-lg lg:rounded-xl transition-all active:scale-95 group"
            title={t('zoom_out')}
          >
            <Minus className="w-4 h-4 lg:w-5 lg:h-5 group-hover:drop-shadow-[0_0_8px_rgba(255,170,0,0.5)]" />
          </button>
          <div className="h-px w-6 lg:w-8 mx-auto bg-white/5" />
          <button
            onClick={resetView}
            className="p-2 lg:p-3 text-white/40 hover:text-[#ffaa00] hover:bg-[#ffaa00]/10 rounded-lg lg:rounded-xl transition-all active:scale-95 group"
            title={t('reset_view')}
          >
            <RotateCcw className="w-4 h-4 lg:w-5 lg:h-5 group-hover:rotate-[-45deg] transition-transform group-hover:drop-shadow-[0_0_8px_rgba(255,170,0,0.5)]" />
          </button>
        </div>

        {/* GRAND CHAMPION CARD */}
        <AnimatePresence>
          {winner && showWinnerCard && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 50 }}
              className="winner-card-export absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-6 md:p-10 bg-black/95 border-2 border-[#ffaa00]/30 rounded-[24px] md:rounded-[32px] backdrop-blur-3xl shadow-[0_0_100px_rgba(255,170,0,0.25)] z-[110] text-center max-w-[300px] md:max-w-sm w-[calc(100%-2rem)] mx-auto overflow-hidden group"
            >
                <div className="absolute inset-0 bg-gradient-to-b from-[#ffaa00]/10 to-transparent pointer-none" />
                <div className="relative z-10 flex flex-col items-center">
                    <Trophy className="text-[#ffaa00] w-12 h-12 md:w-20 md:h-20 mb-4 md:mb-8 drop-shadow-[0_0_30px_rgba(255,170,0,0.6)] animate-bounce" />
                    <h3 className="text-2xl md:text-4xl font-black uppercase tracking-tighter italic mb-1 md:mb-2 gradient-text-luxury">{winner.name}</h3>
                    <p className="text-[#ffaa00] text-[10px] md:text-xs font-black uppercase tracking-[0.4em] mb-6 md:mb-10 opacity-70 italic">{tWinner('champion')}</p>
                    
                    {winner.logo_url && (
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-white/5 border border-white/10 overflow-hidden mb-4 md:mb-6 p-2 md:p-3 shadow-lg">
                            <img src={winner.logo_url} alt={winner.name} className="w-full h-full object-contain" />
                        </div>
                    )}
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-[#ffaa00]/20 to-transparent mb-4 md:mb-6" />
                    <div className="space-y-1 md:space-y-1.5">
                        <p className="text-white text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em] italic leading-tight">{tWinner('congrats')}</p>
                        <p className="text-white/20 text-[7px] md:text-[9px] font-bold uppercase tracking-widest">{tWinner('description')}</p>
                    </div>
                </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* RECENT MATCH TICKER (BOTTOM) */}
      {tickerMatches.length > 0 && (
        <div className="shrink-0 border-t border-white/5 bg-black/40 backdrop-blur-md relative overflow-hidden py-4 group/ticker">
          {/* Navigation Buttons */}
          <div className="absolute left-1/2 -translate-x-1/2 top-4 z-30 flex gap-2 opacity-0 group-hover/ticker:opacity-100 transition-opacity">
            <button 
              onClick={() => scrollTicker('left')}
              className="w-10 h-10 bg-black/80 border border-white/10 rounded-full flex items-center justify-center text-[#ffaa00] hover:bg-[#ffaa00] hover:text-black transition-all shadow-xl backdrop-blur-xl"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={() => scrollTicker('right')}
              className="w-10 h-10 bg-black/80 border border-white/10 rounded-full flex items-center justify-center text-[#ffaa00] hover:bg-[#ffaa00] hover:text-black transition-all shadow-xl backdrop-blur-xl"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Label */}
          <div className="absolute left-6 top-1/2 -translate-y-1/2 z-20 hidden lg:flex items-center gap-2 px-3 py-1 bg-black/60 border border-[#ffaa00]/20 rounded-md">
            <div className="w-1.5 h-1.5 bg-[#ffaa00] rounded-full animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#ffaa00] italic">{tc('live_now')} / {tc('recent_results')}</span>
          </div>

          <div 
            ref={tickerScrollRef}
            className="w-full overflow-x-auto scrollbar-none scroll-smooth"
          >
            <div 
              className="flex gap-8 items-center shrink-0 animate-marquee hover:[animation-play-state:paused] px-6 lg:px-48 py-4 w-max"
            >
              {[...tickerMatches, ...tickerMatches, ...tickerMatches, ...tickerMatches].map((match: any, idx) => (
                <div
                  key={`${match.id}-${idx}`}
                  className="shrink-0 flex items-center gap-6 px-6 border-r border-white/5 last:border-0"
                >
                  <div className="flex items-center gap-4">
                    {/* Part A */}
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-black/40 border border-white/5 flex items-center justify-center p-0.5 overflow-hidden shrink-0">
                        {match.participant_a?.logo_url ? (
                          <img src={match.participant_a.logo_url} className="w-full h-full object-contain" alt="" />
                        ) : (
                          <span className="text-[8px] font-black text-white/10 uppercase">{match.participant_a?.name?.[0]}</span>
                        )}
                      </div>
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest whitespace-nowrap",
                        match.winner_id === match.participant_a_id ? 'text-white' : 'text-white/20'
                      )}>
                        {match.participant_a?.name}
                      </span>
                    </div>

                    {/* Scores */}
                    <div className="flex items-center gap-1.5 bg-black/60 px-3 py-1 rounded border border-white/5 shadow-inner">
                      <span className={cn(
                        "text-sm font-black tabular-nums",
                        (match.score_a || 0) > (match.score_b || 0) ? 'text-[#ffaa00] drop-shadow-[0_0_8px_rgba(255,170,0,0.4)]' : 'text-white/20'
                      )}>{match.score_a ?? 0}</span>
                      <span className="text-white/5 text-[10px]">-</span>
                      <span className={cn(
                        "text-sm font-black tabular-nums",
                        (match.score_b || 0) > (match.score_a || 0) ? 'text-[#ffaa00] drop-shadow-[0_0_8px_rgba(255,170,0,0.4)]' : 'text-white/20'
                      )}>{match.score_b ?? 0}</span>
                    </div>

                    {/* Part B */}
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest whitespace-nowrap text-right",
                        match.winner_id === match.participant_b_id ? 'text-white' : 'text-white/20'
                      )}>
                        {match.participant_b?.name}
                      </span>
                      <div className="w-5 h-5 rounded bg-black/40 border border-white/5 flex items-center justify-center p-0.5 overflow-hidden shrink-0">
                        {match.participant_b?.logo_url ? (
                          <img src={match.participant_b.logo_url} className="w-full h-full object-contain" alt="" />
                        ) : (
                          <span className="text-[8px] font-black text-white/10 uppercase">{match.participant_b?.name?.[0]}</span>
                        )}
                      </div>
                    </div>

                    {/* Compact Box Score for Ticker */}
                    {match.box_score && (match.box_score as any[]).length > 0 && (
                      <div className="flex gap-1.5 border-l border-white/10 pl-4 py-1">
                        {(match.box_score as any[]).map((r, i) => (
                          <div key={i} className="flex flex-col items-center justify-center min-w-[14px]">
                            <span className={cn("text-[8px] font-bold tabular-nums", r.a > r.b ? "text-[#ff5555]" : "text-white/20")}>{r.a}</span>
                            <span className={cn("text-[8px] font-bold tabular-nums", r.b > r.a ? "text-[#5555ff]" : "text-white/20")}>{r.b}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Overlays to hide start/end for the label */}
          <div className="absolute left-0 top-0 bottom-0 w-48 bg-gradient-to-r from-black via-black/80 to-transparent z-10 hidden lg:block" />
          <div className="absolute right-0 top-0 bottom-0 w-48 bg-gradient-to-l from-black via-black/80 to-transparent z-10" />
        </div>
      )}

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
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
