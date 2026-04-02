'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from '@/i18n/routing';
import { Eye, EyeOff } from 'lucide-react';

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isPasswordStrong = (pwd: string) => {
    return pwd.length >= 8 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
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
              emailRedirectTo: `${window.location.origin}/api/auth/callback`,
              data: {
                username,
                team_name: teamName
              }
            }
          });

      if (authError) {
        setError(authError.message);
      } else {
        if (mode === 'register') {
          setSuccess(true);
        } else {
          router.push('/');
          router.refresh();
        }
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const isRegister = mode === 'register';

  if (success && isRegister) {
    return (
      <div className="w-full max-w-md mx-auto py-4 sm:py-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative w-full rounded-[1.5rem] sm:rounded-[2rem] bg-black/60 backdrop-blur-xl border border-[#ffaa00]/20 shadow-[0_30px_80px_rgba(0,0,0,0.8)] overflow-hidden p-8 sm:p-12 flex flex-col items-center justify-center text-center"
        >
          {/* Subtle Glow Background */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#ffaa00]/10 rounded-full blur-3xl pointer-events-none" />
          
          {/* Checkmark Icon */}
          <div className="relative z-10 mb-8 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-[#ffaa00] to-[#cc8800] rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(255,170,0,0.3)]">
            <svg 
              className="w-10 h-10 sm:w-12 sm:h-12 text-black drop-shadow-md" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              strokeWidth={3}
            >
              <motion.path 
                initial={{ pathLength: 0 }} 
                animate={{ pathLength: 1 }} 
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M5 13l4 4L19 7" 
              />
            </svg>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="relative z-10 space-y-3"
          >
            <h2 className="text-3xl sm:text-4xl font-black italic uppercase tracking-tighter text-white drop-shadow-lg">
              {t('uno_success_title')}
            </h2>
            <p className="text-sm sm:text-base font-medium text-white/60 leading-relaxed px-2">
              {t('email_sent')}
            </p>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto py-4 sm:py-8">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-h-[85vh] sm:max-h-none overflow-y-auto sm:overflow-visible rounded-[1.5rem] sm:rounded-[2rem] bg-black/60 backdrop-blur-xl border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.8)] custom-scrollbar"
      >
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#ffaa00] to-transparent opacity-50" />
        
        {/* Content Container */}
        <div className="relative z-20 px-6 sm:px-8 py-8 sm:py-12 flex flex-col items-center">
          
          {/* Stylized Title */}
          <div className="mb-6 sm:mb-8 text-center">
            <h2 
              className="text-[#ffaa00] font-black italic uppercase text-3xl sm:text-4xl tracking-tighter drop-shadow-xl"
              style={{ textShadow: '0 0 30px rgba(255,170,0,0.2)' }}
            >
              {mode === 'login' ? t('uno_title_login') : t('uno_title_register')}
            </h2>
            <div className="h-1 w-12 bg-[#ffaa00] mx-auto mt-2 sm:mt-3 rounded-full opacity-50" />
          </div>

          <form onSubmit={handleSubmit} className="w-full space-y-3 sm:space-y-4">
            
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-[11px] text-red-200 font-bold uppercase tracking-widest text-center"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-3">
              {isRegister && (
                <>
                  <div className="group relative">
                    <input
                      type="text"
                      required
                      placeholder={t('username')}
                      className="w-full h-14 bg-white/5 text-white placeholder-white/20 border border-white/10 rounded-2xl px-6 font-medium outline-none focus:border-[#ffaa00]/50 focus:bg-white/10 transition-all"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                  <div className="group relative">
                    <input
                      type="text"
                      placeholder={t('team_name')}
                      className="w-full h-14 bg-white/5 text-white placeholder-white/20 border border-white/10 rounded-2xl px-6 font-medium outline-none focus:border-[#ffaa00]/50 focus:bg-white/10 transition-all"
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
                  className="w-full h-14 bg-white/5 text-white placeholder-white/20 border border-white/10 rounded-2xl px-6 font-medium outline-none focus:border-[#ffaa00]/50 focus:bg-white/10 transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="group relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder={t('password')}
                  className="w-full h-14 bg-white/5 text-white placeholder-white/20 border border-white/10 rounded-2xl px-6 pr-14 font-medium outline-none focus:border-[#ffaa00]/50 focus:bg-white/10 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white/20 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {isRegister && (
                <div className="group relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    placeholder={t('confirm_password')}
                    className="w-full h-14 bg-white/5 text-white placeholder-white/20 border border-white/10 rounded-2xl px-6 pr-14 font-medium outline-none focus:border-[#ffaa00]/50 focus:bg-white/10 transition-all"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white/20 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              )}
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full h-16 mt-6 bg-[#ffaa00] hover:bg-[#ffbb11] text-black font-black uppercase text-lg italic tracking-widest rounded-2xl shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? "..." : (mode === 'login' ? t('uno_action_login') : t('uno_action_register'))}
            </Button>

            {mode === 'login' && (
              <div className="text-center mt-4">
                <Link 
                  href="/auth/recovery"
                  className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 hover:text-[#ffaa00] transition-colors"
                >
                  {t('forgot_password')}
                </Link>
              </div>
            )}

            <div className="text-center mt-8">
              <Link 
                href={mode === 'login' ? '/auth/register' : '/auth/login'}
                className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/5 border border-white/10 text-[11px] font-bold uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/10 transition-all"
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
