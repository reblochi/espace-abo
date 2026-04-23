# TODO

## PSP-agnostique : migrer les routes checkout/verify vers l'adapter

Termine le 10/04/2026 (refactor Pierre Antoine `e6178bc`) + 23/04/2026 (implementation Fenige `be027d4`).

- [x] `src/app/api/subscriptions/checkout/route.ts` — migre vers `psp.createCheckoutSession()`
- [x] `src/app/api/subscriptions/verify/route.ts` — migre vers `psp.retrieveCheckoutSession()` + `psp.getInvoiceAuthDetails()`
- [x] `src/app/api/processes/checkout/route.ts` — migre, hardcode `pspProvider: 'stripe'` supprime
- [x] `src/app/api/processes/verify/route.ts` — migre, plus aucune reference directe a Stripe

`BasePSPAdapter` expose desormais `createCheckoutSession`, `retrieveCheckoutSession`, `getInvoiceAuthDetails`. Implementations completes : Stripe, Fenige. Stub : HiPay.

## Remboursement : securiser la creation d'avoir

Termine le 23/04/2026.

- [x] `src/app/api/gestion/subscriptions/[id]/refund/route.ts` — `createCreditNote()` isole dans son propre try/catch. Si le remboursement PSP reussit mais que l'avoir echoue, l'echeance est flagguee `refundNeedsReview=true` avec `refundReviewReason`. Le resultat retourne `needsReview: true` pour alerter l'admin.

## Reliquats

- [ ] `src/lib/psp/webhook-handler.ts:247` — template email dedie `subscription-canceled` (utilise le template generique actuellement)
- [ ] UI admin : afficher un badge / filtre sur les echeances `refundNeedsReview=true` dans la page gestion abonnement
- [ ] `src/lib/psp/index.ts:109,112` — PayzenAdapter / MangopayAdapter si besoin metier (low priority, Stripe + Fenige suffisent)
