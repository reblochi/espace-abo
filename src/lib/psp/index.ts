// Factory et exports pour l'architecture Multi-PSP

import type { PSPProvider, PSPConfig } from './types';
import { BasePSPAdapter } from './base-adapter';
import { StripeAdapter } from './stripe-adapter';
import { HiPayAdapter } from './hipay-adapter';
import { FenigeAdapter } from './fenige-adapter';

export * from './types';
export { BasePSPAdapter } from './base-adapter';
export { StripeAdapter } from './stripe-adapter';
export { HiPayAdapter } from './hipay-adapter';
export { FenigeAdapter } from './fenige-adapter';

// Registry des adaptateurs
const adapters: Map<PSPProvider, BasePSPAdapter> = new Map();

// Configurations depuis les variables d'environnement
const defaultConfigs: Record<PSPProvider, () => PSPConfig | null> = {
  stripe: () => {
    if (!process.env.STRIPE_SECRET_KEY) return null;
    return {
      provider: 'stripe',
      apiKey: process.env.STRIPE_SECRET_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
      publicKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    };
  },
  hipay: () => {
    if (!process.env.HIPAY_API_KEY) return null;
    return {
      provider: 'hipay',
      apiKey: process.env.HIPAY_API_KEY,
      webhookSecret: process.env.HIPAY_WEBHOOK_SECRET || '',
      sandbox: process.env.HIPAY_SANDBOX === 'true',
      extraConfig: {
        apiSecret: process.env.HIPAY_API_SECRET,
      },
    };
  },
  payzen: () => {
    if (!process.env.PAYZEN_API_KEY) return null;
    return {
      provider: 'payzen',
      apiKey: process.env.PAYZEN_API_KEY,
      webhookSecret: process.env.PAYZEN_WEBHOOK_SECRET || '',
      publicKey: process.env.PAYZEN_PUBLIC_KEY,
    };
  },
  mangopay: () => {
    if (!process.env.MANGOPAY_CLIENT_ID) return null;
    return {
      provider: 'mangopay',
      apiKey: process.env.MANGOPAY_API_KEY || '',
      webhookSecret: '',
      extraConfig: {
        clientId: process.env.MANGOPAY_CLIENT_ID,
        sandbox: process.env.MANGOPAY_SANDBOX === 'true',
      },
    };
  },
  fenige: () => {
    if (!process.env.FENIGE_API_KEY) return null;
    return {
      provider: 'fenige',
      apiKey: '', // Non utilise directement, auth via API-KEY header et Basic Auth
      webhookSecret: process.env.FENIGE_WEBHOOK_SECRET || '',
      publicKey: process.env.FENIGE_API_KEY,
      sandbox: process.env.FENIGE_SANDBOX !== 'false',
      extraConfig: {
        merchantUuid: process.env.FENIGE_MERCHANT_UUID,
        basicAuthUser: process.env.FENIGE_BASIC_AUTH_USER,
        basicAuthPassword: process.env.FENIGE_BASIC_AUTH_PASSWORD,
        productionApiUrl: process.env.FENIGE_PRODUCTION_API_URL,
        productionPageUrl: process.env.FENIGE_PRODUCTION_PAGE_URL,
      },
    };
  },
};

// Factory pour obtenir un adaptateur
export function getPSPAdapter(provider: PSPProvider): BasePSPAdapter {
  // Verifier si deja en cache
  if (adapters.has(provider)) {
    return adapters.get(provider)!;
  }

  // Creer l'adaptateur
  const configFn = defaultConfigs[provider];
  if (!configFn) {
    throw new Error(`PSP non supporte: ${provider}`);
  }

  const config = configFn();
  if (!config) {
    throw new Error(`Configuration manquante pour: ${provider}`);
  }

  let adapter: BasePSPAdapter;

  switch (provider) {
    case 'stripe':
      adapter = new StripeAdapter(config);
      break;
    case 'hipay':
      adapter = new HiPayAdapter(config);
      break;
    case 'payzen':
      // TODO: Implementer PayzenAdapter
      throw new Error('Payzen non encore implemente');
    case 'mangopay':
      // TODO: Implementer MangopayAdapter
      throw new Error('Mangopay non encore implemente');
    case 'fenige':
      adapter = new FenigeAdapter(config);
      break;
    default:
      throw new Error(`PSP non supporte: ${provider}`);
  }

  adapters.set(provider, adapter);
  return adapter;
}

// Obtenir l'adaptateur par defaut (Stripe)
export function getDefaultPSPAdapter(): BasePSPAdapter {
  const defaultProvider = (process.env.DEFAULT_PSP_PROVIDER as PSPProvider) || 'stripe';
  return getPSPAdapter(defaultProvider);
}

// Liste des PSP disponibles (configures)
export function getAvailablePSPs(): PSPProvider[] {
  const available: PSPProvider[] = [];
  for (const [provider, configFn] of Object.entries(defaultConfigs)) {
    if (configFn()) {
      available.push(provider as PSPProvider);
    }
  }
  return available;
}
