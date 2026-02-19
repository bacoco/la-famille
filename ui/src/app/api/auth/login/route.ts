import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const result = await authenticateUser(username, password);

    if (!result) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ user: result.user });

    // Set httpOnly cookie with access token
    response.cookies.set('session_token', result.accessToken, {
      httpOnly: true,
      secure: false, // local network, no HTTPS
      sameSite: 'lax',
      path: '/',
      maxAge: result.expiresIn,
    });

    // Set readable cookie with user info for client-side display
    response.cookies.set(
      'user_info',
      JSON.stringify({
        name: result.user.name,
        username: result.user.username,
        email: result.user.email,
      }),
      {
        httpOnly: false,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: result.expiresIn,
      }
    );

    return response;
  } catch {
    return NextResponse.json(
      { error: 'Authentication service unavailable' },
      { status: 503 }
    );
  }
}
