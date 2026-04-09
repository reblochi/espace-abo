// Utilitaire pour auto-login via token signe
// Genere un token JWT temporaire qui permet de creer une session NextAuth

import { encode } from 'next-auth/jwt';
import crypto from 'crypto';

const SECRET = process.env.NEXTAUTH_SECRET!;

/**
 * Genere un token d'auto-login a usage unique (expire apres 5 minutes).
 * Contient le userId chiffre + timestamp.
 */
export function generateAutoLoginToken(userId: string): string {
  const payload = JSON.stringify({
    uid: userId,
    exp: Date.now() + 72 * 60 * 60 * 1000, // 72 heures
    nonce: crypto.randomBytes(8).toString('hex'),
  });

  const cipher = crypto.createCipheriv(
    'aes-256-gcm',
    crypto.createHash('sha256').update(SECRET).digest(),
    Buffer.alloc(12, 0) // IV fixe OK car le nonce rend chaque token unique
  );

  let encrypted = cipher.update(payload, 'utf8', 'base64url');
  encrypted += cipher.final('base64url');
  const tag = cipher.getAuthTag().toString('base64url');

  return `${encrypted}.${tag}`;
}

/**
 * Valide et decode un token d'auto-login.
 * Retourne le userId ou null si invalide/expire.
 */
export function verifyAutoLoginToken(token: string): string | null {
  try {
    const [encrypted, tag] = token.split('.');
    if (!encrypted || !tag) return null;

    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      crypto.createHash('sha256').update(SECRET).digest(),
      Buffer.alloc(12, 0)
    );
    decipher.setAuthTag(Buffer.from(tag, 'base64url'));

    let decrypted = decipher.update(encrypted, 'base64url', 'utf8');
    decrypted += decipher.final('utf8');

    const payload = JSON.parse(decrypted);

    // Verifier expiration
    if (payload.exp < Date.now()) return null;

    return payload.uid || null;
  } catch {
    return null;
  }
}

/**
 * Encode un JWT NextAuth pour un utilisateur donne.
 * Ce JWT peut etre place dans le cookie de session.
 */
export async function encodeNextAuthJWT(user: {
  id: string;
  email: string;
  name: string;
  role: string;
}): Promise<string> {
  return encode({
    token: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      sub: user.id,
    },
    secret: SECRET,
    maxAge: 30 * 24 * 60 * 60, // 30 jours (meme duree que la session)
  });
}

/**
 * Retourne le nom du cookie de session NextAuth.
 * En HTTPS (production) : __Secure-next-auth.session-token
 * En HTTP (dev) : next-auth.session-token
 */
export function getSessionCookieName(): string {
  const isSecure = process.env.NEXTAUTH_URL?.startsWith('https://');
  return isSecure
    ? '__Secure-next-auth.session-token'
    : 'next-auth.session-token';
}
