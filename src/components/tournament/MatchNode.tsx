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
};

interface MatchNodeProps {
  match: Match;
  isAdmin?: boolean;
  onUpdateScore?: (matchId: string, scoreA: number, scoreB: number) => void;
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
      <div className="flex-1 flex justify-between items-center px-1.5 md:px-2 py-1 md:py-1.5 gap-1 md:gap-1.5">
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
      <div className="flex-1 flex justify-between items-center px-1.5 md:px-2 py-1 md:py-1.5 gap-1 md:gap-1.5">
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

      {isAdmin && hasParticipants && (
        <button
          onClick={() => onFinishMatch?.(match.id)}
          disabled={isFinishing}
          className="w-full py-1 bg-zinc-800/80 hover:bg-[#ffaa00] text-zinc-400 hover:text-black text-[7px] md:text-[8px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1 border-t border-white/5"
        >
          {isFinishing ? '...' : t('finish_match')}
        </button>
      )}
    </motion.div>
  );
}
