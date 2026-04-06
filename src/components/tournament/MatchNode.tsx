'use client';

import { Tables } from "@/types/database.types";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Crown, RotateCcw, Gavel, Ban, Trophy } from "lucide-react";

type Participant = Tables<'participants'>;
type Match = Tables<'matches'> & {
  participant_a: Participant | null;
  participant_b: Participant | null;
  disqualified_id?: string | null;
  is_double_dq?: boolean;
  box_score?: any;
};

interface MatchNodeProps {
  match: Match;
  isAdmin?: boolean;
  onUpdateScore?: (matchId: string, scoreA: number, scoreB: number, boxScore?: any[]) => void;
  onSetWinner?: (matchId: string, winnerId: string) => void;
  onFinishMatch?: (matchId: string) => void;
  onResetMatch?: (matchId: string) => void;
  onDisqualify?: (matchId: string, participantId: string, participantName: string) => void;
  onDisqualifyBoth?: (matchId: string) => void;
  isFinishing?: boolean;
  isResetting?: boolean;
}

export default function MatchNode({
  match,
  isAdmin = false,
  onUpdateScore,
  onFinishMatch,
  onResetMatch,
  onDisqualify,
  onDisqualifyBoth,
  isFinishing = false,
  isResetting = false,
}: MatchNodeProps) {
  const t = useTranslations('Tournament');

  const isCompleted = match.status === 'completed';
  const isAWinner = !!(match.winner_id && match.winner_id === match.participant_a_id);
  const isBWinner = !!(match.winner_id && match.winner_id === match.participant_b_id);
  
  const isADisqualified = !!match.disqualified_id && match.disqualified_id === match.participant_a_id;
  const isBDisqualified = !!match.disqualified_id && match.disqualified_id === match.participant_b_id;
  const isDoubleDq = !!match.is_double_dq;

  const winner = isAWinner ? match.participant_a : isBWinner ? match.participant_b : null;
  const boxScore = (match.box_score as any[]) || [];

  const handleAddRound = () => {
    const newBox = [...boxScore, { r: boxScore.length + 1, a: 0, b: 0 }];
    onUpdateScore?.(match.id, match.score_a || 0, match.score_b || 0, newBox);
  };

  const handleUpdateRound = (idx: number, field: 'a' | 'b', val: number) => {
    const newBox = boxScore.map((b, i) => i === idx ? { ...b, [field]: val } : b);
    // Auto-calculate totals
    const totalA = newBox.reduce((sum, curr) => sum + (curr.a || 0), 0);
    const totalB = newBox.reduce((sum, curr) => sum + (curr.b || 0), 0);
    onUpdateScore?.(match.id, totalA, totalB, newBox);
  };

  const handleRemoveRound = (idx: number) => {
    const newBox = boxScore.filter((_, i) => i !== idx).map((b, i) => ({ ...b, r: i + 1 }));
    const totalA = newBox.reduce((sum, curr) => sum + (curr.a || 0), 0);
    const totalB = newBox.reduce((sum, curr) => sum + (curr.b || 0), 0);
    onUpdateScore?.(match.id, totalA, totalB, newBox);
  };

  // ── COMPLETED VIEW ────────────────────────────────────────────────────────
  if (isCompleted && winner) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="uno-card relative w-40 md:w-48 bg-zinc-900 border-[3px] border-[#ffaa00] shadow-[0_0_20px_rgba(255,170,0,0.2)] rounded-xl flex flex-col items-center justify-center gap-0.5 py-1.5 md:py-2 px-2"
      >
        <div className="flex items-center gap-2 mb-0.5">
          <div className="w-6 h-6 md:w-7 md:h-7 rounded-lg bg-black/40 border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center p-0.5">
            {winner.logo_url ? (
              <img src={winner.logo_url} alt={winner.name} className="w-full h-full object-cover" />
            ) : (
              <Trophy size={10} className="text-[#ffaa00]/20" />
            )}
          </div>
          <span className="font-black text-[11px] md:text-xs uppercase text-[#ffaa00] text-center truncate max-w-[90px] md:max-w-[110px]">
            {winner.name}
          </span>
        </div>
        <span className="text-[6px] md:text-[7px] font-black uppercase tracking-[0.15em] text-[#ffaa00]/60 italic leading-none">
          {match.disqualified_id ? (match.disqualified_id === match.participant_a_id ? `Opponent DQ'd` : `Opponent DQ'd`) : t('advances')}
        </span>
        {isAdmin && (
          <button
            onClick={() => onFinishMatch?.(match.id)}
            disabled={isFinishing}
            className="mt-1 flex items-center gap-1 text-[6px] md:text-[7px] font-black uppercase tracking-wider text-white/20 hover:text-[#ffaa00] transition-colors"
          >
            <RotateCcw size={7} className="md:w-[8px] md:h-[8px]" />
            {isFinishing ? '...' : t('update_match')}
          </button>
        )}
        {isAdmin && (
          <button
            onClick={() => onResetMatch?.(match.id)}
            disabled={isResetting}
            className="mt-1 flex items-center gap-1 text-[6px] md:text-[7px] font-black uppercase tracking-wider text-red-500/40 hover:text-red-500 transition-colors"
          >
            <RotateCcw size={7} className="md:w-[8px] md:h-[8px]" />
            {isResetting ? '...' : t('reset_result') || 'Reset Result'}
          </button>
        )}
      </motion.div>
    );
  }

  // ── ACTIVE / PENDING VIEW ─────────────────────────────────────────────────
  const hasParticipants = !!(match.participant_a_id || match.participant_b_id);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="uno-card relative w-[220px] md:w-[260px] bg-white dark:bg-zinc-900 border-[3px] border-zinc-800 flex flex-col overflow-hidden rounded-[1rem] shrink-0"
    >
      {/* Participant A */}
      <div className="flex-1 flex justify-between items-center px-2 md:px-3 py-1.5 md:py-2 gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0 pr-1">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-black/40 border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center">
            {match.participant_a?.logo_url ? (
              <img src={match.participant_a.logo_url} alt={match.participant_a.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-[7px] md:text-[9px] font-black text-white/20">{match.participant_a?.name?.slice(0,2).toUpperCase() ?? '?'}</span>
            )}
          </div>
          <div className="flex flex-col min-w-0 leading-tight flex-1">
            <span className="text-[6px] md:text-[7px] font-black uppercase tracking-widest opacity-40">T1</span>
            <span className={cn(
              "font-black text-[11px] md:text-xs uppercase truncate w-full",
              match.participant_a ? "text-white/90" : "text-white/20 italic",
              isADisqualified && "text-red-500 line-through decoration-2"
            )}>
              {match.participant_a?.name || t('waiting')}
            </span>
            {(isADisqualified || isDoubleDq) && (
              <div className="absolute inset-0 bg-red-900/10 flex items-center justify-center z-10">
                <span className="text-[10px] font-bold text-red-500 animate-pulse bg-zinc-950/80 px-2 py-0.5 rounded-full border border-red-500/50">
                  {isDoubleDq ? t('double_disqualified_label') : t('disqualified_label')}
                </span>
              </div>
            )}
          </div>
        </div>

        {isAdmin && match.participant_a_id && !isCompleted && (
           <button
             onClick={() => onDisqualify?.(match.id, match.participant_a_id!, match.participant_a?.name || '')}
             className="text-white/20 hover:text-red-500 transition-colors p-1.5"
             title="Disqualify"
           >
             <Gavel size={12} />
           </button>
        )}

        {isAdmin ? (
          <input
            type="number"
            inputMode="numeric"
            disabled={isCompleted}
            placeholder="0"
            className="w-10 h-8 md:w-12 md:h-10 bg-black/40 rounded-lg text-center font-black text-sm md:text-base outline-none border border-white/5 focus:border-[#ff5555] transition-all text-white flex-shrink-0"
            value={match.score_a === 0 ? '' : (match.score_a ?? '')}
            onChange={(e) => onUpdateScore?.(match.id, e.target.value === '' ? 0 : parseInt(e.target.value), match.score_b || 0)}
          />
        ) : (
          <div className="w-10 h-8 md:w-12 md:h-10 flex items-center justify-center bg-black/20 rounded-lg font-black text-sm md:text-base border border-transparent text-white flex-shrink-0">
            {match.score_a ?? 0}
          </div>
        )}
      </div>

      <div className="h-[1px] bg-gradient-to-r from-[#ff5555] via-[#ffaa00] to-[#5555ff] opacity-20" />

      {/* Participant B */}
      <div className="flex-1 flex justify-between items-center px-2 md:px-3 py-1.5 md:py-2 gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0 pr-1">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-black/40 border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center">
            {match.participant_b?.logo_url ? (
              <img src={match.participant_b.logo_url} alt={match.participant_b.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-[7px] md:text-[9px] font-black text-white/20">{match.participant_b?.name?.slice(0,2).toUpperCase() ?? '?'}</span>
            )}
          </div>
          <div className="flex flex-col min-w-0 leading-tight flex-1">
            <span className="text-[6px] md:text-[7px] font-black uppercase tracking-widest opacity-40">T2</span>
            <span className={cn(
              "font-black text-[11px] md:text-xs uppercase truncate w-full",
              match.participant_b ? "text-white/90" : "text-white/20 italic",
              isBDisqualified && "text-red-500 line-through decoration-2"
            )}>
              {match.participant_b?.name || t('waiting')}
            </span>
            {isBDisqualified && (
              <span className="text-[6px] font-black text-red-500 uppercase tracking-tighter animate-pulse">
                {t('disqualified') || 'Disqualified'}
              </span>
            )}
          </div>
        </div>

        {isAdmin && match.participant_b_id && !isCompleted && (
           <button
             onClick={() => onDisqualify?.(match.id, match.participant_b_id!, match.participant_b?.name || '')}
             className="text-white/20 hover:text-red-500 transition-colors p-1.5"
             title="Disqualify"
           >
             <Gavel size={12} />
           </button>
        )}

        {isAdmin ? (
          <input
            type="number"
            inputMode="numeric"
            disabled={isCompleted}
            placeholder="0"
            className="w-10 h-8 md:w-12 md:h-10 bg-black/40 rounded-lg text-center font-black text-sm md:text-base outline-none border border-white/5 focus:border-[#5555ff] transition-all text-white flex-shrink-0"
            value={match.score_b === 0 ? '' : (match.score_b ?? '')}
            onChange={(e) => onUpdateScore?.(match.id, match.score_a || 0, e.target.value === '' ? 0 : parseInt(e.target.value))}
          />
        ) : (
          <div className="w-10 h-8 md:w-12 md:h-10 flex items-center justify-center bg-black/20 rounded-lg font-black text-sm md:text-base border border-transparent text-white flex-shrink-0">
            {match.score_b ?? 0}
          </div>
        )}
      </div>

      {/* Admin Box Score controls */}
      {isAdmin && (
        <div className="px-2 pb-2 bg-black/20 border-t border-white/5">
          <div className="flex items-center justify-between py-1.5">
             <span className="text-[7px] font-black uppercase tracking-widest text-white/30">Detailed Box Score</span>
             <button 
               onClick={handleAddRound}
               className="text-[7px] font-black uppercase px-2 py-0.5 bg-white/5 hover:bg-white/10 rounded-sm transition-colors text-[#ffaa00]"
             >
               + Round
             </button>
          </div>
          
          <div className="space-y-1 max-h-[80px] overflow-y-auto no-scrollbar">
            {boxScore.map((round, idx) => (
              <div key={idx} className="flex items-center gap-1.5 animate-in fade-in slide-in-from-left-1 duration-300">
                <span className="text-[7px] font-black text-white/20 w-3">R{round.r}</span>
                <input 
                  type="number" 
                  value={round.a} 
                  onChange={(e) => handleUpdateRound(idx, 'a', parseInt(e.target.value) || 0)}
                  className="w-full h-5 bg-black/40 border border-white/5 rounded text-[9px] font-black text-center text-[#ff5555]" 
                />
                <input 
                  type="number" 
                  value={round.b} 
                  onChange={(e) => handleUpdateRound(idx, 'b', parseInt(e.target.value) || 0)}
                  className="w-full h-5 bg-black/40 border border-white/5 rounded text-[9px] font-black text-center text-[#5555ff]" 
                />
                <button onClick={() => handleRemoveRound(idx)} className="text-[8px] text-white/10 hover:text-red-500 px-0.5">×</button>
              </div>
            ))}
          </div>
                  {isAdmin && !isCompleted && match.participant_a_id && match.participant_b_id && (
                    <div className="mt-2 pt-2 border-t border-white/5">
                      <button
                        onClick={() => onDisqualifyBoth?.(match.id)}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 transition-all active:scale-95 group shadow-lg shadow-red-900/5"
                        title={t('disqualify_both_title')}
                      >
                        <Ban size={14} className="group-hover:rotate-12 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">Double DQ</span>
                      </button>
                    </div>
                  )}
        </div>
      )}

      {/* Display Box Score if not admin and has rounds */}
      {!isAdmin && boxScore.length > 0 && (
         <div className="px-2 py-1 bg-black/20 border-t border-white/5 flex gap-1 items-baseline overflow-x-auto no-scrollbar">
            <span className="text-[6px] font-black text-white/20 uppercase tracking-tighter shrink-0">Box:</span>
            {boxScore.map((r, i) => (
              <div key={i} className="flex flex-col items-center shrink-0 min-w-[12px]">
                 <span className={cn("text-[7px] font-black", r.a > r.b ? "text-[#ff5555]" : "text-white/40")}>{r.a}</span>
                 <div className="h-[1px] w-full bg-white/5" />
                 <span className={cn("text-[7px] font-black", r.b > r.a ? "text-[#5555ff]" : "text-white/40")}>{r.b}</span>
              </div>
            ))}
         </div>
      )}

      {isAdmin && hasParticipants && (
        <button
          onClick={() => onFinishMatch?.(match.id)}
          disabled={isFinishing}
          className="w-full py-1.5 bg-zinc-800/80 hover:bg-[#ffaa00] text-zinc-400 hover:text-black text-[7px] md:text-[8px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1 border-t border-white/10"
        >
          {isFinishing ? '...' : t('finish_match')}
        </button>
      )}
    </motion.div>
  );
}
