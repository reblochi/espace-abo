// Rate limiter in-memory simple pour les routes sensibles
// Compatible serverless (state par instance, pas global — suffisant pour ralentir les attaques)

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const stores = new Map<string, Map<string, RateLimitEntry>>();

function getStore(name: string): Map<string, RateLimitEntry> {
  let store = stores.get(name);
  if (!store) {
    store = new Map();
    stores.set(name, store);
  }
  return store;
}

interface RateLimitConfig {
  /** Nom unique du rate limiter (ex: 'login', 'register') */
  name: string;
  /** Nombre max de requetes dans la fenetre */
  maxRequests: number;
  /** Duree de la fenetre en secondes */
  windowSeconds: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Verifie et incremente le compteur pour une cle donnee (IP typiquement).
 * Retourne { success: false } si la limite est atteinte.
 */
export function checkRateLimit(config: RateLimitConfig, key: string): RateLimitResult {
  const store = getStore(config.name);
  const now = Date.now();

  // Nettoyage periodique (1 chance sur 100)
  if (Math.random() < 0.01) {
    for (const [k, entry] of store) {
      if (entry.resetAt <= now) store.delete(k);
    }
  }

  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    // Nouvelle fenetre
    const resetAt = now + config.windowSeconds * 1000;
    store.set(key, { count: 1, resetAt });
    return { success: true, remaining: config.maxRequests - 1, resetAt };
  }

  if (entry.count >= config.maxRequests) {
    return { success: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { success: true, remaining: config.maxRequests - entry.count, resetAt: entry.resetAt };
}

/**
 * Extrait l'IP depuis les headers de la requete (Vercel/Cloudflare)
 */
export function getClientIp(request: Request): string {
  const forwarded = (request.headers.get('x-forwarded-for') || '').split(',')[0]?.trim();
  return forwarded || request.headers.get('x-real-ip') || 'unknown';
}

// Configurations pre-definies
export const RATE_LIMITS = {
  auth: { name: 'auth', maxRequests: 10, windowSeconds: 60 } as RateLimitConfig,
  register: { name: 'register', maxRequests: 5, windowSeconds: 300 } as RateLimitConfig,
  forgotPassword: { name: 'forgot-password', maxRequests: 3, windowSeconds: 300 } as RateLimitConfig,
  embed: { name: 'embed', maxRequests: 10, windowSeconds: 60 } as RateLimitConfig,
  unsubscribe: { name: 'unsubscribe', maxRequests: 3, windowSeconds: 300 } as RateLimitConfig,
} as const;
