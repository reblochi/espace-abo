# TODO

## PSP-agnostique : migrer les routes checkout/verify vers l'adapter

4 fichiers appellent directement `new Stripe(...)` au lieu de passer par l'adapter PSP. Si on change de PSP, ces fichiers cassent.

- [ ] `src/app/api/subscriptions/checkout/route.ts` — cree le checkout session Stripe directement
- [ ] `src/app/api/subscriptions/verify/route.ts` — appelle `stripe.checkout.sessions.retrieve()` + types Stripe
- [ ] `src/app/api/processes/checkout/route.ts` — cree le checkout session Stripe directement
- [ ] `src/app/api/processes/verify/route.ts` — appelle `stripe.checkout.sessions.retrieve()`

**Fix** : ajouter `createCheckoutSession()` et `retrieveCheckoutSession()` dans `BasePSPAdapter`, implementer dans chaque adapter, et remplacer les appels directs.

## Remboursement : securiser la creation d'avoir

- [ ] `src/app/api/gestion/subscriptions/[id]/refund/route.ts` — si le remboursement PSP reussit mais que `createCreditNote()` echoue, l'echeance reste "Remboursee" sans avoir. Ajouter un try/catch specifique et un flag pour review manuelle.
