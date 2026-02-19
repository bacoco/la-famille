import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('session_token')?.value;

  if (!token) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  // Decode user info from the readable cookie
  const userInfoCookie = request.cookies.get('user_info')?.value;
  if (userInfoCookie) {
    try {
      const user = JSON.parse(userInfoCookie);
      return NextResponse.json({ user });
    } catch {
      // Fall through to JWT decode
    }
  }

  // Fallback: decode from the JWT access token
  try {
    const payload = token.split('.')[1];
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    const claims = JSON.parse(Buffer.from(padded, 'base64url').toString());
    return NextResponse.json({
      user: {
        name: claims.name || claims.preferred_username,
        username: claims.preferred_username,
        email: claims.email || '',
      },
    });
  } catch {
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
