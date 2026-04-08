# Google Ads - Suivi des conversions server-side

## Principe

Le suivi des conversions Google Ads est implemente cote serveur (offline conversions) pour contourner les limitations des iframes cross-origin et des bloqueurs de publicite. Quand un utilisateur clique sur une annonce Google Ads et effectue un paiement, la conversion est envoyee directement a l'API Google Ads depuis le backend.

## Flow du gclid

```
1. L'utilisateur clique sur une annonce Google Ads
   → URL du site partenaire contient ?gclid=xxx

2. Le widget JS (advercity-widget.js) capture le gclid
   → getGclid() lit gclid/gbraid/wbraid depuis window.location.search

3. Le widget passe le gclid a l'iframe embed
   → URL iframe: /embed/acte-naissance?partner=xxx&gclid=xxx

4. Le formulaire React lit le gclid via useSearchParams()
   → Passe en prop gclid au composant formulaire

5. A la soumission, le gclid est inclus dans le POST
   → POST /api/embed/acte-naissance { ..., gclid: "xxx" }

6. L'API stocke le gclid sur le Process en BDD
   → prisma.process.create({ data: { ..., gclid } })

7. Le gclid est aussi transmis dans les metadata Stripe
   → stripe.checkout.sessions.create({ metadata: { gclid } })

8. Au webhook de confirmation de paiement, la conversion est envoyee
   → sendConversion() appelle l'API Google Ads
```

## Configuration

### Variables d'environnement

Toutes les variables sont requises pour activer le tracking. Sans elles, le service log "Non configure" et n'envoie rien (pas de blocage).

```env
# ID du compte Google Ads (format: 123-456-7890)
GOOGLE_ADS_CUSTOMER_ID=

# ID de l'action de conversion (nombre entier)
GOOGLE_ADS_CONVERSION_ACTION_ID=

# Developer token (obtenu via Google Ads API Center)
GOOGLE_ADS_DEVELOPER_TOKEN=

# OAuth2 credentials (depuis Google Cloud Console)
GOOGLE_ADS_CLIENT_ID=
GOOGLE_ADS_CLIENT_SECRET=
GOOGLE_ADS_REFRESH_TOKEN=

# Optionnel : ID du compte manager (MCC) si applicable
GOOGLE_ADS_LOGIN_CUSTOMER_ID=
```

### Etape 1 : Obtenir le Developer Token

1. Connexion a Google Ads (ads.google.com)
2. Outils et parametres > API Center
3. Demander un developer token (acces basique suffisant)
4. Le token est affiche apres approbation

### Etape 2 : Creer les credentials OAuth2

1. Aller sur Google Cloud Console (console.cloud.google.com)
2. Creer un projet ou selectionner le projet existant
3. Activer l'API Google Ads (`Google Ads API`)
4. APIs et services > Identifiants > Creer des identifiants > ID client OAuth 2.0
5. Type : Application Web
6. URI de redirection autorise : `https://developers.google.com/oauthplayground`
7. Recuperer le Client ID et Client Secret

### Etape 3 : Generer le Refresh Token

1. Aller sur https://developers.google.com/oauthplayground
2. Cliquer sur l'engrenage (Settings) en haut a droite
3. Cocher "Use your own OAuth credentials"
4. Saisir le Client ID et Client Secret
5. Dans la liste des scopes, chercher et selectionner :
   - `https://www.googleapis.com/auth/adwords`
6. Cliquer "Authorize APIs" et se connecter avec le compte Google qui a acces au compte Google Ads
7. Cliquer "Exchange authorization code for tokens"
8. Recuperer le Refresh Token

### Etape 4 : Creer l'action de conversion

