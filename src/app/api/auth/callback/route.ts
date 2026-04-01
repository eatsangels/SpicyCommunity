import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/'; // Default redirect
  const error = searchParams.get('error');
  const error_description = searchParams.get('error_description');

  if (error) {
    console.error('Auth error from Supabase:', error, error_description);
    return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(error_description || error)}`);
  }

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                // Ignore set cookie attempts because they are handled correctly
                // by the response object we return
              });
            } catch (error) {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!exchangeError) {
      // Re-initialize supabase response to ensure cookies are set on the actual response
      const response = NextResponse.redirect(`${origin}${next}`);
      
      const responseSupabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) => {
                response.cookies.set(name, value, options);
              });
            },
          },
        }
      );
      
      // Ensure session is set in the proxy client response cookies
      await responseSupabase.auth.getUser();
      return response;
    } else {
      console.error('Swap code error:', exchangeError);
       return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(exchangeError.message)}`);
    }
  }

  // Fallback
  return NextResponse.redirect(`${origin}${next}`);
}
