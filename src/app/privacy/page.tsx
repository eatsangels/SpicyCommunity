import { Metadata } from "next";
import { Zap, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | Spicy Community",
  description: "Read the Privacy Policy for Spicy Community tournament engine.",
};

export default function PrivacyPage() {
  return (
    <div className="relative min-h-screen bg-black text-white px-8 pt-32 pb-20 overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-[#ffaa00] blur-[150px] rounded-full opacity-5" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-[#ff5555] blur-[150px] rounded-full opacity-5" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10 space-y-12">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="inline-flex items-center gap-2 text-[#ffaa00] text-[10px] font-black uppercase tracking-[0.3em] bg-[#ffaa00]/10 border border-[#ffaa00]/20 px-4 py-1.5 rounded-full">
            <Shield size={12} />
            SECURITY CENTER
          </div>
          <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase gradient-text-luxury">
            Privacy Policy
          </h1>
          <p className="text-white/40 text-[10px] uppercase font-black tracking-widest leading-relaxed max-w-lg">
            Last Updated: April 2026 • Your data protection is our priority in the Spicy Arena.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 text-sm leading-relaxed text-white/60">
          <section className="space-y-4 bg-white/5 p-8 rounded-[2rem] border border-white/10 hover:border-[#ffaa00]/20 transition-all">
            <h2 className="text-[#ffaa00] font-black uppercase tracking-widest flex items-center gap-2 text-lg">
              <Zap size={16} /> 1. Information Collection
            </h2>
            <p>
              We collect information that you provide directly to us when you create an account, participate in a tournament, or communicate with us. This includes your username, email address, and any tournament-related data (team names, logos, game tags).
            </p>
          </section>

          <section className="space-y-4 bg-white/5 p-8 rounded-[2rem] border border-white/10 hover:border-[#ffaa00]/20 transition-all">
            <h2 className="text-[#ffaa00] font-black uppercase tracking-widest flex items-center gap-2 text-lg">
              <Zap size={16} /> 2. Data Usage
            </h2>
            <p>
              We use the collected information to provide, maintain, and improve our tournament management services, including processing tournament registrations, displaying public leaderboards, and communicating platform updates.
            </p>
          </section>

          <section className="space-y-4 bg-white/5 p-8 rounded-[2rem] border border-white/10 hover:border-[#ffaa00]/20 transition-all">
            <h2 className="text-[#ffaa00] font-black uppercase tracking-widest flex items-center gap-2 text-lg">
              <Zap size={16} /> 3. Data Protection (Supabase)
            </h2>
            <p>
              Your data is stored securely using Supabase infrastructure with standard Row-Level Security (RLS) policies. We do not sell your personal data to third parties. Public information like tournament results and usernames will be visible to other community members.
            </p>
          </section>

          <section className="space-y-4 bg-white/5 p-8 rounded-[2rem] border border-white/10 hover:border-[#ffaa00]/20 transition-all">
            <h2 className="text-[#ffaa00] font-black uppercase tracking-widest flex items-center gap-2 text-lg">
              <Zap size={16} /> 4. Your Rights
            </h2>
            <p>
              You have the right to access, correct, or delete your personal information at any time through your account settings or by contacting the Spicy Community administration.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