1. Google Ads > Outils et parametres > Mesure > Conversions
2. Nouvelle action de conversion > Importation
3. Choisir "Autres sources de donnees ou CRM" > "Suivre les conversions de clics"
4. Nommer la conversion (ex: "Paiement demarche")
5. Definir la valeur : "Utiliser des valeurs differentes pour chaque conversion"
6. Devise : EUR
7. Modele d'attribution : recommande "Base sur les donnees" ou "Dernier clic"
8. Enregistrer et noter l'ID de l'action de conversion (visible dans l'URL : `conversionActionId=XXXXXXX`)

### Etape 5 : Configurer dans Vercel

Ajouter toutes les variables d'environnement dans les settings du projet Vercel (Settings > Environment Variables). Appliquer a l'environnement Production.

## Fichiers concernes

| Fichier | Role |
|---------|------|
| `src/lib/google-ads.ts` | Service d'envoi des conversions a l'API Google Ads |
| `src/lib/psp/webhook-handler.ts` | Appelle `sendConversion()` apres confirmation de paiement |
| `public/widget/advercity-widget.js` | Capture le gclid depuis l'URL du site partenaire |
| `src/app/embed/*/Embed*Form.tsx` | Lit le gclid des search params et le passe au formulaire |
| `src/components/processes/*/Form.tsx` | Transmet le gclid dans le body de la requete API |
| `src/app/api/embed/*/route.ts` | Stocke le gclid sur le Process en BDD |
| `src/app/api/checkout/route.ts` | Passe le gclid dans les metadata Stripe |
| `prisma/schema.prisma` | Champ `gclid String?` sur le modele Process |

## Fonctionnement technique

### Envoi de conversion (`src/lib/google-ads.ts`)

- Utilise l'API REST Google Ads v18 (`uploadClickConversions`)
- Authentification OAuth2 avec refresh token (access token genere a la demande)
- Enhanced Conversions : email et telephone sont hashes en SHA-256 avant envoi pour ameliorer le taux de match
- `orderId` (= reference Process) assure la deduplication cote Google
- Les erreurs sont loguees mais ne bloquent jamais le flux principal (paiement, email, envoi Advercity)

### Quand la conversion est-elle envoyee ?

Deux cas dans `webhook-handler.ts` :

1. **Paiement unique** (`handlePaymentSucceeded`) : quand un paiement de demarche est confirme par le PSP
2. **Souscription abonnement** (`handleCheckoutCompleted`) : quand un checkout en mode subscription est complete

### Donnees envoyees

```json
{
  "gclid": "EAIaI...",
  "conversionDateTime": "2026-04-08 14:30:00+02:00",
  "conversionValue": 14.90,
  "currencyCode": "EUR",
  "orderId": "DEM-2026-000042",
  "userIdentifiers": [
    { "hashedEmail": "a1b2c3..." },
    { "hashedPhoneNumber": "d4e5f6..." }
  ]
}
```

## Verification

### En local

Le service log dans la console :
- `[Google Ads] Non configure, conversion ignoree: DEM-...` → variables manquantes (normal en dev)
- `[Google Ads] Pas de gclid, conversion ignoree: DEM-...` → visiteur sans gclid (normal)
- `[Google Ads] Conversion envoyee: DEM-...` → succes
- `[Google Ads] Erreur partielle: ...` → probleme avec les donnees envoyees

### En production

1. Effectuer un achat test avec un lien contenant `?gclid=test123`
2. Verifier dans les logs Vercel que la conversion est envoyee
3. Dans Google Ads > Outils > Conversions > l'action de conversion doit afficher les conversions importees (delai de quelques heures)

### Diagnostic

Si les conversions n'apparaissent pas dans Google Ads :
- Verifier que le gclid est bien stocke sur le Process en BDD (`SELECT gclid FROM espace_abo.processes WHERE gclid IS NOT NULL`)
- Verifier les logs Vercel pour des erreurs `[Google Ads]`
- Le gclid doit etre un vrai gclid genere par Google (les valeurs test ne seront pas matchees)
- Les conversions peuvent mettre jusqu'a 24h pour apparaitre dans le rapport Google Ads

## Limites

- Le gclid a une duree de vie de 90 jours — une conversion envoyee avec un gclid plus ancien sera rejetee
- Seuls les visiteurs venant de Google Ads ont un gclid — les visiteurs organiques n'envoient pas de conversion (comportement attendu)
- Le tracking ne fonctionne que si le paiement est confirme par webhook — les paiements manuels ou hors-ligne ne declenchent pas de conversion
