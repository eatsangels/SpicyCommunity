import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { updateSession } from '@/lib/supabase/middleware';
import { NextRequest } from 'next/server';

const intlMiddleware = createMiddleware({
  ...routing,
  localeDetection: false, // Always use defaultLocale ('en') — no browser language sniffing
});

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect any /es legacy paths to /en
  if (pathname.startsWith('/es')) {
    const newUrl = request.nextUrl.clone();
    newUrl.pathname = pathname.replace(/^\/es/, '/en');
    return Response.redirect(newUrl, 301);
  }

  // 1. Refresh supabase session
  const supabaseResponse = await updateSession(request);
  
  // 2. Handle internationalization
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next (internal Next.js paths)
     * - _static (static files)
     * - _vercel (Vercel analytics, etc.)
     * - Any path with a dot (e.g. image.png, favicon.ico)
     */
    '/((?!api|_next|_static|_vercel|.*\\..*).*)',
  ],
};
