import { Metadata } from "next";
import { Zap, Gavel } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service | Spicy Community",
  description: "Read the Terms of Service for Spicy Community tournament engine.",
};

export default function TermsPage() {
  return (
    <div className="relative min-h-screen bg-black text-white px-8 pt-32 pb-20 overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-[#ff5555] blur-[150px] rounded-full opacity-5" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-[#ffaa00] blur-[150px] rounded-full opacity-5" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10 space-y-12">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="inline-flex items-center gap-2 text-[#ffaa00] text-[10px] font-black uppercase tracking-[0.3em] bg-[#ffaa00]/10 border border-[#ffaa00]/20 px-4 py-1.5 rounded-full">
            <Gavel size={12} />
            LEGAL ARENA
          </div>
          <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase gradient-text-luxury pr-4">
            Terms of Service
          </h1>
          <p className="text-white/40 text-[10px] uppercase font-black tracking-widest leading-relaxed max-w-lg">
            By entering the Spicy Community, you agree to follow the rules of our ecosystem.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 text-sm leading-relaxed text-white/60">
          <section className="space-y-4 bg-white/5 p-8 rounded-[2rem] border border-white/10 hover:border-[#ffaa00]/20 transition-all">
            <h2 className="text-[#ffaa00] font-black uppercase tracking-widest flex items-center gap-2 text-lg">
              <Zap size={16} /> 1. Acceptable Use
            </h2>
            <p>
              Users agree to use the platform for legitimate tournament participation and management only. Harassment, cheating, or any form of abuse during tournaments hosted in Spicy Community will lead to immediate account suspension.
            </p>
          </section>

          <section className="space-y-4 bg-white/5 p-8 rounded-[2rem] border border-white/10 hover:border-[#ffaa00]/20 transition-all">
            <h2 className="text-[#ffaa00] font-black uppercase tracking-widest flex items-center gap-2 text-lg">
              <Zap size={16} /> 2. Account Responsibility
            </h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use.
            </p>
          </section>

          <section className="space-y-4 bg-white/5 p-8 rounded-[2rem] border border-white/10 hover:border-[#ffaa00]/20 transition-all">
            <h2 className="text-[#ffaa00] font-black uppercase tracking-widest flex items-center gap-2 text-lg">
              <Zap size={16} /> 3. Fair Play
            </h2>
            <p>
              Tournament participants agree to provide accurate information and follow all tournament rules established by the administrators. Any team or player found providing misleading information (e.g., incorrect game tags) may be disqualified.
            </p>
          </section>

          <section className="space-y-4 bg-white/5 p-8 rounded-[2rem] border border-white/10 hover:border-[#ffaa00]/20 transition-all">
            <h2 className="text-[#ffaa00] font-black uppercase tracking-widest flex items-center gap-2 text-lg">
              <Zap size={16} /> 4. Disclaimer of Liability
            </h2>
            <p>
              Spicy Community provides the tournament engine "as is." We are not responsible for tournament disruptions, connectivity issues, or the behavior of participants. Administrators are responsible for the final decisions in their respective tournaments.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
