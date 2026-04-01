'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Trophy, Calendar as CalendarIcon, LucideIcon, MapPin, Users, Heart } from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { Tables } from '@/types/database.types';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

type TournamentWithParticipants = Tables<'tournaments'> & {
  participants: Array<{ id: string; name: string }>;
};

interface UpcomingCalendarProps {
  tournaments: TournamentWithParticipants[];
  locale: string;
}

export default function UpcomingCalendar({ tournaments, locale }: UpcomingCalendarProps) {
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
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CalendarCard({ tournament, locale, index, tt }: { 
  tournament: TournamentWithParticipants; 
  locale: any; 
  index: number;
  tt: (key: string) => string;
}) {
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
      <div className="flex bg-zinc-900/40 border border-white/10 rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden backdrop-blur-xl h-[200px] sm:h-[280px] hover:border-[#ffaa00]/40 transition-all duration-500 group-hover:shadow-[0_40px_100px_rgba(255,170,0,0.1)]">
        {/* Date Section (UNO Card Style) */}
        <div className="w-1/3 bg-[#ffaa00] flex flex-col items-center justify-center relative overflow-hidden p-4">
          {/* Subtle UNO pattern overlap */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
             <div className="absolute top-2 left-2 text-2xl font-black text-black">
               {day}
             </div>
             <div className="absolute bottom-2 right-2 text-2xl font-black text-black rotate-180">
               {day}
             </div>
          </div>

          <motion.span 
            className="text-6xl font-black text-black tracking-tighter italic"
            whileHover={{ scale: 1.1 }}
          >
            {day}
          </motion.span>
          <span className="text-[10px] font-black uppercase text-black/60 tracking-widest mt-1">
            {month.slice(0, 3)}
          </span>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-black/20 rounded-full" />
        </div>

        {/* Info Section */}
        <div className="flex-1 p-8 flex flex-col justify-between relative">
          {/* Glass Overlay Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50 pointer-events-none" />
          
          <div className="space-y-4 relative z-10">
            <div className="flex items-center gap-2">
               <Trophy size={10} className="text-[#ffaa00]" />
               <span className="text-[8px] sm:text-[10px] font-black uppercase text-white/30 tracking-[0.2em]">
                 {tt(tournament.type)}
               </span>
            </div>
            
            <h3 className="text-lg sm:text-3xl font-black uppercase italic leading-tight sm:leading-none tracking-tighter group-hover:text-[#ffaa00] transition-colors duration-300 line-clamp-2">
              {tournament.name}
            </h3>

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

          <div className="flex items-center justify-between pt-3 sm:pt-6 border-t border-white/5 relative z-10">
            <div className="space-y-0.5 sm:space-y-1">
               <p className="text-[6px] sm:text-[8px] font-black uppercase text-white/20 tracking-widest leading-none">Entry Starts</p>
               <p className="text-sm sm:text-lg font-black text-white italic leading-none">{time} HRS</p>
            </div>
            
            <button className="h-8 w-8 sm:h-12 sm:w-12 bg-white/5 hover:bg-[#ffaa00] rounded-full flex items-center justify-center border border-white/10 hover:border-[#ffaa00] text-white hover:text-black transition-all group/btn">
               <Heart size={14} className="sm:size-[18px] transition-transform group-hover/btn:scale-110" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
