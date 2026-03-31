# Admin Back-Office

> **Note** : Ce document doit etre mis a jour a chaque modification de l'admin.

## Vue d'ensemble

Le back-office admin est integre dans la meme codebase Next.js que l'espace membre, sous le groupe de routes `(admin)/admin/`. Il partage les modeles Prisma, les adaptateurs PSP, et la generation de factures.

Acces : `/admin` — necessite un utilisateur avec `role: ADMIN` ou `AGENT` en BDD.

---

## Architecture

```
src/app/(admin)/admin/       # Pages admin (server + client components)
src/app/api/admin/           # API routes admin (protegees par requireAdminOrAgent)
src/components/admin/        # Composants reutilisables admin
src/lib/admin-auth.ts        # Helpers auth admin
src/schemas/admin.ts         # Schemas Zod validation admin
```

### Roles et authentification

Trois roles existent :

| Role | Acces admin | Restrictions |
|------|-------------|-------------|
| `USER` | Aucun (espace membre uniquement) | — |
| `AGENT` | Tout le back-office | Ne peut pas changer les roles des utilisateurs |
| `ADMIN` | Tout le back-office | Peut nommer/denommer agents et admins depuis la fiche client |

- Le champ `role` (enum `UserRole`: USER | AGENT | ADMIN) est sur le modele `User`
- Le JWT NextAuth contient le role (mis a jour au login)
- `requireAdminOrAgent()` pour les routes accessibles aux agents et admins
- `requireAdmin()` pour les routes admin-only (changement de role)
- Re-verification du role en BDD a chaque requete (le JWT peut etre stale jusqu'a 30 jours)
- Les admins peuvent nommer/denommer depuis la fiche client (`/admin/clients/[id]`)
- Un admin ne peut pas modifier son propre role (securite)

### Audit

Toutes les actions admin mutantes (cancel, refund, credit note, etc.) sont tracees dans `AdminAuditLog` via `logAdminAction()`.

---

## Pages et fonctionnalites

### Dashboard (`/admin`)
- Stats en temps reel : utilisateurs, abonnements actifs, revenu net (mois + total), litiges ouverts, cartes expirantes, demarches
- **Calcul du revenu** : somme de toutes les factures payees (abo + demarches + avoirs). Les avoirs ont des montants negatifs donc la somme donne le net.

### Clients (`/admin/clients`)
- **Recherche** : par email (partiel), nom/prenom (partiel), ID exact, ou reference demarche (DEM-YYYY-XXXXXX)
- **Fiche 360** (`/admin/clients/[id]`) : infos perso, abonnement, factures, demarches, litiges. Liens croises vers chaque section.
- **Gestion des roles** (admin seulement) : dropdown pour changer le role d'un client (Client/Agent/Admin). Un admin ne peut pas modifier son propre role.
- **Securite** : l'API n'expose jamais `passwordHash` ni les tokens de reset (utilise `select` explicite)

### Abonnements (`/admin/abonnements`)
- **Liste** : reference, user, statut, montant, carte (last4 + expiration), date debut
- **Filtres** : statut, carte expirante (abos actifs avec carte expiree ou expirant dans 2 mois)
- **Badge "Expire"** sur les cartes problematiques
- **Detail** (`/admin/abonnements/[id]`) :
  - Infos abo + user + carte
  - **Desabonnement** : immediat ou fin de periode, avec motif. Appel PSP + annulation echeances UPCOMING
  - **Remboursement echeances** : selection par checkbox des echeances payees. Pour chaque echeance :
    1. Marque REFUNDED en base
    2. Appelle le PSP (resolution Stripe invoice ID -> payment_intent ID)
    3. Si PSP echoue : rollback de la DB
    4. Si PSP ok : cree un avoir (credit note)

### Factures (`/admin/factures`)
- **Liste** : numero, user, type (Abo/Demarche/Avoir), montant, statut, date
- **Filtres** : type, statut
- **Recherche** : email, nom, numero de facture
- **Download PDF** : generation a la volee si pas de cache R2
- **Detail** (`/admin/factures/[id]`) :
  - Infos completes, liens user/demarche/echeance
  - **Creation avoir** : motif obligatoire, montant optionnel (defaut = total). Protection contre les doublons : verifie le montant deja rembourse via audit logs.

#### Numerotation
- Factures : `FAC-YYYY-XXXXXX`
- Avoirs : `AVO-YYYY-XXXXXX`
- Protection race condition : retry sur unique constraint violation (3 tentatives)

### Litiges (`/admin/litiges`)
- **Liste** : date, ID PSP, montant, raison, statut, avoir lie
- **Filtres** : statut (A traiter, En cours, Gagne, Perdu)
- **Detail** (`/admin/litiges/[id]`) : infos, liens subscription/avoir, notes admin editables

---

## Webhooks — Gestion des litiges/chargebacks

### Flux Stripe

1. `charge.dispute.created` → cree un `Dispute` en base. Resolution charge -> payment_intent -> invoice pour trouver l'echeance/demarche liee. Pas d'avoir automatique a ce stade.
2. `charge.dispute.updated` → met a jour le statut du Dispute.
3. `charge.dispute.closed` → si **perdu** (LOST) : auto-cree un avoir (credit note) lie au dispute. Si gagne (WON) : juste maj du statut.

### Resolution d'identite (PSP-agnostique)

Pour Stripe : `charge ID (ch_xxx)` → API Stripe → `payment_intent (pi_xxx)` → `invoice (in_xxx)` → recherche echeance en BDD par `pspInvoiceId`.

Pour les autres PSPs : le `paymentId` est directement utilisable pour la recherche en BDD (echeance par `pspInvoiceId` ou demarche par `pspPaymentId`).

### Sync info carte

Le webhook `customer.updated` extrait les infos de la carte par defaut (brand, last4, expMonth, expYear) et met a jour le modele `Subscription`.

---

## Webhook safety

- `mapEventType` retourne `null` pour les events Stripe non mappes → ignores silencieusement au lieu de declencher un handler incorrect
- `handlePaymentRefunded` est idempotent : ne met pas a jour les echeances/demarches deja en statut REFUNDED
- Les events inconnus ne peuvent plus accidentellement annuler un abonnement (ancien bug corrige)

---

## Modeles Prisma (admin-specifiques)

### Dispute (litiges/chargebacks)
```
Dispute {
  id, subscriptionId?, deadlineId?, processId?
  pspProvider, pspDisputeId (unique), pspPaymentId
  amountCents, currency, status (NEEDS_RESPONSE | UNDER_REVIEW | WON | LOST)
  reason?, adminNotes?, creditNoteId? -> Invoice
  disputedAt, resolvedAt?
}
```

### AdminAuditLog
```
AdminAuditLog {
  id, adminId, action, targetType, targetId, metadata (JSON)
}
```

### Champs ajoutes sur Subscription
```
cardBrand?, cardLast4?, cardExpMonth?, cardExpYear?
```

### Champ ajoute sur User
```
role: UserRole (USER | ADMIN) @default(USER)
```

---

## Composants admin reutilisables

| Composant | Fichier | Usage |
|-----------|---------|-------|
| `AdminLayout` | `src/components/admin/AdminLayout.tsx` | Sidebar + header admin |
| `DataTable` | `src/components/admin/DataTable.tsx` | Table avec pagination, tri, click row |
| `SearchBar` | `src/components/admin/SearchBar.tsx` | Recherche avec debounce 300ms |
| `StatCard` | `src/components/admin/StatCard.tsx` | Carte stat dashboard (default/success/warning/destructive) |

---

## Seed de test

Fichier : `prisma/seed.ts`

```bash
npx tsx prisma/seed.ts
```

Cree 30 users (1 admin), 15 abos, 40 demarches, ~60 factures, 3 avoirs, 4 litiges.
Admin : `marie.martin@example.fr` / `password123`

---

## Deploiement

1. Generer le client Prisma : `npm run db:generate`
2. Appliquer la migration SQL via Supabase SQL Editor (tables `disputes`, `admin_audit_logs`, enum `UserRole`, colonnes)
3. Flagger un admin en SQL
4. Ajouter les events Stripe dans la config webhook : `charge.dispute.created`, `charge.dispute.updated`, `charge.dispute.closed`
