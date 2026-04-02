'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import { Link } from '@/i18n/routing';

export default function RecoveryPage() {
  const t = useTranslations('Auth');
  const supabase = createClient();
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
    });

    if (resetError) {
      setError(resetError.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  return (
    <div className="flex-1 w-full relative flex items-start justify-center p-6 pt-10 sm:pt-20 min-h-[70vh]">
      {/* Background Winners Style */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
        className="absolute inset-0 z-0 overflow-hidden"
      >
        <div className="absolute inset-0 bg-black/60 z-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-b from-[#ffaa00]/20 to-[#ff5500]/5 blur-3xl" />
        <div className="absolute top-[60%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle_at_25%_90%,_#3a2500_10%,_#000000cc_60%,_#000000f0_100%)] backdrop-blur-3xl" />
      </motion.div>

      <div className="relative z-20 w-full max-w-md mx-auto py-4 sm:py-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative w-full max-h-[85vh] sm:max-h-none overflow-y-auto sm:overflow-visible rounded-[1.5rem] sm:rounded-[2rem] bg-black/60 backdrop-blur-xl border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.8)]"
        >
          {/* Decorative element */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#ffaa00] to-transparent opacity-50" />

          <div className="relative z-20 px-6 sm:px-8 py-8 sm:py-12 flex flex-col items-center">
            
            <form onSubmit={handleSubmit} className="w-full space-y-6">
              <div className="mb-6 sm:mb-8 text-center">
                <h2 
                  className="text-[#ffaa00] font-black italic uppercase text-3xl sm:text-4xl tracking-tighter drop-shadow-xl"
                  style={{ textShadow: '0 0 30px rgba(255,170,0,0.2)' }}
                >
                    {t('recover_password')}
                </h2>
                <div className="h-1 w-12 bg-[#ffaa00] mx-auto mt-2 sm:mt-3 rounded-full opacity-50" />
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-[11px] text-red-200 font-bold uppercase tracking-widest text-center"
                >
                  {error}
                </motion.div>
              )}

              {success ? (
                <div className="p-6 bg-green-500/20 border border-green-500/30 rounded-xl text-center space-y-4">
                  <p className="text-green-200 font-bold uppercase tracking-widest text-[11px]">
                    {t('email_sent')}
                  </p>
                  <Link href="/auth/login" className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/5 border border-white/10 text-[11px] font-bold uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/10 transition-all mt-4">
                    {t('login')}
                  </Link>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="group relative">
                      <input
                        type="email"
                        required
                        placeholder={t('email')}
                        className="w-full h-14 bg-white/5 text-white placeholder-white/20 border border-white/10 rounded-2xl px-6 font-medium outline-none focus:border-[#ffaa00]/50 focus:bg-white/10 transition-all"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full h-16 mt-6 bg-[#ffaa00] hover:bg-[#ffbb11] text-black font-black uppercase text-[15px] italic tracking-widest rounded-2xl shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                  >
                    {loading ? "..." : t('send_recovery_link')}
                  </Button>

                  <div className="text-center mt-8">
                    <Link 
                      href="/auth/login"
                      className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/5 border border-white/10 text-[11px] font-bold uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/10 transition-all"
                    >
                      {t('cancel')}
                    </Link>
                  </div>
                </>
              )}
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
