import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { Calendar as CalendarIcon, Trophy, Trash2, Clock, MapPin } from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { deleteTournamentAction } from '@/app/actions/tournament';
import DeleteTournamentButton from '@/components/admin/DeleteTournamentButton';
import { toZonedTime } from 'date-fns-tz';

export default async function AdminCalendarPage({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations('Admin');
  const tc = await getTranslations('Common');
  const tt = await getTranslations('Tournament');
  const supabase = await createClient();
  
  const dateLocale = locale === 'es' ? es : enUS;

  const { data: tournaments } = await supabase
    .from('tournaments')
    .select(`
      *,
      participants (id, name, logo_url)
    `)
    .eq('status', 'scheduled')
    .order('scheduled_at', { ascending: true });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black uppercase italic tracking-tight italic gradient-text">
            {t('calendar')}
          </h1>
          <p className="text-zinc-400 text-sm font-medium">
            Manage upcoming arenas and scheduled events
          </p>
        </div>
        <a href="/tournaments/create">
          <button className="bg-[#ffaa00] text-black hover:bg-[#ffaa00]/90 px-8 h-12 rounded-full font-black uppercase text-[11px] tracking-widest shadow-xl flex items-center gap-3 transition-all active:scale-95">
             <Trophy size={16} strokeWidth={3} />
             {tt('create_button')}
          </button>
        </a>
      </div>

      {!tournaments || tournaments.length === 0 ? (
        <div className="bg-zinc-900/50 border-2 border-dashed border-white/5 rounded-[2.5rem] p-20 text-center space-y-6">
          <div className="w-20 h-20 bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto border border-white/5">
            <CalendarIcon size={32} className="text-zinc-600" />
          </div>
          <div className="space-y-6">
            <h3 className="text-xl font-bold uppercase text-white/50">No arenas scheduled</h3>
            <p className="text-zinc-500 text-sm max-w-xs mx-auto">
              Plan your next big event and it will appear here and on the main landing page.
            </p>
            <div className="pt-4">
              <a href="/tournaments/create">
                <button className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-8 h-12 rounded-full font-black uppercase text-[11px] tracking-widest transition-all">
                  Schedule Your First Arena
                </button>
              </a>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map((tourney) => (
            <div 
              key={tourney.id}
              className="group bg-zinc-900/50 border border-white/5 rounded-[2.5rem] overflow-hidden hover:border-[#ffaa00]/30 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(255,170,0,0.1)]"
            >
              <div className="p-8 space-y-6">
                {/* Date Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-2xl border border-white/5">
                    <Clock size={16} className="text-[#ffaa00]" />
                    <span className="text-xs font-black uppercase text-white tracking-widest">
                      {tourney.scheduled_at ? format(toZonedTime(tourney.scheduled_at, 'America/Toronto'), 'HH:mm') : '--:--'}
                    </span>
                  </div>
                  <DeleteTournamentButton id={tourney.id} />
                </div>

                {/* Tournament Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Trophy size={14} className="text-zinc-500" />
                    <span className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em]">
                      {tt(tourney.type)}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black uppercase italic leading-none group-hover:text-[#ffaa00] transition-colors">
                    {tourney.name}
                  </h3>
                  <div className="flex items-center gap-2 text-zinc-400">
                    <CalendarIcon size={12} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      {tourney.scheduled_at ? format(new Date(tourney.scheduled_at), 'PPPP', { locale: dateLocale }) : 'Date TBD'}
                    </span>
                  </div>
                </div>

                {/* Participants Preview */}
                <div className="pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black uppercase text-white/30 tracking-widest">Confirmed Table</span>
                    <span className="text-[10px] font-black text-[#ffaa00]">{tourney.participants?.length} / 16</span>
                  </div>
                  <div className="flex -space-x-3">
                    {tourney.participants?.slice(0, 6).map((p: any) => (
                      <div key={p.id} className="w-10 h-10 rounded-xl bg-black border-2 border-zinc-900 overflow-hidden flex items-center justify-center group-hover:border-[#ffaa00]/20 transition-all">
                        {p.logo_url ? (
                          <Image src={p.logo_url} alt={p.name} width={40} height={40} className="object-cover w-full h-full" />
                        ) : (
                          <span className="text-[10px] font-black text-white/20">{p.name.slice(0, 1)}</span>
                        )}
                      </div>
                    ))}
                    {(tourney.participants?.length || 0) > 6 && (
                      <div className="w-10 h-10 rounded-xl bg-zinc-800 border-2 border-zinc-900 flex items-center justify-center">
                        <span className="text-[10px] font-black text-white/40">+{tourney.participants!.length - 6}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Card Footer Action */}
              <div className="px-8 py-5 bg-white/5 border-t border-white/5 flex items-center justify-between">
                <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">
                  Ready to deal
                </span>
                <button className="text-[9px] font-black uppercase text-[#ffaa00] hover:text-white transition-colors">
                  Edit Schedule →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
