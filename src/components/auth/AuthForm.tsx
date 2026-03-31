'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from '@/i18n/routing';

export default function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const t = useTranslations('Auth');
  const router = useRouter();
  const supabase = createClient();
  
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [teamName, setTeamName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isPasswordStrong = (pwd: string) => {
    return pwd.length >= 8 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setError(t('passwords_dont_match'));
        setLoading(false);
        return;
      }
      if (!isPasswordStrong(password)) {
        setError(t('password_weak'));
        setLoading(false);
        return;
      }
    }

    const { error: authError } = mode === 'login' 
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              username,
              team_name: teamName
            }
          }
        });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      if (mode === 'register') {
        setSuccess(true);
      } else {
        router.push('/');
        router.refresh();
      }
    }
  };

  const cardColor = mode === 'login' ? 'bg-[#ff5555]' : 'bg-[#55aa55]';
  const cornerLetter = mode === 'login' ? t('uno_letter_login') : t('uno_letter_register');

  if (success && mode === 'register') {
    return (
      <div className="w-full max-w-sm mx-auto perspective-1000">
        <motion.div 
          initial={{ opacity: 0, rotateY: 180 }}
          animate={{ opacity: 1, rotateY: 0 }}
          transition={{ duration: 0.8, type: 'spring' }}
          className="relative w-full aspect-[2.5/3.5] bg-[#ffaa00] rounded-[2rem] shadow-2xl overflow-hidden p-6 flex flex-col items-center justify-center border-8 border-white"
        >
          <div className="absolute inset-0 bg-black/10 mix-blend-overlay pointer-events-none"></div>
          
          <div className="relative z-10 bg-white p-6 rounded-[50%] w-full aspect-[4/3] flex flex-col items-center justify-center transform -rotate-12 border-4 border-black shadow-[8px_8px_0_rgba(0,0,0,0.2)]">
            <h2 className="text-4xl font-black italic uppercase text-black">
              {t('uno_success_title')}
            </h2>
            <div className="mt-2 text-center text-xs font-bold uppercase tracking-widest text-[#ffaa00]" style={{ WebkitTextStroke: '0.5px black' }}>
              {t('email_sent')}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto py-8">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className={`relative w-full rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden ${cardColor} transition-colors duration-500`}
      >
        {/* White Inner Border mimicking UNO */}
        <div className="absolute inset-3 rounded-[1.8rem] border-[6px] border-white/90 pointer-events-none z-10 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]"></div>
        
        {/* Corner Symbols */}
        <div className="absolute top-6 left-6 flex flex-col items-center z-10 drop-shadow-[2px_2px_0_rgba(0,0,0,0.3)]">
          <span className="text-white font-black text-3xl italic leading-none" style={{ WebkitTextStroke: '1px black' }}>{cornerLetter}</span>
          <span className="text-white text-4xl leading-none mt-1">♠</span>
        </div>
        <div className="absolute bottom-6 right-6 flex flex-col items-center z-10 rotate-180 drop-shadow-[2px_2px_0_rgba(0,0,0,0.3)]">
          <span className="text-white font-black text-3xl italic leading-none" style={{ WebkitTextStroke: '1px black' }}>{cornerLetter}</span>
          <span className="text-white text-4xl leading-none mt-1">♠</span>
        </div>

        {/* Heavy Black Oval Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] aspect-square flex items-center justify-center pointer-events-none z-0">
          <div className="w-full h-full bg-[#111] rounded-[50%] transform -rotate-[15deg] shadow-[inset_0_0_50px_rgba(0,0,0,1)] border-[8px] border-white"></div>
        </div>

        {/* Content Container */}
        <div className="relative z-20 px-10 py-16 flex flex-col items-center">
          
          {/* Stylized Title */}
          <div className="mb-8 relative transform -rotate-[5deg]">
            <h2 
              className="text-[#ffcc00] font-black italic uppercase text-5xl tracking-tighter drop-shadow-[4px_4px_0_rgba(0,0,0,1)]"
              style={{ WebkitTextStroke: '2px black' }}
            >
              {mode === 'login' ? t('uno_title_login') : t('uno_title_register')}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-3 bg-red-600 border-2 border-white rounded-xl text-xs text-white font-bold uppercase tracking-wider text-center drop-shadow-md"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-3">
              {mode === 'register' && (
                <>
                  <div className="group relative">
                    <input
                      type="text"
                      required
                      placeholder={t('username')}
                      className="w-full h-12 bg-white text-black placeholder-black/40 border-4 border-black rounded-full px-5 font-black uppercase tracking-wider outline-none focus:scale-105 transition-transform"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                  <div className="group relative">
                    <input
                      type="text"
                      placeholder={t('team_name')}
                      className="w-full h-12 bg-white text-black placeholder-black/40 border-4 border-black rounded-full px-5 font-black uppercase tracking-wider outline-none focus:scale-105 transition-transform"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="group relative">
                <input
                  type="email"
                  required
                  placeholder={t('email')}
                  className="w-full h-12 bg-white text-black placeholder-black/40 border-4 border-black rounded-full px-5 font-black uppercase tracking-wider outline-none focus:scale-105 transition-transform"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="group relative">
                <input
                  type="password"
                  required
                  placeholder={t('password')}
                  className="w-full h-12 bg-white text-black placeholder-black/40 border-4 border-black rounded-full px-5 font-black uppercase tracking-wider outline-none focus:scale-105 transition-transform"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {mode === 'register' && (
                <div className="group relative">
                  <input
                    type="password"
                    required
                    placeholder={t('confirm_password')}
                    className="w-full h-12 bg-white text-black placeholder-black/40 border-4 border-black rounded-full px-5 font-black uppercase tracking-wider outline-none focus:scale-105 transition-transform"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              )}
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full h-14 mt-6 bg-[#ffcc00] hover:bg-yellow-300 text-black border-4 border-black font-black uppercase text-xl italic tracking-tighter rounded-full shadow-[0_5px_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-[5px] transition-all"
            >
              {loading ? "..." : (mode === 'login' ? t('uno_action_login') : t('uno_action_register'))}
            </Button>

            {mode === 'login' && (
              <div className="text-center mt-4">
                <Link 
                  href="/auth/recovery"
                  className="text-[10px] font-black uppercase tracking-widest text-[#ffcc00] hover:text-white transition-colors"
                >
                  {t('forgot_password')}
                </Link>
              </div>
            )}

            <div className="text-center mt-6">
              <Link 
                href={mode === 'login' ? '/auth/register' : '/auth/login'}
                className="inline-block bg-black/50 backdrop-blur-sm border-2 border-black/80 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-white hover:bg-black transition-colors"
              >
                {mode === 'login' ? t('no_account') : t('has_account')}
              </Link>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
