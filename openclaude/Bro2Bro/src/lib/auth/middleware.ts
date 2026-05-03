import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function requireAuth(req: NextRequest): Promise<NextResponse | null> {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return null;
}

export async function requireApiAuth(req: NextRequest): Promise<{ userId: string } | NextResponse> {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token || !token.sub) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return { userId: token.sub };
}

export async function getCurrentUser(req: NextRequest): Promise<{
  userId: string;
  email: string;
  username: string;
} | null> {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token || !token.sub) {
    return null;
  }

  return {
    userId: token.sub,
    email: token.email as string,
    username: token.username as string,
  };
}
