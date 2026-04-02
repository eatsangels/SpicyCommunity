import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { Trophy, Calendar, Medal, Star } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { HallOfFameHero } from '@/components/ui/hero-odyssey';

interface ChampionEntry {
  winner_id: string;
  winner_name: string | null;
  winner_logo: string | null;
  tournament_id: string;
  tournament_name: string | null;
  tournament_date: string | null;
}

interface GroupedChampion {
  winner_id: string;
  winner_name: string | null;
  winner_logo: string | null;
  wins: { tournament_id: string; tournament_name: string | null; tournament_date: string | null }[];
}

export const revalidate = 0;

export default async function WinnersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations('Winners');
  const supabase = await createClient();

  // Fetch ALL wins
  const { data: rawWinners } = await supabase
    .from('tournament_champions')
    .select('*')
    .order('tournament_date', { ascending: false });

  // Group by winner_id
  const grouped: GroupedChampion[] = [];
  const map = new Map<string, GroupedChampion>();

  for (const entry of (rawWinners as ChampionEntry[]) || []) {
    const key = entry.winner_id;
    if (!map.has(key)) {
      const champion: GroupedChampion = {
        winner_id: entry.winner_id,
        winner_name: entry.winner_name,
        winner_logo: entry.winner_logo,
        wins: [],
      };
      map.set(key, champion);
      grouped.push(champion);
    }
    map.get(key)!.wins.push({
      tournament_id: entry.tournament_id,
      tournament_name: entry.tournament_name,
      tournament_date: entry.tournament_date,
    });
  }

  const totalChampions = grouped.length;

  // Count completed tournaments for hero stat
  const { count: totalTournaments } = await supabase
    .from('tournaments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed');

  // Count active tournaments for live stat
  const { count: liveCount } = await supabase
    .from('tournaments')
    .select('*', { count: 'exact', head: true })
    .neq('status', 'completed');

  const heroTranslations = {
    title: t('title'),
    subtitle: t('subtitle'),
    allTimeChampions: t('total_champions'),
    tournamentsPlayed: "Arena Played",
    realTimeBrackets: "LIVE",
    engine: "ENGINE"
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#ffaa00] selection:text-black">

      {/* Hero with WebGL lightning */}
      <HallOfFameHero 
        totalChampions={totalChampions} 
        totalTournaments={totalTournaments ?? 0} 
        liveCount={liveCount ?? 0}
        translations={heroTranslations}
      />

      <div className="max-w-7xl mx-auto space-y-12 px-8 md:px-16 py-16">


        {/* Grid */}
        {grouped.length === 0 ? (
          <div className="py-32 flex flex-col items-center justify-center text-center opacity-30 gap-6 border border-dashed border-white/10 rounded-[3rem]">
            <Trophy size={64} className="grayscale" />
            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-widest uppercase">{t('empty_title')}</h2>
              <p className="font-medium text-white/50">{t('empty_description')}</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {grouped.map((champion) => {
              const isMultiWinner = champion.wins.length > 1;
              return (
                <div
                  key={champion.winner_id}
                  className="group relative bg-[#0a0a0a] border border-white/10 rounded-[2rem] overflow-hidden hover:border-[#ffaa00]/40 transition-all hover:-translate-y-2 shadow-xl hover:shadow-[#ffaa00]/10 flex flex-col"
                >
                  {/* Inner glow */}
                  <div className="absolute inset-0 bg-gradient-to-b from-[#ffaa00]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                  {/* Multi-win badge */}
                  {isMultiWinner && (
                    <div className="absolute top-4 left-4 z-10 flex items-center gap-1 bg-[#ffaa00] text-black text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-lg">
                      <Star size={9} fill="black" />
                      {champion.wins.length}x
                    </div>
                  )}

                  <div className="absolute top-4 right-4 z-10 bg-black/50 p-2 rounded-full border border-white/10 backdrop-blur-md">
                    <Trophy size={16} className="text-[#ffaa00]" />
                  </div>

                  {/* Avatar + name */}
                  <div className="p-8 pb-4 flex flex-col items-center text-center gap-5 relative z-10">
                    <div className="w-28 h-28 rounded-full bg-black border-4 border-[#ffaa00]/20 flex items-center justify-center overflow-hidden shadow-2xl group-hover:border-[#ffaa00]/60 transition-colors">
                      {champion.winner_logo ? (
                        <img src={champion.winner_logo} alt={champion.winner_name || ''} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-5xl font-black text-[#ffaa00]/40">{(champion.winner_name ?? 'W')[0]}</span>
                      )}
                    </div>

                    <div className="space-y-1 w-full">
                      <h3 className="text-xl font-black tracking-tighter uppercase break-words leading-tight">
                        {champion.winner_name}
                      </h3>
                      <div className="flex items-center justify-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-[#ffaa00]/50">
                        <Medal size={10} className="text-[#ffaa00]" />
                        {champion.wins.length === 1
                          ? t('one_win')
                          : t('many_wins', { count: champion.wins.length })}
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="mx-6 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                  {/* Tournament wins list */}
                  <div className="px-5 py-4 flex flex-col gap-2.5 relative z-10 flex-1">
                    {champion.wins.map((win, idx) => (
                      <Link
                        key={win.tournament_id}
                        href={`/tournaments/${win.tournament_id}`}
                        className="flex items-center justify-between gap-2 bg-white/[0.03] hover:bg-[#ffaa00]/5 border border-white/5 hover:border-[#ffaa00]/20 rounded-xl px-3 py-2.5 transition-all group/win"
                      >
                        {/* Index + name */}
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[9px] font-black text-[#ffaa00]/40 shrink-0">#{idx + 1}</span>
                          <span className="text-[11px] font-bold uppercase tracking-wide text-white/70 group-hover/win:text-white transition-colors truncate">
                            {win.tournament_name || '—'}
                          </span>
                        </div>
                        {/* Date */}
                        <div className="flex items-center gap-1 text-[9px] font-bold text-white/30 shrink-0">
                          <Calendar size={9} />
                          {win.tournament_date
                            ? new Date(win.tournament_date).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })
                            : '—'}
                        </div>
                      </Link>
                    ))}
                  </div>

                  {/* Bottom padding */}
                  <div className="h-3" />
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
