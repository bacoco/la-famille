import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const sessionToken = request.cookies.get('session_token')?.value;

  if (!sessionToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Protect all routes EXCEPT:
     * - /login (login page)
     * - /api/auth/* (auth API routes)
     * - /api/proxy (backend proxy - still protected by session cookie in fetch)
     * - /_next/* (Next.js internals)
     * - favicon, static assets
     */
    '/((?!login|api/auth|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
