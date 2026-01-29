# Espace Abonnement - MVP Implementation

**Version**: 1.0.0
**Date**: Janvier 2026

## Description

Implementation complete du MVP "Nouvelle Entite" - Espace membre pour la gestion des abonnements et demarches administratives.

## Stack Technique

| Technologie     | Version | Usage                           |
| --------------- | ------- | ------------------------------- |
| Next.js         | 16.x    | Framework React avec App Router |
| TypeScript      | 5.x     | Typage statique                 |
| Prisma          | 5.x     | ORM PostgreSQL                  |
| TanStack Query  | 5.x     | Data fetching & cache           |
| React Hook Form | 7.x     | Gestion formulaires             |
| Zod             | 3.x     | Validation schemas              |
| Tailwind CSS    | 3.x     | Styling                         |
| NextAuth.js     | 4.x     | Authentification                |

## Structure du projet

```
docs/espace-abo/
├── prisma/
│   └── schema.prisma           # Schema base de donnees
├── src/
│   ├── app/
│   │   ├── (public)/           # Routes publiques
│   │   ├── (auth)/             # Routes authentifiees
│   │   │   └── espace-membre/  # Dashboard membre
│   │   └── api/                # API Routes
│   │       ├── auth/           # Authentification
│   │       ├── subscriptions/  # Gestion abonnements
│   │       ├── processes/      # Gestion demarches
│   │       ├── documents/      # Gestion documents
│   │       ├── invoices/       # Gestion factures
│   │       └── advercity/      # Webhooks Advercity
│   ├── components/
│   │   ├── ui/                 # Composants UI de base
│   │   ├── forms/              # Formulaires
│   │   ├── dashboard/          # Composants dashboard
│   │   ├── processes/          # Composants demarches
│   │   ├── documents/          # Composants documents
│   │   ├── invoices/           # Composants factures
│   │   └── layout/             # Layout components
│   ├── hooks/                  # React hooks customs
│   ├── lib/                    # Utilitaires et services
│   │   └── psp/                # Architecture Multi-PSP
│   ├── types/                  # Types TypeScript
│   └── schemas/                # Schemas Zod
└── README.md
```

## Installation

```bash
# Installer les dependances
npm install

# Configurer les variables d'environnement
cp .env.example .env.local

# Generer le client Prisma
npx prisma generate

# Appliquer les migrations
npx prisma migrate dev

# Lancer le serveur de developpement
npm run dev
```

## Variables d'environnement requises

```env
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."

# Stripe
STRIPE_SECRET_KEY="sk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_..."

# Cloudflare R2 (Storage)
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET_NAME="documents"

# Advercity API
ADVERCITY_API_URL="https://api.advercity.fr"
ADVERCITY_API_TOKEN="..."
ADVERCITY_WEBHOOK_SECRET="..."

# Email (Resend)
RESEND_API_KEY="..."
```

## Fonctionnalites

### Espace Membre

- Dashboard avec statistiques
- Liste et detail des demarches
- Gestion des documents (upload, telechargement)
- Historique des factures
- Gestion de l'abonnement
- Modification du profil et mot de passe

### Tunnels

- Souscription abonnement
- Commande demarche (actes etat civil)

### API

- CRUD complet pour toutes les entites
- Webhooks Stripe pour paiements
- Webhooks Advercity pour suivi demarches
- Architecture Multi-PSP extensible

## Documentation de reference

Voir le dossier `docs/mvp/` pour la documentation complete:

- Architecture et stack technique
- Modele de donnees
- Workflows
- Composants React
- Configuration

Compte test:
Email : marie.martin@test.com
Mot de passe : SecurePass123!
