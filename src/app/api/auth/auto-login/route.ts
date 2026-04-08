// GET /api/auth/auto-login?token=...&callbackUrl=...
// Valide le token d'auto-login, cree la session NextAuth (cookie JWT), et redirige.

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  verifyAutoLoginToken,
  encodeNextAuthJWT,
  getSessionCookieName,
} from '@/lib/auto-login';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  const callbackUrl = request.nextUrl.searchParams.get('callbackUrl') || '/espace-membre';

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Valider le token
  const userId = verifyAutoLoginToken(token);
  if (!userId) {
    return NextResponse.redirect(new URL('/login?error=TokenExpire', request.url));
  }

  // Recuperer l'utilisateur
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, firstName: true, lastName: true, role: true },
  });

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Generer le JWT NextAuth
  const sessionToken = await encodeNextAuthJWT({
    id: user.id,
    email: user.email,
    name: `${user.firstName} ${user.lastName}`,
    role: user.role,
  });

  // Creer la reponse avec redirect
  const redirectUrl = new URL(callbackUrl, request.url);
  const response = NextResponse.redirect(redirectUrl);

  // Poser le cookie de session NextAuth
  const cookieName = getSessionCookieName();
  const isSecure = process.env.NEXTAUTH_URL?.startsWith('https://');

  response.cookies.set(cookieName, sessionToken, {
    httpOnly: true,
    secure: isSecure || false,
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  });

  return response;
}
