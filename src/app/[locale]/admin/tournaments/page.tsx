'use client';

import { useTranslations } from 'next-intl';
import { Button } from "@/components/ui/button";
import { 
  Trophy, 
  MoreVertical, 
  Calendar, 
  Users,
  Search,
  Plus,
  Trash
} from 'lucide-react';
import { Link } from "@/i18n/routing";
import { useAlert } from '@/components/ui/UnoAlertSystem';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { deleteTournamentAction } from '@/app/actions/tournament';

export default function AdminTournaments() {
  const t = useTranslations('Admin');
  const tt = useTranslations('Tournament');
  const { confirm, toast } = useAlert();
  const supabase = createClient();
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const ok = await confirm(tt('delete_confirm_msg') || t('confirm_delete_tournament'));
    if (ok) {
       const res = await deleteTournamentAction(id);
       if (res.success) {
           setTournaments(tournaments.filter(t => t.id !== id));
           toast(tt('delete_success') || 'Tournament deleted', 'success');
       } else {
           toast(res.error || 'Failed to delete tournament', 'error');
       }
    }
  };

  useEffect(() => {
    const fetchTournaments = async () => {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*, participants(count)')
        .order('created_at', { ascending: false });
      
      if (!error) setTournaments(data || []);
      setLoading(false);
    };

    fetchTournaments();
  }, [supabase]);

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
            <h1 className="text-4xl font-black uppercase italic tracking-tighter gradient-text">
                {t('tournaments')}
            </h1>
            <p className="text-[10px] uppercase font-black tracking-widest text-white/30">
                Manage all competitive events
            </p>
        </div>
        <Link href="/tournaments/create">
          <Button className="bg-[#ffaa00] text-black hover:bg-[#ffaa00]/90 px-8 h-12 rounded-full font-black uppercase text-[11px] tracking-widest shadow-xl flex items-center gap-3">
             <Plus size={16} strokeWidth={3} />
             {tt('create_button')}
          </Button>
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="relative group max-w-md">
         <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#ffaa00] transition-colors" size={18} />
         <input 
            type="text" 
            placeholder="Search tournaments..." 
            className="w-full h-14 bg-zinc-900 border border-white/5 rounded-2xl pl-12 pr-6 font-bold outline-none focus:border-[#ffaa00]/30 transition-all text-sm"
         />
      </div>

      {/* List */}
      <div className="bg-zinc-900 border border-white/5 rounded-3xl overflow-hidden min-h-[400px]">
        {loading ? (
             <div className="flex flex-col items-center justify-center h-full pt-32 space-y-4 opacity-20">
                <Trophy size={48} className="animate-bounce" />
                <p className="text-[10px] font-black uppercase tracking-widest">Loading Arena...</p>
             </div>
        ) : tournaments.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full pt-32 space-y-4 opacity-20">
                <Trophy size={48} />
                <p className="text-[10px] font-black uppercase tracking-widest">No tournaments found</p>
             </div>
        ) : (
          <>
            <div className="grid grid-cols-4 p-6 border-b border-white/10 text-[9px] uppercase font-black tracking-[0.2em] text-white/20">
               <div>{tt('name_label')}</div>
               <div className="text-center">Participants</div>
               <div className="text-center">Created</div>
               <div className="text-right">Status</div>
            </div>
            
            {tournaments.map((tourney) => (
              <div 
                key={tourney.id} 
                onClick={() => window.location.href = `/tournaments/${tourney.id}`}
                className="grid grid-cols-4 p-6 border-b border-white/5 last:border-0 items-center hover:bg-white/2 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-4">
                   <div className="p-2 bg-white/5 rounded-lg text-[#ffaa00]">
                      <Trophy size={16} />
                   </div>
                   <span className="font-bold text-sm truncate">{tourney.name}</span>
                </div>
                <div className="text-center">
                   <span className="text-[10px] font-bold text-white/40 bg-white/5 px-2 py-1 rounded-md flex items-center justify-center gap-2 w-fit mx-auto">
                      <Users size={12} /> {tourney.participants?.[0]?.count || 0}
                   </span>
                </div>
                <div className="text-center text-[10px] font-medium text-white/30 flex items-center justify-center gap-2">
                   <Calendar size={12} /> {new Date(tourney.created_at).toLocaleDateString()}
                </div>
                <div className="flex justify-end items-center gap-4">
                   <span className={`text-[9px] uppercase font-black px-3 py-1 rounded-full ${
                      tourney.status === 'in_progress' ? 'bg-green-500/20 text-green-400' :
                      tourney.status === 'draft' ? 'bg-yellow-500/20 text-[#ffaa00]' :
                      tourney.status === 'scheduled' ? 'bg-indigo-500/20 text-indigo-400' :
                      'bg-blue-500/20 text-blue-400'
                   }`}>
                      {tourney.status}
                   </span>
                   <button 
                      onClick={(e) => handleDelete(e, tourney.id)}
                      className="text-white/20 hover:text-red-500 transition-colors"
                   >
                      <Trash size={16} />
                   </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
