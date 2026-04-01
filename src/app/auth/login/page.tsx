'use client';

import AuthForm from '@/components/auth/AuthForm';
import { Lightning } from '@/components/ui/hero-odyssey';
import { motion } from 'framer-motion';

export default function LoginPage() {
  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 overflow-hidden bg-black">
      {/* Background Winners Style */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
        className="absolute inset-0 z-0 overflow-hidden"
      >
        {/* Dark base */}
        <div className="absolute inset-0 bg-black/60 z-10" />
        
        {/* Gold glow blob */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-b from-[#ffaa00]/20 to-[#ff5500]/5 blur-3xl" />
        
        {/* Lightning — gold hue ~40 */}
        <div className="absolute inset-0">
          <Lightning hue={40} xOffset={0} speed={1.2} intensity={0.6} size={1.8} />
        </div>
        
        {/* Sphere / Aura */}
        <div className="absolute top-[60%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle_at_25%_90%,_#3a2500_10%,_#000000cc_60%,_#000000f0_100%)] backdrop-blur-3xl" />
        
        {/* Top/Bottom Faders */}
        <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-black to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black to-transparent" />
      </motion.div>
      
      {/* Content */}
      <div className="relative z-20 w-full max-w-md">
        <AuthForm mode="login" />
      </div>
    </div>
  );
}
