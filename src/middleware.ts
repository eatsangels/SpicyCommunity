import { updateSession } from '@/lib/supabase/middleware';
import { NextRequest } from 'next/server';

export default async function middleware(request: NextRequest) {
  // 1. Refresh supabase session
  return await updateSession(request);
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
