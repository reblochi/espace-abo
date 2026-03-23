# CLAUDE.md

Instructions pour Claude Code dans le projet Espace Abonnement MVP.

## Vue d'ensemble

Application Next.js 16 (App Router) pour l'espace membre - gestion des abonnements et demarches administratives. Ce projet est un frontend/backend independant qui communique avec l'API Advercity principale.

## Stack technique

- **Framework**: Next.js 16 avec App Router
- **Langage**: TypeScript 5.x
- **ORM**: Prisma 5.x (PostgreSQL, schema `espace_abo`)
- **Authentification**: NextAuth.js 4.x
- **Data fetching**: TanStack Query 5.x
- **Validation**: Zod 3.x
- **Styling**: Tailwind CSS 3.x
- **Paiements**: Architecture Multi-PSP (Stripe, HiPay)
- **Stockage**: Cloudflare R2 (AWS S3 compatible)
- **Emails**: Resend

## Commandes principales

```bash
# Developpement
npm run dev              # Serveur dev (port 3000)
npm run build            # Build production
npm run start            # Serveur production
npm run lint             # ESLint

# Base de donnees Prisma
npm run db:generate      # Generer client Prisma
npm run db:push          # Push schema (dev)
npm run db:migrate       # Migrations dev
npm run db:studio        # Interface Prisma Studio
```

## Structure du projet

```
src/
├── app/
│   ├── (auth)/              # Pages auth (login, register, forgot-password)
│   ├── (public)/            # Pages publiques (tunnels)
│   ├── espace-membre/       # Dashboard membre (protege)
│   │   ├── mes-demarches/   # Liste et detail demarches
│   │   ├── mes-documents/   # Documents uploades
│   │   ├── mes-factures/    # Historique factures
│   │   ├── mon-abonnement/  # Gestion abonnement
│   │   └── mon-profil/      # Profil utilisateur
│   └── api/                 # API Routes
│       ├── auth/            # Authentification NextAuth
│       ├── subscriptions/   # CRUD abonnements + webhooks
│       ├── processes/       # CRUD demarches
│       ├── documents/       # Upload/download documents
│       ├── invoices/        # Factures
│       └── advercity/       # Webhooks Advercity
├── components/
│   ├── ui/                  # Composants UI (Button, Card, Badge, Modal...)
│   ├── forms/               # Formulaires (CityAutocomplete...)
│   ├── dashboard/           # DashboardStats, SubscriptionCard
│   ├── processes/           # ProcessCard, ProcessList, ProcessTimeline
│   ├── documents/           # DocumentList, DocumentCard
│   ├── invoices/            # InvoiceList, InvoiceRow
│   └── layout/              # MemberLayout
├── hooks/                   # Hooks React (useSubscription, useProcesses...)
├── lib/
│   ├── psp/                 # Architecture Multi-PSP
│   │   ├── base-adapter.ts  # Interface abstraite
│   │   ├── stripe-adapter.ts
│   │   ├── hipay-adapter.ts
│   │   └── webhook-handler.ts
│   ├── db.ts                # Client Prisma
│   ├── auth.ts              # Config NextAuth
│   ├── storage.ts           # Cloudflare R2
│   ├── email.ts             # Resend
│   └── advercity.ts         # Client API Advercity
├── types/                   # Types TypeScript
└── schemas/                 # Schemas Zod
```

## Modele de donnees principal

| Entite | Description |
|--------|-------------|
| `User` | Utilisateur avec profil complet |
| `Subscription` | Abonnement mensuel (9.90 EUR) |
| `SubscriptionDeadline` | Echeances de paiement |
| `Process` | Demarche administrative |
| `ProcessFile` | Fichiers uploades par demarche |
| `Invoice` | Factures (abonnement ou demarche) |

### Statuts cles

**Abonnement** (`SubscriptionStatus`):
- `PENDING` -> `ACTIVE` -> `PAST_DUE` -> `CANCELED` -> `ENDED`

**Demarche** (`ProcessStatus`):
- `PENDING_PAYMENT` -> `PAID` -> `SENT_TO_ADVERCITY` -> `IN_PROGRESS` -> `COMPLETED`

## Conventions de code

### API Routes

```typescript
// src/app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ...
}
```

### Hooks avec TanStack Query

```typescript
// src/hooks/useExample.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useExample() {
  return useQuery({
    queryKey: ['example'],
    queryFn: async () => {
      const res = await fetch('/api/example');
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });
}
```

### Validation Zod

```typescript
// src/schemas/example.ts
import { z } from 'zod';

export const exampleSchema = z.object({
  field: z.string().min(1, 'Champ requis'),
});

export type ExampleInput = z.infer<typeof exampleSchema>;
```

## Variables d'environnement

