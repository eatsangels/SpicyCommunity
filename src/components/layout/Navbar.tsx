'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/routing";
import { createClient } from '@/lib/supabase/client';
import LocaleSwitcher from '@/components/i18n/LocaleSwitcher';

import Image from 'next/image';

export default function Navbar() {
  const tc = useTranslations("Common");
  const ta = useTranslations("Auth");
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string>('user');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserAndRole = async (currentUser: any) => {
      setUser(currentUser);
      if (currentUser) {
        const { data } = await supabase.from('profiles').select('role').eq('id', currentUser.id).single();
        if (data) setRole(data.role as string);
      } else {
        setRole('user');
      }
      setLoading(false);
    };

    supabase.auth.getUser().then(({ data: { user } }) => {
      fetchUserAndRole(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      fetchUserAndRole(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole('user');
    router.refresh();
  };

  return (
    <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-8 md:px-16 py-4 bg-black border-b border-white/10">
        <div className="flex items-center gap-12">
            <div className="text-2xl font-black tracking-tighter italic flex items-center gap-4 cursor-pointer group" onClick={() => router.push('/')}>
                <div className="relative w-10 h-10 overflow-hidden">
                    <Image 
                      src="/logo.png" 
                      alt="Spicy Logo" 
                      fill 
                      className="object-contain"
                    />
                </div>
                <span className="text-[#ffaa00] uppercase tracking-tight group-hover:brightness-110 transition-all border-b-2 border-transparent group-hover:border-[#ffaa00]/40">SPICY COMMUNITY</span>
            </div>
            <div className="hidden lg:block ml-4">
                <LocaleSwitcher />
            </div>
        </div>
        
        <div className="flex items-center gap-10">
            <div className="hidden md:flex gap-10 text-[11px] font-bold uppercase tracking-[0.2em]">
                <Link href="/winners" className="text-white/60 hover:text-white transition-colors">{tc('winners')}</Link>
                <Link href="/" className="text-white/60 hover:text-white transition-colors">{tc('home')}</Link>
                {user && role === 'admin' && (
                    <Link href="/admin" className="text-[#ffaa00] hover:brightness-110 transition-all border-b border-[#ffaa00]/0 hover:border-[#ffaa00]/100 pb-1">
                        Admin
                    </Link>
                )}
            </div>

            <div className="flex items-center gap-6 min-w-[220px] justify-end">
                {loading ? (
                    <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-white animate-spin" />
                ) : user ? (
                    <div className="flex items-center gap-6">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 hidden sm:inline">{user.email}</span>
                        <Button 
                            variant="ghost" 
                            onClick={handleLogout}
                            className="h-10 px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white/60 hover:text-red-500 hover:bg-red-500/10"
                        >
                            {ta('logout')}
                        </Button>
                        {role === 'admin' && (
                            <Link href="/tournaments/create">
                                <Button className="bg-[#ffaa00] hover:bg-[#ffaa00]/90 text-black px-6 h-10 rounded-full font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all">
                                    {tc('create')}
                                </Button>
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center gap-6">
                        <Link href="/auth/login">
                            <Button variant="ghost" className="text-[11px] font-bold uppercase tracking-widest text-white/60 hover:text-white p-0">
                                {ta('login')}
                            </Button>
                        </Link>
                        <Link href="/auth/register">
                            <Button className="bg-white text-black hover:bg-white/90 px-8 h-10 rounded-full font-black uppercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all">
                                {ta('register')}
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    </nav>
  );
}
