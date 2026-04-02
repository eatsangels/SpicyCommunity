import { TournamentService } from "@/lib/services/tournament-service";
import Link from "next/link";
import { Trophy, Zap, Users, Clock } from "lucide-react";
import { getTranslations, getLocale } from "next-intl/server";
import UpcomingCalendar from "@/components/home/UpcomingCalendar";
import { createClient } from "@/lib/supabase/server";

export default async function TournamentsPage() {
  const t = await getTranslations("Tournament");
  const tc = await getTranslations("Common");
  const locale = await getLocale();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch all tournaments for general stats
  const tournaments = await TournamentService.getAllTournaments();
  const now = new Date().toISOString();
  const active = tournaments?.filter((t) => 
    t.status === "in_progress" || 
    (t.status !== "completed" && t.scheduled_at && t.scheduled_at <= now)
  ) ?? [];
  const completedTournaments = tournaments?.filter((t) => t.status === "completed") ?? [];

  // Specifically fetch scheduled tournaments with full relational data needed for the Calendar widget
  const { data: scheduledTournaments } = await supabase
    .from('tournaments')
    .select('*, participants(id, name), tournament_likes(user_id)')
    .eq('status', 'scheduled')
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true });

  const totalTournaments = tournaments?.length || 0;
  const totalTeams = tournaments?.reduce((acc, t) => acc + (t.participants?.length || 0), 0) || 0;

  return (
    <div className="relative min-h-screen bg-black text-white px-4 pt-24 pb-10 overflow-hidden">
      {/* BACKGROUND DECOR */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 opacity-20 blur-[2px] mix-blend-screen">
          <img src="/hero-bg.png" alt="" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/60 to-black" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#ffaa00] blur-[150px] rounded-full opacity-10" />
        <div className="absolute top-[40%] right-[-10%] w-[40%] h-[40%] bg-[#ff5555] blur-[150px] rounded-full opacity-10" />
      </div>

      {/* CONTENT WAPPER */}
      <div className="relative z-10">
        {/* Header */}
      <div className="max-w-5xl mx-auto mb-6 text-center">
        <div className="inline-flex items-center gap-2 text-[#ffaa00] text-[10px] font-black uppercase tracking-[0.3em] mb-4 bg-[#ffaa00]/10 border border-[#ffaa00]/20 px-4 py-1.5 rounded-full shadow-[0_0_20px_rgba(255,170,0,0.1)]">
          <Zap size={10} className="animate-pulse" />
          SPICY COMMUNITY
        </div>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black italic tracking-tighter uppercase mb-4 gradient-text-luxury" style={{ textShadow: "0 0 80px rgba(255,170,0,0.3)" }}>
          {tc("tournaments") || "Tournaments"}
        </h1>
        <p className="text-white/40 text-[9px] md:text-[10px] tracking-[0.4em] uppercase font-bold max-w-xl mx-auto mb-6">
          {tc("live_now") || "Live Arena Updates"}
        </p>

        {/* Global Stats Grid */}
        <div className="grid grid-cols-3 gap-3 md:gap-6 w-full max-w-3xl mx-auto mb-4">
          <div className="flex flex-col items-center p-4 md:p-6 bg-white/5 border border-white/10 rounded-[2rem] backdrop-blur-md shadow-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="text-2xl md:text-4xl font-black text-white leading-none mb-1">{totalTournaments}</span>
            <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-[#ffaa00] text-center">TOTALS</span>
          </div>
          <div className="flex flex-col items-center p-4 md:p-6 bg-[#ffaa00]/5 border border-[#ffaa00]/20 rounded-[2rem] backdrop-blur-md shadow-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-[#ffaa00]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="text-2xl md:text-4xl font-black text-[#ffaa00] leading-none mb-1">{active.length}</span>
            <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-[#ffaa00]/70 text-center flex items-center gap-1">
               LIVE
            </span>
          </div>
          <div className="flex flex-col items-center p-4 md:p-6 bg-white/5 border border-white/10 rounded-[2rem] backdrop-blur-md shadow-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="text-2xl md:text-4xl font-black text-white leading-none mb-1">{totalTeams}</span>
            <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-white/40 text-center">TEAMS</span>
          </div>
        </div>
      </div>

      {/* UPCOMING CALENDAR */}
      <div className="max-w-5xl mx-auto mb-8">
        <UpcomingCalendar tournaments={scheduledTournaments as any} locale={locale} user={user} compact={true} />
      </div>

      {/* Active Tournaments */}
      {active.length > 0 && (
        <section className="max-w-5xl mx-auto mb-14">
          <div className="flex items-center gap-3 mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ffaa00] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ffaa00]" />
            </span>
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#ffaa00]">
              {tc("live_now")}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {active.map((tournament) => (
              <Link
                key={tournament.id}
                href={`/tournaments/${tournament.id}`}
                className="group relative overflow-hidden rounded-2xl border border-[#ffaa00]/30 bg-[#ffaa00]/5 hover:border-[#ffaa00]/60 hover:bg-[#ffaa00]/10 transition-all duration-500 p-6 flex flex-col gap-5 shadow-[0_0_50px_rgba(255,170,0,0.05)]"
              >
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#ffaa00]/40 to-transparent" />
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-xl font-black italic tracking-tight uppercase group-hover:text-[#ffaa00] transition-colors break-words leading-tight">
                    {tournament.name}
                  </h3>
                  <Trophy size={20} className="text-[#ffaa00] shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                </div>
                <div className="flex items-center gap-4 text-[10px] text-white/40 font-bold uppercase tracking-widest">
                  <span className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md">
                    <Users size={10} />
                    {tournament.participants?.length ?? 0} TEAMS
                  </span>
                  <span className="flex items-center gap-1.5 text-[#ffaa00] font-black">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ffaa00] animate-pulse" />
                    {tc("live")}
                  </span>
                </div>
                <div className="mt-auto text-[10px] font-black uppercase tracking-[0.2em] text-[#ffaa00]/60 group-hover:text-[#ffaa00] transition-all flex items-center gap-2">
                  {tc("view_bracket")} <Zap size={10} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Other Tournaments (completed) */}
      {completedTournaments.length > 0 && (
        <section className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Clock size={12} className="text-[#ffaa00]" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#ffaa00]">
              {t("status.completed")}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedTournaments.map((tournament) => (
              <Link
                key={tournament.id}
                href={`/tournaments/${tournament.id}`}
                className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.05] transition-all duration-300 p-6 flex flex-col gap-5"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-black italic tracking-tight uppercase text-white/40 group-hover:text-white transition-colors break-words leading-tight">
                    {tournament.name}
                  </h3>
                  <Trophy size={18} className="text-white/10 shrink-0 mt-0.5" />
                </div>
                <div className="flex items-center gap-4 text-[10px] text-white/30 font-bold uppercase tracking-widest">
                  <span className="flex items-center gap-1.5">
                    <Users size={10} />
                    {tournament.participants?.length ?? 0} TEAMS
                  </span>
                  <span className="text-white/20 font-black">
                    {tournament.status === "completed" ? t("status.completed") : t("status.draft")}
                  </span>
                </div>
                <div className="mt-auto text-[9px] font-black uppercase tracking-[0.2em] text-white/20 group-hover:text-white/50 transition-colors">
                  {tc("view_results")} →
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {(!tournaments || tournaments.length === 0) && (
        <div className="max-w-5xl mx-auto text-center py-32">
          <div className="relative inline-block mb-8">
            <Trophy size={64} className="text-white/5 mx-auto" />
            <div className="absolute inset-0 bg-[#ffaa00]/10 blur-3xl rounded-full" />
          </div>
          <p className="text-white/20 text-xs uppercase tracking-[0.5em] font-black italic">
            {t("waiting_challengers") || "Waiting for Challengers"}
          </p>
        </div>
      )}
      </div>
    </div>
  );
}
