'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home } from 'lucide-react';
import { Lightning } from '@/components/ui/hero-odyssey';

export default function NotFound() {
  return (
    <div className="flex-1 w-full relative flex flex-col items-center justify-center p-6 pt-32 pb-24 min-h-[85vh] overflow-hidden bg-black text-white">
      {/* Background Decor */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
        className="absolute inset-0 z-0 overflow-hidden"
      >
        <div className="absolute inset-0 bg-black/60 z-10" />
        
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-b from-[#ffaa00]/10 to-[#ff5500]/5 blur-3xl" />
        
        {/* Lightning background -- Red/Orange tone */}
        <div className="absolute inset-0">
          <Lightning hue={15} xOffset={0} speed={1.2} intensity={0.5} size={1.8} />
        </div>
        
        <div className="absolute top-[60%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle_at_25%_90%,_#3a2500_10%,_#000000cc_60%,_#000000f0_100%)] backdrop-blur-3xl" />
        
        <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-black to-transparent z-10" />
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black to-transparent z-10" />
      </motion.div>
      
      {/* Content */}
      <div className="relative z-20 flex flex-col items-center text-center space-y-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 bg-[#ffaa00]/10 border border-[#ffaa00]/20 rounded-full px-4 py-1.5 shadow-[0_0_20px_rgba(255,170,0,0.1)]"
        >
          <span className="w-2 h-2 rounded-full bg-[#ffdd00] animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#ffdd00]">
            System Error
          </span>
        </motion.div>

        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-[140px] sm:text-[180px] md:text-[220px] font-black leading-none italic tracking-tighter gradient-text-luxury"
          style={{ textShadow: "0 0 80px rgba(255,170,0,0.3)" }}
        >
          404
        </motion.h1>

        <motion.div
           initial={{ y: 20, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           transition={{ duration: 0.5, delay: 0.2 }}
           className="space-y-2 mb-10"
        >
          <p className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
            Out of Bounds!
          </p>
          <p className="text-[#ffdd00]/70 text-xs sm:text-sm max-w-sm mx-auto uppercase tracking-widest font-bold">
            The page you are looking for doesn't belong to any tournament.
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="pt-4"
        >
          <Link 
            href="/"
            className="flex items-center gap-3 bg-[#ffaa00] hover:bg-white text-black px-8 py-4 rounded-2xl font-black uppercase tracking-widest transition-all duration-300 shadow-[0_0_30px_rgba(255,170,0,0.2)] hover:shadow-[0_0_50px_rgba(255,255,255,0.4)] group hover:scale-105"
          >
            <Home size={20} className="group-hover:-translate-x-1 transition-transform" />
            Return to Lobby
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
