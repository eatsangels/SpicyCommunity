'use client';

import { createContext, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Zap, LogOut, Trophy } from "lucide-react";
import { Frame } from "@/components/ui/future-navbar";
import FutureButton from "@/components/ui/future-navbar";
import { Link, useRouter } from "@/i18n/routing";
import { createClient } from '@/lib/supabase/client';
import LocaleSwitcher from '@/components/i18n/LocaleSwitcher';
import Image from 'next/image';
import { twMerge } from "tailwind-merge";

export const MobileMenuContext = createContext<{
  showMenu: boolean;
  setShowMenu: React.Dispatch<React.SetStateAction<boolean>>;
}>({
  showMenu: false,
  setShowMenu: () => {},
});

export default function Navbar() {
  const tc = useTranslations("Common");
  const ta = useTranslations("Auth");
  const router = useRouter();
  const supabase = createClient();
  
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string>('user');
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (showMenu) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showMenu]);

  // --- Auth & Role Logic ---
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

  // 🎨 Spicy Brand Colors
  const primaryStroke = "#ffaa00"; // Spicy Gold
  const primaryFill = "rgba(255, 170, 0, 0.12)";
  const glowStroke = "rgba(255, 170, 0, 0.35)";

  return (
    <MobileMenuContext.Provider value={{ showMenu, setShowMenu }}>
      <nav className="fixed top-0 w-full z-50 flex h-20 px-2 lg:px-6 bg-black/40 backdrop-blur-md">
        
        {/* Left Decorative Wing (Desktop) */}
        <div className="size-full relative -mr-[11px] hidden lg:block flex-shrink">
          <Frame
            className="drop-shadow-[0_0_15px_rgba(255,170,0,0.2)]"
            paths={JSON.parse(
              `[{
                "show": true,
                "style": {"strokeWidth": "1", "stroke": "${primaryStroke}", "fill": "rgba(255,170,0,0.06)"},
                "path":[["M","0","0"],["L","100% - 6","0"],["L","100% - 11","100% - 64"],["L","100% + 0","0% + 29"],["L","0","11"],["L","0","0"]]
              },{
                "show": true,
                "style": {"strokeWidth": "1", "stroke": "${glowStroke}", "fill": "transparent"},
                "path":[["M","0","14"],["L","100% - 7","33"]]
              }]`,
            )}
          />
        </div>

        {/* Global Navbar Container */}
        <div className="flex lg:container h-full relative flex-none w-full">
          
          {/* Main Navigation Slot (Logo + Links) */}
          <div className="flex-none h-full px-6 lg:px-14 relative w-full lg:w-auto">
            <Frame
              enableBackdropBlur
              className="drop-shadow-[0_0_20px_rgba(255,170,0,0.15)]"
              paths={JSON.parse(
                `[{
                  "show":true,
                  "style":{"strokeWidth":"1","stroke":"${primaryStroke}","fill":"${primaryFill}"},
                  "path":[["M","6","0"],["L","100% - 6.5","0"],["L","100% + 0","0% + 9"],["L","100% - 28","100% - 15"],["L","162","100% - 15"],["L","164","100% - 30"],["L","153","100% - 15"],["L","27","100% - 15"],["L","0","0% + 8"],["L","6","0"]]
                },{
                  "show":true,
                  "style":{"strokeWidth":"1","stroke":"${primaryStroke}CC","fill":"transparent"},
                  "path":[["M","32","100% - 15"],["L","0% + 152.5","100% - 15"],["L","0% + 163.5","100% - 29"],["L","0% + 161.5","100% - 15"],["L","100% - 32.5","100% - 15"],["L","100% - 36.5","100% - 7"],["L","0% + 163.5","100% - 7"],["L","0% + 165.5","100% - 23"],["L","0% + 152.5","100% - 7"],["L","37","100% - 7"],["L","32","100% - 15"]]
                },{
                  "show":true,
                  "style":{"strokeWidth":"1","stroke":"${glowStroke}","fill":"transparent"},
                  "path":[["M","0","0% + 33"],["M","4","0% + 33"],["L","0% + 18.5","100% - 12"],["L","0% + 23.5","100% - 12"],["L","29","100% + 0"],["L","155","100% - 0"],["L","160","100% - 8"],["L","161","100% - 0"],["L","100% - 28","100% + 0"],["L","100% - 23","100% - 11"],["L","100% - 17","100% - 11"],["L","100% - 14","100% - 14"],["L","100% + 0","100% - 14"]]
                }]`,
              )}
            />
            
            <div className="flex items-center mt-2.5 relative">
              {/* Logo Area */}
              <Link href="/" className="flex items-center gap-3 cursor-pointer group me-12">
                <div className="relative w-8 h-8">
                  <Image src="/logo.png" alt="Spicy" fill sizes="32px" className="object-contain group-hover:scale-110 transition-transform" />
                </div>
                <span className="text-[14px] font-black italic tracking-tighter text-[#ffaa00] uppercase hidden sm:inline">SPICY COMMUNITY</span>
              </Link>

              {/* Desktop Nav Links */}
              <div className="hidden lg:flex gap-10 text-[10px] font-bold uppercase tracking-[0.2em] items-center">
                <Link href="/tournaments" className="text-white/40 hover:text-white transition-colors flex items-center gap-2">
                  <Trophy size={12} className="text-[#ffaa00]" /> {tc('tournament')}
                </Link>
                <Link href="/winners" className="text-white/40 hover:text-white transition-colors flex items-center gap-2">
                  <Trophy size={12} className="text-[#ffaa00]" /> {tc('winners')}
                </Link>
                <Link href="/" className="text-white/40 hover:text-white transition-colors flex items-center gap-2">
                   {tc('home')}
                </Link>
                {user && role === 'admin' && (
                  <Link href="/admin" className="text-[#ffaa00] hover:brightness-110 transition-all border-b border-[#ffaa00]/0 hover:border-[#ffaa00]/100">
                    ADMIN
                  </Link>
                )}
                <div className="ml-2 scale-75 origin-left">
                  <LocaleSwitcher />
                </div>
              </div>

              {/* Mobile Menu Toggle */}
              <div
                onClick={() => setShowMenu(!showMenu)}
                className="cursor-pointer ms-auto flex items-center gap-2 lg:hidden font-black text-[10px] uppercase tracking-widest text-[#ffaa00]"
              >
                <Zap className="size-4 animate-pulse" />
                MENU
              </div>
            </div>
          </div>

          {/* Right Action Slot (Search / Auth) */}
          <div className="w-full relative -ml-[25px] lg:flex justify-end pe-8 hidden">
            <Frame
              enableBackdropBlur
              className="drop-shadow-[0_0_20px_rgba(255,170,0,0.1)]"
              paths={JSON.parse(
                `[{
                  "show":true,
                  "style":{"strokeWidth":"1","stroke":"${primaryStroke}80","fill":"rgba(255,170,0,0.06)"},
                  "path":[["M","19","0"],["L","100% - 5","0"],["L","100% + 0","0% + 7"],["L","100% - 36","100% - 20"],["L","0","100% - 20"],["L","25","8.999992370605469"],["L","19","1"]]
                },{
                  "show":true,
                  "style":{"strokeWidth":"1","stroke":"${glowStroke}","fill":"transparent"},
                  "path":[["M","25","100% - 14"],["L","100% - 32","100% - 13"],["L","100% - 15","36"]]
                }]`,
              )}
            />
            
            <div className="flex items-center -mt-3.5 gap-4">
              {loading ? (
                <div className="w-4 h-4 border-2 border-[#ffaa00]/20 border-t-[#ffaa00] rounded-full animate-spin" />
              ) : user ? (
                <div className="flex items-center gap-4">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-white/30 max-w-[120px] truncate">{user.email}</span>
                  
                  {role === 'admin' && (
                    <Link href="/tournaments/create">
                       <FutureButton shape="flat" className="py-[0.4rem] px-6 text-[9px] uppercase tracking-widest text-black">
                         {tc('create')}
                       </FutureButton>
                    </Link>
                  )}

                  <FutureButton 
                    shape="flat" 
                    onClick={handleLogout}
                    className="py-[0.4rem] px-5 text-[9px] uppercase tracking-widest text-white hover:text-red-500"
                  >
                    <LogOut className="size-3" />
                  </FutureButton>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <Link href="/auth/login">
                    <button className="text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-[#ffaa00] transition-colors">
                      {ta('login')}
                    </button>
                  </Link>
                  <Link href="/auth/register">
                    <FutureButton shape="flat" className="py-[0.4rem] px-8 text-[10px] uppercase tracking-widest text-black">
                      {ta('register')}
                    </FutureButton>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Decorative Wing (Desktop) */}
        <div className="size-full relative -ml-[18px] hidden lg:block flex-shrink">
          <Frame
            paths={JSON.parse(
              `[{
                "show":true,
                "style":{"strokeWidth":"1","stroke":"${primaryStroke}E6","fill":"rgba(255,170,0,0.06)"},
                "path":[["M","12","0"],["L","100% + 0","0"],["L","100% + 0","0% + 16"],["L","0","100% - 42"],["L","18","7"],["L","12","0"]]
              },{
                "show":true,
                "style":{"strokeWidth":"1","stroke":"${glowStroke}","fill":"transparent"},
                "path":[["M","3","100% - 36"],["L","100% + 0","20"]]
              }]`,
            )}
          />
        </div>

      </nav>

      {/* --- Mobile Fullscreen Menu Overlay --- */}
      {/* Rendered OUTSIDE of <nav> to avoid backdrop-blur creating a new containing block for fixed positioning */}
      {showMenu && (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col lg:hidden">
          {/* Top bar */}
          <div className="flex justify-between items-center px-8 py-6 border-b border-white/10">
            <span className="text-[#ffaa00] font-black italic tracking-widest text-sm">MENU</span>
            <button
              onClick={() => setShowMenu(false)}
              className="text-white/40 hover:text-white uppercase font-bold text-xs tracking-widest"
            >
              CLOSE ✕
            </button>
          </div>

          {/* Nav links */}
          <div className="flex flex-col gap-2 px-8 py-8 flex-1 overflow-y-auto">
            <Link
              href="/"
              onClick={() => setShowMenu(false)}
              className="text-3xl font-black uppercase italic tracking-tighter hover:text-[#ffaa00] transition-colors py-3 border-b border-white/5"
            >
              {tc('home')}
            </Link>
            <Link
              href="/tournaments"
              onClick={() => setShowMenu(false)}
              className="text-3xl font-black uppercase italic tracking-tighter hover:text-[#ffaa00] transition-colors py-3 border-b border-white/5 flex items-center gap-3"
            >
              <Trophy size={20} className="text-[#ffaa00]" />
              {tc('tournament')}
            </Link>
            <Link
              href="/winners"
              onClick={() => setShowMenu(false)}
              className="text-3xl font-black uppercase italic tracking-tighter hover:text-[#ffaa00] transition-colors py-3 border-b border-white/5"
            >
              {tc('winners')}
            </Link>
            {user && role === 'admin' && (
              <Link
                href="/admin"
                onClick={() => setShowMenu(false)}
                className="text-3xl font-black uppercase italic tracking-tighter text-[#ffaa00] py-3 border-b border-white/5"
              >
                Admin Panel
              </Link>
            )}
          </div>

          {/* Bottom section: auth + language */}
          <div className="px-8 py-6 border-t border-white/10 flex flex-col gap-4">
            {user ? (
              <>
                <span className="text-xs font-bold text-white/30 tracking-widest uppercase">{user.email}</span>
                {role === 'admin' && (
                  <Link
                    href="/tournaments/create"
                    onClick={() => setShowMenu(false)}
                    className="text-sm font-bold uppercase tracking-widest text-black bg-[#ffaa00] rounded px-4 py-2 text-center"
                  >
                    {tc('create')}
                  </Link>
                )}
                <button
                  onClick={() => { handleLogout(); setShowMenu(false); }}
                  className="text-sm font-black uppercase italic tracking-tighter text-red-400 text-left"
                >
                  {ta('logout')}
                </button>
              </>
            ) : (
              <div className="flex gap-4">
                <Link
                  href="/auth/login"
                  onClick={() => setShowMenu(false)}
                  className="flex-1 text-center py-2 border border-white/20 rounded text-sm font-bold uppercase tracking-widest hover:border-[#ffaa00] hover:text-[#ffaa00] transition-colors"
                >
                  {ta('login')}
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setShowMenu(false)}
                  className="flex-1 text-center py-2 bg-[#ffaa00] rounded text-sm font-bold uppercase tracking-widest text-black hover:brightness-110 transition-all"
                >
                  {ta('register')}
                </Link>
              </div>
            )}
            <div className="mt-2">
              <LocaleSwitcher />
            </div>
          </div>
        </div>
      )}
    </MobileMenuContext.Provider>
  );
}
