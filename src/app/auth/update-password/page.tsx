'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Link } from '@/i18n/routing';

export default function UpdatePasswordPage() {
  const t = useTranslations('Auth');
  const router = useRouter();
  const supabase = createClient();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError(t('passwords_dont_match'));
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: password
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
    } else {
      router.push('/');
      router.refresh();
    }
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
          <div className="absolute top-4 left-4 text-4xl font-black opacity-10">!</div>
          <div className="absolute bottom-4 right-4 text-4xl font-black opacity-10">!</div>

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="text-center space-y-2">
              <h2 className="text-4xl font-black italic uppercase gradient-text">
                  {t('update_password')}
              </h2>
            </div>

            {error && (
              <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-xs text-red-200 font-bold uppercase tracking-wider text-center">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/50 px-2">{t('password')}</label>
                <input
                  type="password"
                  required
                  className="w-full h-14 bg-black/40 border-2 border-white/5 rounded-2xl px-5 font-bold outline-none focus:border-white/20 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/50 px-2">{t('confirm_password')}</label>
                <input
                  type="password"
                  required
                  className="w-full h-14 bg-black/40 border-2 border-white/5 rounded-2xl px-5 font-bold outline-none focus:border-white/20 transition-all"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className={`w-full h-16 bg-[#ffaa55] hover:brightness-110 text-black font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all active:scale-95`}
            >
              {loading ? "..." : t('update_password')}
            </Button>
            
            <div className="text-center pt-4">
              <Link 
                href="/"
                className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors block"
              >
                {t('cancel')}
              </Link>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
