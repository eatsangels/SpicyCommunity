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
      redirectTo: `${window.location.origin}/auth/callback?next=/es/auth/update-password`,
    });

    if (resetError) {
      setError(resetError.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`uno-card p-10 bg-zinc-900 border-4 border-[#ffaa55] shadow-2xl relative overflow-hidden`}
        >
          {/* Decorative corner numbers (UNO style) */}
          <div className="absolute top-4 left-4 text-4xl font-black opacity-10">?</div>
          <div className="absolute bottom-4 right-4 text-4xl font-black opacity-10">?</div>

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="text-center space-y-2">
              <h2 className="text-4xl font-black italic uppercase gradient-text">
                  {t('recover_password')}
              </h2>
            </div>

            {error && (
              <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-xs text-red-200 font-bold uppercase tracking-wider text-center">
                {error}
              </div>
            )}

            {success ? (
              <div className="p-6 bg-green-500/20 border border-green-500/50 rounded-xl text-center space-y-4">
                <p className="text-green-200 font-bold uppercase tracking-wider">
                  {t('email_sent')}
                </p>
                <Link href="/auth/login" className="text-xs text-white/50 hover:text-white underline block pt-4 uppercase font-black tracking-widest">
                  {t('login')}
                </Link>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/50 px-2">{t('email')}</label>
                    <input
                      type="email"
                      required
                      className="w-full h-14 bg-black/40 border-2 border-white/5 rounded-2xl px-5 font-bold outline-none focus:border-white/20 transition-all"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={loading}
                  className={`w-full h-16 bg-[#ffaa55] hover:brightness-110 text-black font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all active:scale-95`}
                >
                  {loading ? "..." : t('send_recovery_link')}
                </Button>

                <div className="text-center pt-4">
                  <Link 
                    href="/auth/login"
                    className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors block"
                  >
                    {t('cancel')}
                  </Link>
                </div>
              </>
            )}
          </form>
        </motion.div>
      </div>
    </div>
  );
}
