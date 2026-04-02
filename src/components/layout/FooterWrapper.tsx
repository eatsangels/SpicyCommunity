'use client';

import { usePathname } from 'next/navigation';
import SpicyFooter from './SpicyFooter';

/**
 * FooterWrapper conditionally renders the SpicyFooter.
 * Per user request: Show ONLY on the home page ("/") and hide
 * on ALL other pages to provide a focused management experience.
 */
export default function FooterWrapper() {
  const pathname = usePathname();

  // Root path check. If i18n is used with localePrefix 'never', this covers the home page.
  const isHomePage = pathname === '/' || pathname === '/en';

  if (!isHomePage) {
    return null;
  }

  return <SpicyFooter />;
}
