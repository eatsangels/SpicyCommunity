import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import { Trophy, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Link } from '@/i18n/routing';

export default async function WinnersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const t = await getTranslations('Winners');
  const params = await searchParams;
  const page = parseInt(params.page || '1', 10);
  const itemsPerPage = 12;
  const from = (page - 1) * itemsPerPage;
  const to = from + itemsPerPage - 1;

  const supabase = await createClient();
  
  // Usamos la vista SQL 'tournament_champions'
  const { data: winners, count } = await supabase
    .from('tournament_champions')
    .select('*', { count: 'exact' })
    .order('tournament_date', { ascending: false })
    .range(from, to);

  const totalPages = Math.ceil((count || 0) / itemsPerPage);

  return (
    <div className="min-h-screen bg-black text-white pt-32 pb-24 px-8 md:px-16 selection:bg-[#ffaa00] selection:text-black">
        <div className="max-w-7xl mx-auto space-y-16">
            
            {/* Cabecera */}
            <div className="space-y-4 text-center md:text-left flex flex-col md:flex-row justify-between items-center">
                <div>
                   <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter gradient-text leading-tight">
                       {t('title')}
                   </h1>
                   <p className="text-[12px] uppercase font-black tracking-[0.4em] text-white/40 mt-2">
                       {t('subtitle')}
                   </p>
                </div>
                <div className="hidden md:flex items-center gap-4 bg-white/5 px-6 py-3 rounded-2xl border border-white/10 shadow-2xl">
                   <Trophy className="text-[#ffaa00]" size={32} />
                   <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-black tracking-widest text-[#ffaa00]">{t('total_champions')}</span>
                      <span className="text-2xl font-black">{count || 0}</span>
                   </div>
                </div>
            </div>

            {/* Grid de Ganadores */}
            {(!winners || winners.length === 0) ? (
                <div className="py-32 flex flex-col items-center justify-center text-center opacity-30 gap-6 border border-dashed border-white/10 rounded-[3rem]">
                    <Trophy size={64} className="grayscale" />
                    <div className="space-y-2">
                       <h2 className="text-2xl font-black tracking-widest uppercase">{t('empty_title')}</h2>
                       <p className="font-medium text-white/50">{t('empty_description')}</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {winners.map((winner) => (
                        <div key={winner.tournament_id} className="group relative bg-[#0a0a0a] border border-white/10 rounded-[2rem] overflow-hidden hover:border-[#ffaa00]/30 transition-all hover:-translate-y-2 shadow-xl hover:shadow-[#ffaa00]/10">
                            
                            {/* Brillo interno */}
                            <div className="absolute inset-0 bg-gradient-to-b from-[#ffaa00]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="p-8 flex flex-col items-center text-center gap-6 relative z-10">
                                
                                <div className="absolute top-4 right-4 bg-black/50 p-2 rounded-full border border-white/10 backdrop-blur-md">
                                    <Trophy size={16} className="text-[#ffaa00]" />
                                </div>

                                <div className="w-32 h-32 rounded-full bg-black border-4 border-[#ffaa00]/20 flex items-center justify-center overflow-hidden shadow-2xl group-hover:border-[#ffaa00] transition-colors">
                                   {winner.winner_logo ? (
                                       <img src={winner.winner_logo || undefined} alt={winner.winner_name || ''} className="w-full h-full object-cover" />
                                   ) : (
                                       <span className="text-5xl font-black text-[#ffaa00]/30">{(winner.winner_name ?? 'W')[0]}</span>
                                   )}
                                </div>
                                
                                <div className="space-y-1 w-full">
                                    <h3 className="text-2xl font-black tracking-tighter uppercase truncate w-full" title={winner.winner_name || undefined}>
                                        {winner.winner_name}
                                    </h3>
                                    <div className="h-px w-12 bg-[#ffaa00]/30 mx-auto my-3" />
                                    <p className="text-[10px] font-bold tracking-widest uppercase text-white/40 truncate w-full" title={winner.tournament_name || undefined}>
                                        {winner.tournament_name}
                                    </p>
                                </div>
                                
                                <div className="flex items-center gap-2 text-[9px] uppercase font-black tracking-widest text-[#ffaa00]/60 bg-[#ffaa00]/10 px-4 py-2 rounded-full w-full justify-center mt-2 border border-[#ffaa00]/10">
                                    <Calendar size={12} />
                                    {winner.tournament_date ? new Date(winner.tournament_date).toLocaleDateString() : '—'}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Paginación */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-8 pt-12">
                    <Link 
                        href={`/winners?page=${page > 1 ? page - 1 : 1}`} 
                        className={`p-4 rounded-full border border-white/10 hover:bg-white/5 transition-colors ${page === 1 ? 'opacity-30 pointer-events-none' : ''}`}
                    >
                        <ChevronLeft size={24} />
                    </Link>
                    
                    <div className="text-[12px] font-black uppercase tracking-widest text-white/50">
                        {page} <span className="opacity-30 mx-2">/</span> {totalPages}
                    </div>

                    <Link 
                        href={`/winners?page=${page < totalPages ? page + 1 : totalPages}`} 
                        className={`p-4 rounded-full border border-white/10 hover:bg-white/5 transition-colors ${page === totalPages ? 'opacity-30 pointer-events-none' : ''}`}
                    >
                        <ChevronRight size={24} />
                    </Link>
                </div>
            )}
            
        </div>
    </div>
  );
}
