import CreateTournamentForm from "@/components/tournament/CreateTournamentForm";
import { createClient } from '@/lib/supabase/server';
import { redirect } from '@/i18n/routing';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

export default async function EditTournamentPage({ params }: { params: Promise<{ locale: string, id: string }> }) {
  const { locale, id } = await params;
  const t = await getTranslations('Admin');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: '/auth/login', locale });
    return null;
  }

  // Authorize User
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    redirect({ href: '/', locale });
  }

  // Fetch Tournament
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('*, participants(*), matches(status, score_a, score_b)')
    .eq('id', id)
    .single();

  if (!tournament) return notFound();

  // Check if it has started (scores exist or match completed)
  const hasStarted = tournament.matches?.some((m: any) => m.status === 'completed' || m.score_a != null || m.score_b != null);

  return (
    <div className="container mx-auto py-12 px-4 space-y-8">
      <div>
        <Link 
          href="/admin/tournaments"
          className="flex w-fit items-center gap-2 text-white/30 hover:text-[#ffaa00] transition-colors text-xs font-black uppercase tracking-widest"
        >
           <ArrowLeft size={14} strokeWidth={3} /> Back to Administration
        </Link>
      </div>

      {hasStarted && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-2xl p-6 flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-4 max-w-4xl mx-auto shadow-[0_10px_40px_rgba(239,68,68,0.15)] animate-in fade-in slide-in-from-top-4">
          <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center shrink-0">
             <AlertTriangle className="text-red-500" size={24} />
          </div>
          <div>
            <h3 className="text-red-500 font-black uppercase tracking-widest text-lg mb-1 italic">Warning: Active Arena</h3>
            <p className="text-red-200/80 text-sm font-medium">This tournament currently holds live scores or completed matches. Saving any changes here will <strong className="text-white bg-red-500/20 px-1 rounded">permanently wipe</strong> the entire bracket and regenerate it from scratch.</p>
          </div>
        </div>
      )}

      <CreateTournamentForm initialData={tournament} />
    </div>
  );
}
