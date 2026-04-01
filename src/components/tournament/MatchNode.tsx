'use client';

import { Tables } from "@/types/database.types";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Crown, RotateCcw } from "lucide-react";

type Participant = Tables<'participants'>;
type Match = Tables<'matches'> & {
  participant_a: Participant | null;
  participant_b: Participant | null;
  box_score?: any;
};

interface MatchNodeProps {
  match: Match;
  isAdmin?: boolean;
  onUpdateScore?: (matchId: string, scoreA: number, scoreB: number, boxScore?: any[]) => void;
  onSetWinner?: (matchId: string, winnerId: string) => void;
  onFinishMatch?: (matchId: string) => void;
  isFinishing?: boolean;
}

export default function MatchNode({
  match,
  isAdmin = false,
  onUpdateScore,
  onFinishMatch,
  isFinishing = false,
}: MatchNodeProps) {
  const t = useTranslations('Tournament');

  const isCompleted = match.status === 'completed';
  const isAWinner = !!(match.winner_id && match.winner_id === match.participant_a_id);
  const isBWinner = !!(match.winner_id && match.winner_id === match.participant_b_id);

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
        <Crown size={12} className="text-[#ffaa00] md:w-[14px] md:h-[14px]" />
        <span className="font-black text-xs md:text-sm uppercase text-[#ffaa00] text-center truncate max-w-[120px] md:max-w-[140px]">
          {winner.name}
        </span>
        <span className="text-[7px] md:text-[8px] font-black uppercase tracking-[0.15em] text-[#ffaa00]/60 italic leading-none">
          {t('advances')}
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
      </motion.div>
    );
  }

  // ── ACTIVE / PENDING VIEW ─────────────────────────────────────────────────
  const hasParticipants = !!(match.participant_a_id || match.participant_b_id);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="uno-card relative w-40 md:w-48 bg-white dark:bg-zinc-900 border-[3px] border-zinc-800 flex flex-col overflow-hidden rounded-xl shrink-0"
    >
      {/* Participant A */}
      <div className="flex-1 flex justify-between items-center px-1.5 md:px-2 py-0.5 md:py-1 gap-1 md:gap-1.5">
        <div className="flex items-center gap-1 md:gap-1.5 min-w-0">
          <div className="w-5 h-5 md:w-6 md:h-6 rounded-md bg-black/40 border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center">
            {match.participant_a?.logo_url ? (
              <img src={match.participant_a.logo_url} alt={match.participant_a.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-[5px] md:text-[6px] font-black text-white/20">{match.participant_a?.name?.slice(0,2).toUpperCase() ?? '?'}</span>
            )}
          </div>
          <div className="flex flex-col min-w-0 leading-tight">
            <span className="text-[5px] md:text-[6px] font-black uppercase tracking-widest opacity-40">T1</span>
            <span className={cn(
              "font-black text-[9px] md:text-[10px] uppercase truncate max-w-[50px] md:max-w-[70px]",
              match.participant_a ? "text-white/80" : "text-white/20 italic"
            )}>
              {match.participant_a?.name || t('waiting')}
            </span>
          </div>
        </div>

        {isAdmin ? (
          <input
            type="number"
            inputMode="numeric"
            disabled={isCompleted}
            placeholder="0"
            className="w-8 h-6 md:w-10 md:h-8 bg-black/40 rounded text-center font-black text-xs md:text-sm outline-none border border-white/5 focus:border-[#ff5555] transition-all text-white flex-shrink-0"
            value={match.score_a === 0 ? '' : (match.score_a ?? '')}
            onChange={(e) => onUpdateScore?.(match.id, e.target.value === '' ? 0 : parseInt(e.target.value), match.score_b || 0)}
          />
        ) : (
          <div className="w-8 h-6 md:w-10 md:h-8 flex items-center justify-center bg-black/20 rounded font-black text-[10px] md:text-xs border border-transparent text-white flex-shrink-0">
            {match.score_a ?? 0}
          </div>
        )}
      </div>

      <div className="h-[1px] bg-gradient-to-r from-[#ff5555] via-[#ffaa00] to-[#5555ff] opacity-20" />

      {/* Participant B */}
      <div className="flex-1 flex justify-between items-center px-1.5 md:px-2 py-0.5 md:py-1 gap-1 md:gap-1.5">
        <div className="flex items-center gap-1 md:gap-1.5 min-w-0">
          <div className="w-5 h-5 md:w-6 md:h-6 rounded-md bg-black/40 border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center">
            {match.participant_b?.logo_url ? (
              <img src={match.participant_b.logo_url} alt={match.participant_b.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-[5px] md:text-[6px] font-black text-white/20">{match.participant_b?.name?.slice(0,2).toUpperCase() ?? '?'}</span>
            )}
          </div>
          <div className="flex flex-col min-w-0 leading-tight">
            <span className="text-[5px] md:text-[6px] font-black uppercase tracking-widest opacity-40">T2</span>
            <span className={cn(
              "font-black text-[9px] md:text-[10px] uppercase truncate max-w-[50px] md:max-w-[70px]",
              match.participant_b ? "text-white/80" : "text-white/20 italic"
            )}>
              {match.participant_b?.name || t('waiting')}
            </span>
          </div>
        </div>

        {isAdmin ? (
          <input
            type="number"
            inputMode="numeric"
            disabled={isCompleted}
            placeholder="0"
            className="w-8 h-6 md:w-10 md:h-8 bg-black/40 rounded text-center font-black text-xs md:text-sm outline-none border border-white/5 focus:border-[#5555ff] transition-all text-white flex-shrink-0"
            value={match.score_b === 0 ? '' : (match.score_b ?? '')}
            onChange={(e) => onUpdateScore?.(match.id, match.score_a || 0, e.target.value === '' ? 0 : parseInt(e.target.value))}
          />
        ) : (
          <div className="w-8 h-6 md:w-10 md:h-8 flex items-center justify-center bg-black/20 rounded font-black text-[10px] md:text-xs border border-transparent text-white flex-shrink-0">
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
