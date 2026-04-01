'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Trophy, Calendar as CalendarIcon, LucideIcon, MapPin, Users, Heart } from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { Tables } from '@/types/database.types';
import { cn } from '@/lib/utils';
import { useMemo, useState, useEffect } from 'react';
import { useAlert } from '@/components/ui/UnoAlertSystem';
import { toggleTournamentLikeAction } from '@/app/actions/tournament';

type TournamentWithParticipants = Tables<'tournaments'> & {
  participants: Array<{ id: string; name: string }>;
  tournament_likes?: Array<{ user_id: string }>;
};

interface UpcomingCalendarProps {
  tournaments: TournamentWithParticipants[];
  locale: string;
  user?: any;
}

export default function UpcomingCalendar({ tournaments, locale, user }: UpcomingCalendarProps) {
  const t = useTranslations('Index');
  const tt = useTranslations('Tournament');
  const dateLocale = locale === 'es' ? es : enUS;

  if (!tournaments || tournaments.length === 0) return null;

  return (
    <section className="relative py-20 overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#ffaa00]/10 blur-[150px] rounded-full -z-10" />
      
      <div className="container mx-auto px-6 space-y-12">
        {/* Section Header */}
        <div className="flex items-end justify-between">
          <div className="space-y-4">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-[#ffaa00] bg-[#ffaa00]/10 px-4 py-1.5 rounded-full border border-[#ffaa00]/20 w-fit"
            >
              <CalendarIcon size={14} className="animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Next Arena Deals</span>
            </motion.div>
            <h2 className="text-3xl md:text-7xl font-black uppercase italic tracking-tighter leading-none">
              {t('upcoming_events')}
            </h2>
          </div>
          
          <div className="hidden md:flex gap-2 pb-4">
             <div className="w-12 h-[2px] bg-white/20 rounded-full overflow-hidden">
               <motion.div 
                 className="w-full h-full bg-[#ffaa00]"
                 animate={{ x: [-50, 50] }}
                 transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
               />
             </div>
          </div>
        </div>

        {/* Horizontal Feed */}
        <div className="relative overflow-visible pb-10">
          <div className="flex gap-8 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-none">
            {tournaments.map((tourney, index) => (
              <CalendarCard 
                key={tourney.id} 
                tournament={tourney} 
                locale={dateLocale}
                index={index}
                tt={tt}
                user={user}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CalendarCard({ tournament, locale, index, tt, user }: { 
  tournament: TournamentWithParticipants; 
  locale: any; 
  index: number;
  tt: (key: string) => string;
  user?: any;
}) {
  const { toast } = useAlert();
  
  const isInitiallyLiked = useMemo(() => {
    return tournament.tournament_likes?.some((l: any) => l.user_id === user?.id) ?? false;
  }, [tournament, user]);

  const [isLiked, setIsLiked] = useState(isInitiallyLiked);
  const [isPending, setIsPending] = useState(false);

  const handleLike = async () => {
    if (!user) {
      toast("⚡ Only registered challengers can leave their mark. Please log in!", "warning");
      return;
    }

    if (isPending) return;

    // Optimistic UI Update
    setIsLiked(!isLiked);
    setIsPending(true);

    const result = await toggleTournamentLikeAction(tournament.id);
    if (!result.success) {
      // Revert if failed
      setIsLiked(isLiked);
      toast(result.error || "Something went wrong", "error");
    }
    
    setIsPending(false);
  };

  const date = new Date(tournament.scheduled_at!);
  const day = format(date, 'dd');
  const month = format(date, 'MMMM', { locale });
  const time = format(date, 'HH:mm');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex-shrink-0 w-full sm:w-[320px] md:w-[420px] group relative snap-center"
    >
      <div className="flex bg-zinc-900/40 border border-white/10 rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden backdrop-blur-xl min-h-[220px] h-auto sm:h-[280px] hover:border-[#ffaa00]/40 transition-all duration-500 group-hover:shadow-[0_40px_100px_rgba(255,170,0,0.1)]">
        {/* Date Section (UNO Card Style) */}
        <div className="w-1/3 min-w-[90px] sm:min-w-[110px] bg-[#ffaa00] flex flex-col items-center justify-center relative overflow-hidden p-3 sm:p-4 shrink-0">
          {/* Subtle UNO pattern overlap */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
             <div className="absolute top-4 left-4 text-xl font-black text-black leading-none">
               {day}
             </div>
             <div className="absolute bottom-4 right-4 text-xl font-black text-black rotate-180 leading-none">
               {day}
             </div>
          </div>

          <motion.span 
            className="text-4xl sm:text-5xl font-black text-black italic leading-none tracking-normal"
            whileHover={{ scale: 1.1 }}
          >
            {day}
          </motion.span>
          <span className="text-[9px] sm:text-[11px] font-black uppercase text-black/60 tracking-[0.2em] mt-2 sm:mt-3">
            {month.slice(0, 3)}
          </span>
        </div>

        {/* Info Section */}
        <div className="flex-1 p-5 sm:p-8 flex flex-col justify-between relative">
          {/* Glass Overlay Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50 pointer-events-none" />
          
          <div className="space-y-4 relative z-10">
            <div className="flex items-center gap-2">
               <Trophy size={10} className="text-[#ffaa00]" />
               <span className="text-[8px] sm:text-[10px] font-black uppercase text-white/30 tracking-[0.2em]">
                 {tt(tournament.type)}
               </span>
            </div>
            
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-lg sm:text-3xl font-black uppercase italic leading-tight sm:leading-none tracking-tighter group-hover:text-[#ffaa00] transition-colors duration-300 line-clamp-2 pr-2">
                {tournament.name}
              </h3>
              
              <button 
                onClick={handleLike}
                disabled={isPending}
                className={cn(
                  "flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center border transition-all group/btn",
                   isLiked 
                    ? "bg-[#ffaa00] border-[#ffaa00] text-black shadow-[0_0_20px_rgba(255,170,0,0.5)]" 
                    : "bg-white/5 border-white/10 hover:bg-[#ffaa00]/10 hover:border-[#ffaa00]/50 text-white"
                )}
              >
                 <Heart 
                   size={14} 
                   className={cn(
                     "sm:size-[16px] transition-transform group-hover/btn:scale-110",
                     isLiked ? "fill-black" : "fill-transparent text-white/40"
                   )} 
                 />
              </button>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <div className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase">
                <Users size={12} />
                <span>{tournament.participants.length} Players</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase">
                <MapPin size={12} />
                <span>Online Arena</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 sm:pt-6 border-t border-white/5 relative z-10 w-full">
            <div className="space-y-0.5 sm:space-y-1">
               <p className="text-[6px] sm:text-[8px] font-black uppercase text-white/20 tracking-widest leading-none">Starting In</p>
               <CountdownTimer targetDate={date} />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function TimeBlock({ value, label }: { value: string | number, label: string }) {
  return (
    <div className="flex flex-col items-center justify-center bg-black/40 border border-[#ffaa00]/40 hover:border-[#ffaa00] transition-colors rounded-[1rem] px-1.5 sm:px-3 py-1 sm:py-1.5 min-w-[36px] sm:min-w-[56px] shadow-xl backdrop-blur-md">
      <span className="text-xs sm:text-xl font-black text-white italic tabular-nums leading-none tracking-tighter">
        {value}
      </span>
      <span className="text-[6px] sm:text-[9px] font-black text-[#ffaa00] uppercase tracking-widest mt-0.5 sm:mt-1 opacity-90">
        {label}
      </span>
    </div>
  );
}

function CountdownTimer({ targetDate }: { targetDate: Date }) {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = targetDate.getTime() - new Date().getTime();
      if (difference <= 0) return { d: 0, h: 0, m: 0, s: 0 };
      
      return {
        d: Math.floor(difference / (1000 * 60 * 60 * 24)),
        h: Math.floor((difference / (1000 * 60 * 60)) % 24),
        m: Math.floor((difference / 1000 / 60) % 60),
        s: Math.floor((difference / 1000) % 60)
      };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) {
    return (
      <div className="flex items-center gap-1.5 pt-0.5">
        <TimeBlock value="--" label="Days" />
        <TimeBlock value="--" label="Hrs" />
        <TimeBlock value="--" label="Min" />
        <TimeBlock value="--" label="Sec" />
      </div>
    );
  }

  if (timeLeft.d === 0 && timeLeft.h === 0 && timeLeft.m === 0 && timeLeft.s === 0) {
    return (
      <div className="inline-flex items-center gap-2 bg-[#ffaa00]/20 border border-[#ffaa00]/50 rounded-lg px-4 py-2 shadow-[0_0_20px_rgba(255,170,0,0.3)] animate-pulse mt-0.5">
         <span className="text-sm sm:text-base font-black text-[#ffaa00] italic leading-none uppercase tracking-widest">Live Arena</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 pt-0.5">
      {timeLeft.d > 0 && <TimeBlock value={timeLeft.d} label="Days" />}
      {(timeLeft.h > 0 || timeLeft.d > 0) && <TimeBlock value={timeLeft.h.toString().padStart(2, '0')} label="Hrs" />}
      <TimeBlock value={timeLeft.m.toString().padStart(2, '0')} label="Min" />
      <TimeBlock value={timeLeft.s.toString().padStart(2, '0')} label="Sec" />
    </div>
  );
}
