import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

/** Routes that require any authenticated user (artist or admin) */
const PROTECTED_ROUTES = [
  '/dashboard',
  '/upload',
  '/boost',
];

/** Routes that require admin role only */
const ADMIN_ROUTES = [
  '/admin',
];

/** Routes that redirect to /dashboard if already authenticated */
const AUTH_ROUTES = [
  '/auth/login',
  '/auth/signup',
  '/auth/reset',
];

/** API routes that require authentication */
const PROTECTED_API_ROUTES = [
  '/api/track-events',
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function matchesRoute(pathname: string, routes: string[]): boolean {
  return routes.some(route => pathname === route || pathname.startsWith(route + '/'));
}

function isAdminRoute(pathname: string): boolean {
  return matchesRoute(pathname, ADMIN_ROUTES);
}

function isProtectedRoute(pathname: string): boolean {
  return matchesRoute(pathname, PROTECTED_ROUTES) || isAdminRoute(pathname);
}

function isAuthRoute(pathname: string): boolean {
  return matchesRoute(pathname, AUTH_ROUTES);
}

function isProtectedApi(pathname: string): boolean {
  return matchesRoute(pathname, PROTECTED_API_ROUTES);
}

// ─────────────────────────────────────────────────────────────────────────────
// MIDDLEWARE
// ─────────────────────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── 1. Build a response we can mutate for cookie refresh ─────────────────
  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  // ── 2. Create Supabase SSR client (reads/writes cookies) ─────────────────
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Refresh the session token in both request and response
          request.cookies.set({ name, value, ...options });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // ── 3. Refresh session (MUST happen before any auth check) ────────────────
  const { data: { user }, error } = await supabase.auth.getUser();

  // ── 4. Security headers (applied to ALL responses) ────────────────────────
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  // ── 5. Block direct access to /admin API sub-routes ───────────────────────
  if (pathname.startsWith('/api/admin') && !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── 6. Protected API routes — require authentication ─────────────────────
  if (isProtectedApi(pathname)) {
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    return response;
  }

  // ── 7. Webhook routes — skip auth (they use signature verification) ───────
  if (pathname.startsWith('/api/webhooks')) {
    return response;
  }

  // ── 8. Redirect authenticated users away from auth pages ─────────────────
  if (isAuthRoute(pathname) && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // ── 9. Protected routes — require authentication ──────────────────────────
  if (isProtectedRoute(pathname)) {
    if (!user || error) {
      const url = request.nextUrl.clone();
      url.pathname = '/auth/login';
      // Preserve the intended destination for post-login redirect
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }

    // ── 10. Admin routes — require admin role ────────────────────────────────
    if (isAdminRoute(pathname)) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        // Authenticated but not admin → redirect home with a flag
        const url = request.nextUrl.clone();
        url.pathname = '/';
        url.searchParams.set('error', 'forbidden');
        return NextResponse.redirect(url);
      }
    }
  }

  // ── 11. Continue with refreshed session ───────────────────────────────────
  return response;
}

// ─────────────────────────────────────────────────────────────────────────────
// MATCHER — only run middleware on relevant paths (skip static assets)
// ─────────────────────────────────────────────────────────────────────────────

export const config = {
  matcher: [
    /*
     * Run on all paths EXCEPT:
     * - _next/static  (static files)
     * - _next/image   (image optimisation)
     * - favicon.ico
     * - public folder assets (images, fonts, etc.)
     * - sitemap.xml / robots.txt
     */
    '/((?!_next/static|_next/image|favicon\\.ico|images/|fonts/|icons/|sitemap\\.xml|robots\\.txt).*)',
  ],
};