```env
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."

# PSP (Stripe par defaut)
STRIPE_SECRET_KEY="sk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_..."

# Storage (Cloudflare R2)
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET_NAME="documents"

# API Advercity
ADVERCITY_API_URL="https://api.advercity.fr"
ADVERCITY_API_TOKEN="..."
ADVERCITY_WEBHOOK_SECRET="..."

# Email
RESEND_API_KEY="..."
```

## Architecture Multi-PSP

Le projet utilise une architecture extensible pour les paiements:

```typescript
// Utilisation
import { getPSPAdapter } from '@/lib/psp';

const adapter = getPSPAdapter('stripe'); // ou 'hipay'
const session = await adapter.createCheckoutSession({...});
```

Pour ajouter un nouveau PSP, creer un adapter dans `src/lib/psp/` implementant `BasePSPAdapter`.

## Integration Advercity

- Les demarches payees sont envoyees a l'API Advercity via `src/lib/advercity.ts`
- Les webhooks Advercity (`/api/advercity/webhook`) mettent a jour le statut des demarches
- La reference Advercity est stockee dans `Process.advercityId` et `Process.advercityRef`

## Deploiement

### Production (Vercel + Supabase)

- **Hebergement**: Vercel, projet `espace-abo` (ID: `prj_5FlTofrDSh1zNDNsCxVu3AM95lsh`)
- **Domaine**: `franceguichet.fr` (DNS Cloudflare)
- **Region serverless**: `cdg1` (Paris)
- **Base de donnees**: Supabase PostgreSQL (projet `znlzxlafmtqbwaicjfjg`, region eu-west)
- **Auto-deploy**: branche `main` = production, `develop` = preview. Push sur GitHub declenche le deploy automatiquement
- **Repo GitHub**: `reblochi/espace-abo`

### Widget embed

Le formulaire de demarche peut etre integre sur des sites tiers via un widget iframe :

- **URL embed**: `https://franceguichet.fr/embed/acte-naissance?partner=<nom>`
- **Script widget**: `https://franceguichet.fr/widget/advercity-widget.js`
- **API publique**: `POST /api/embed/acte-naissance` (sans authentification, collecte email/nom dans le formulaire)
- **Detection abonne**: a la soumission, l'API cherche le user par email et verifie via `checkProcessEligibility` s'il a un abonnement actif. Si oui, la demarche est creee directement sans paiement.

Integration cote site tiers (exemple) :
```html
<script>
  window.ADVERCITY_CONFIG = {
    baseUrl: 'https://franceguichet.fr',
    partner: 'nom-partenaire',
  };
</script>
<script src="https://franceguichet.fr/widget/advercity-widget.js"></script>
<button data-advercity="acte-naissance" data-advercity-partner="nom-partenaire">
  Demander un acte
</button>
```

### Site de test : mairiedefridefont.fr

- **Hebergement**: Netlify (site `fridefont-commune`)
- **Repo GitHub**: `reversing2002/fridefont` (Astro, build statique)
- **Deploy**: manuel via `netlify deploy --prod --dir=dist` (auto-deploy GitHub non connecte)
- **Page avec widget**: `https://mairiedefridefont.fr/vie-pratique/`
- **Fichiers modifies**: `src/layouts/Layout.astro` (config + script widget), `src/pages/vie-pratique.astro` (bouton acte de naissance)

### Variables d'environnement Vercel

En plus des variables locales, Vercel necessite `RESEND_API_KEY` meme si non utilise (le module Resend s'initialise au build). Mettre une valeur placeholder si pas encore configure.

### Fonctionnalites a implementer

- **Desabonnement simplifie** : page publique sur espace-abo (`/desabonnement`) accessible sans connexion. L'utilisateur saisit son email, recoit un lien de confirmation par email, clic = desactivation de l'abonnement. Lien vers cette page visible depuis la home de l'espace-abo.
- **Acces factures** : donner acces aux factures depuis l'espace membre (`/espace-membre/mes-factures`) et potentiellement via un lien direct envoye par email apres chaque paiement (token signe, sans auth requise).

## Notes importantes

- Le schema Prisma utilise un schema PostgreSQL dedie: `espace_abo`
- Les migrations Prisma ne doivent jamais etre appliquees directement - fournir le SQL a executer manuellement
- Les fichiers sont stockes sur Cloudflare R2 avec URLs pre-signees pour le telechargement
- Les references sont generees automatiquement: `SUB-YYYY-XXXXXX`, `DEM-YYYY-XXXXXX`, `FAC-YYYY-XXXXXX`
- Supabase free-tier : connexion directe en IPv6 uniquement (fonctionne depuis Vercel, pas forcement en local). Pour les operations DB manuelles, utiliser le SQL Editor de Supabase ou l'API management
