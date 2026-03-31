'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname, routing } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function onSelectChange(newLocale: string) {
    router.replace(pathname, { locale: newLocale as any });
  }

  return (
    <div className="flex gap-1 p-1 bg-white/10 rounded-full border border-white/5">
      {routing.locales.map((cur) => (
        <Button
          key={cur}
          variant="ghost"
          size="sm"
          onClick={() => onSelectChange(cur)}
          className={`h-7 px-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
            locale === cur 
              ? 'bg-white text-black shadow-lg' 
              : 'text-white/40 hover:text-white/70 hover:bg-white/5'
          }`}
        >
          {cur}
        </Button>
      ))}
    </div>
  );
}
