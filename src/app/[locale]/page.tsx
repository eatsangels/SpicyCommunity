'use client';

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/routing";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

import LocaleSwitcher from '@/components/i18n/LocaleSwitcher';

export default function HomePage() {
  const t = useTranslations("Index");
  const tc = useTranslations("Common");
  const ta = useTranslations("Auth");
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, -100]); // Content moves up
  const y2 = useTransform(scrollY, [0, 500], [0, 60]);   // Subtle background down
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);

  const [recentPlayers, setRecentPlayers] = useState<any[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const fetchPlayers = async () => {
      const { data, error } = await supabase
        .from('participants')
        .select('*, tournaments(name)')
        .order('created_at', { ascending: false })
        .limit(12);
      
      if (!error) setRecentPlayers(data || []);
      setLoadingPlayers(false);
    };

    fetchPlayers();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.refresh();
  };

  return (
    <div className="relative min-h-screen bg-black text-white selection:bg-[#ffaa00] selection:text-black overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[110vh] flex flex-col items-center justify-center py-32 px-4 shadow-none">
        {/* Background Layer with Parallax & Logo Watermark */}
        <div className="absolute inset-0 z-0 overflow-hidden">
           <motion.div 
             style={{ y: y2 }}
             className="absolute inset-0 flex items-center justify-center pointer-events-none"
           >
              {/* Main Arena Background */}
              <Image 
                src="/hero-bg.png" 
                alt="Arena Background" 
                fill 
                priority
                className="object-cover opacity-30 scale-150 blur-[1px]"
              />
              
              {/* GIGANTIC LOGO BEHIND EVERYTHING */}
              <div className="relative w-[1000px] h-[1000px] opacity-10 blur-[2px] mix-blend-screen">
                 <Image 
                    src="/logo.png" 
                    alt="Logo Watermark" 
                    fill 
                    sizes="1000px"
                    className="object-contain"
                 />
              </div>
           </motion.div>
           <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/90 to-transparent z-10" />
           <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-transparent" />
           <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        </div>

        <motion.div 
          style={{ y: y1 }}
          className="relative z-10 flex flex-col items-center text-center space-y-8 max-w-5xl"
        >
          <div className="space-y-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="px-6 py-2 bg-[#ff3333] rounded-full inline-block shadow-[0_0_40px_rgba(255,51,51,0.4)]"
            >
                <span className="text-[10px] uppercase font-black tracking-[0.5em] text-white">Master the Deck</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-8xl md:text-[11rem] font-black tracking-tighter leading-[0.85] uppercase italic"
            >
              Wild <br />
              <span className="text-[#ffaa00]">Glory</span>
            </motion.h1>
          </div>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="max-w-2xl text-xl md:text-2xl text-white/40 font-medium italic"
          >
            The ultimate tournament engine for UNO masters. Create brackets, track scores, and shout UNO! in real-time.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap justify-center gap-6 pt-12"
          >
            <Link href="/tournaments">
              <Button size="lg" className="h-20 px-16 rounded-full text-2xl font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 bg-[#ffaa00] text-black hover:bg-[#ffaa00]/90 shadow-[0_0_60px_rgba(255,170,0,0.2)]">
                {tc("tournament")}
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div 
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute bottom-10 flex flex-col items-center gap-4 opacity-10"
        >
            <span className="text-[8px] uppercase font-black tracking-widest">Scroll to explore</span>
            <div className="w-px h-12 bg-white" />
        </motion.div>
      </section>

      {/* Live Community Feed */}
      <section className="relative z-10 py-32 space-y-16">
         <div className="px-8 md:px-16 space-y-4">
            <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter gradient-text">Live Arena</h2>
            <p className="text-[10px] uppercase font-black tracking-[0.5em] text-white/20">Recently joined the table</p>
         </div>

         <div className="flex overflow-hidden gap-6 px-8 md:px-16 group">
            <motion.div 
                className="flex gap-6 shrink-0"
                animate={{ x: [0, -1000] }}
                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            >
                {[...recentPlayers, ...recentPlayers].map((player, i) => (
                    <div 
                        key={`${player.id}-${i}`}
                        className="w-64 h-80 bg-zinc-900 border border-white/5 rounded-[2.5rem] p-8 flex flex-col items-center justify-between group/card hover:border-[#ffaa00]/40 transition-all hover:scale-105"
                    >
                        <div className="w-24 h-24 rounded-3xl bg-black border border-white/5 shadow-2xl overflow-hidden flex items-center justify-center p-2">
                           {player.logo_url ? (
                               <img src={player.logo_url} className="w-full h-full object-contain" alt={player.name} />
                           ) : (
                               <div className="text-4xl font-black text-[#ffaa00]/20">{player.name[0]}</div>
                           )}
                        </div>
                        <div className="text-center space-y-2">
                            <h4 className="text-lg font-black uppercase tracking-tight truncate w-full">{player.name}</h4>
                            <p className="text-[9px] uppercase font-bold tracking-widest text-[#ffaa00]">{player.tournaments?.name || 'Local Duel'}</p>
                        </div>
                        <div className="px-4 py-1.5 rounded-full bg-white/5 text-[8px] font-black uppercase tracking-widest text-white/30">
                            Joined {new Date(player.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                ))}
                {recentPlayers.length === 0 && !loadingPlayers && (
                    <div className="text-white/10 font-black uppercase text-xl italic tracking-tighter">Waiting for challengers...</div>
                )}
            </motion.div>
         </div>
      </section>
      
      {/* Feature Grid */}
      <section className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 px-8 md:px-16 py-32 bg-black">
        {[
            { title: "Real-time Sync", desc: "Instant updates across all spectators and players." },
            { title: "Unlimited Players", desc: "Scale from 4 to 4,000 without missing a beat." },
            { title: "Pro Analytics", desc: "In-depth stats and performance tracking for every game." }
        ].map((feat, i) => (
            <motion.div 
                key={i}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-10 glass rounded-3xl space-y-4 hover:border-primary/50 transition-colors"
            >
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-black">0{i+1}</div>
                <h3 className="text-2xl font-black uppercase tracking-tighter">{feat.title}</h3>
                <p className="text-white/40 leading-relaxed font-medium">{feat.desc}</p>
            </motion.div>
        ))}
      </section>

      <footer className="relative z-10 border-t border-white/5 py-16 text-center text-white/20 text-[10px] font-black uppercase tracking-[0.5em]">
        Spicy Community <span className="text-primary">•</span> Built for Champions
      </footer>

      <style jsx global>{`
        @keyframes pulse-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
