'use client';

import { usePathname } from 'next/navigation';
import SpicyFooter from './SpicyFooter';

/**
 * FooterWrapper conditionally renders the SpicyFooter.
 * It hides the footer on all routes starting with /admin to provide
 * a cleaner workspace for administrators, especially on mobile.
 */
export default function FooterWrapper() {
  const pathname = usePathname();

  // Do not show the footer in the admin area
  if (pathname.startsWith('/admin')) {
    return null;
  }

  return <SpicyFooter />;
}
