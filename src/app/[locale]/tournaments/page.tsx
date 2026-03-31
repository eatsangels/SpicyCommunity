import { TournamentService } from "@/lib/services/tournament-service";
import Link from "next/link";
import { Trophy, Zap, Users, Clock } from "lucide-react";

export default async function TournamentsPage() {
  const tournaments = await TournamentService.getAllTournaments();

  const active = tournaments?.filter((t) => t.status === "in_progress") ?? [];
  const other = tournaments?.filter((t) => t.status !== "in_progress") ?? [];

  return (
    <div className="min-h-screen bg-black text-white px-4 py-10">
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-12 text-center">
        <div className="inline-flex items-center gap-2 text-[#ffaa00] text-[10px] font-bold uppercase tracking-[0.3em] mb-4">
          <Zap size={12} className="animate-pulse" />
          SPICY COMMUNITY
          <Zap size={12} className="animate-pulse" />
        </div>
        <h1 className="text-5xl sm:text-6xl font-black italic tracking-tighter uppercase mb-3">
          Torneos
        </h1>
        <p className="text-white/40 text-sm tracking-widest uppercase">
          Sigue el bracket en tiempo real
        </p>
      </div>

      {/* Active Tournaments */}
      {active.length > 0 && (
        <section className="max-w-5xl mx-auto mb-14">
          <div className="flex items-center gap-3 mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ffaa00] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ffaa00]" />
            </span>
            <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-[#ffaa00]">
              En Vivo
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {active.map((t) => (
              <Link
                key={t.id}
                href={`/tournaments/${t.id}`}
                className="group relative overflow-hidden rounded-lg border border-[#ffaa00]/20 bg-[#ffaa00]/5 hover:border-[#ffaa00]/60 hover:bg-[#ffaa00]/10 transition-all duration-300 p-6 flex flex-col gap-4"
              >
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#ffaa00]/60 to-transparent" />
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-black italic tracking-tight uppercase group-hover:text-[#ffaa00] transition-colors break-words leading-tight">
                    {t.name}
                  </h3>
                  <Trophy size={18} className="text-[#ffaa00] shrink-0 mt-0.5" />
                </div>
                <div className="flex items-center gap-4 text-[10px] text-white/40 font-bold uppercase tracking-widest">
                  <span className="flex items-center gap-1.5">
                    <Users size={10} />
                    {t.participants?.length ?? 0} jugadores
                  </span>
                  <span className="flex items-center gap-1.5 text-[#ffaa00]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ffaa00] animate-pulse" />
                    EN VIVO
                  </span>
                </div>
                <div className="mt-auto text-[9px] font-bold uppercase tracking-widest text-[#ffaa00]/60 group-hover:text-[#ffaa00] transition-colors">
                  Ver Bracket →
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Other Tournaments (completed / draft) */}
      {other.length > 0 && (
        <section className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Clock size={12} className="text-white/30" />
            <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-white/30">
              Completados
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {other.map((t) => (
              <Link
                key={t.id}
                href={`/tournaments/${t.id}`}
                className="group relative overflow-hidden rounded-lg border border-white/5 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04] transition-all duration-300 p-6 flex flex-col gap-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-black italic tracking-tight uppercase text-white/50 group-hover:text-white transition-colors break-words leading-tight">
                    {t.name}
                  </h3>
                  <Trophy size={16} className="text-white/20 shrink-0 mt-0.5" />
                </div>
                <div className="flex items-center gap-4 text-[10px] text-white/30 font-bold uppercase tracking-widest">
                  <span className="flex items-center gap-1.5">
                    <Users size={10} />
                    {t.participants?.length ?? 0} jugadores
                  </span>
                  <span className="text-white/20">
                    {t.status === "completed" ? "COMPLETO" : "BORRADOR"}
                  </span>
                </div>
                <div className="mt-auto text-[9px] font-bold uppercase tracking-widest text-white/20 group-hover:text-white/50 transition-colors">
                  Ver Resultados →
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {(!tournaments || tournaments.length === 0) && (
        <div className="max-w-5xl mx-auto text-center py-24">
          <Trophy size={48} className="text-white/10 mx-auto mb-6" />
          <p className="text-white/20 text-sm uppercase tracking-widest font-bold">
            No hay torneos disponibles aún
          </p>
        </div>
      )}
    </div>
  );
}
