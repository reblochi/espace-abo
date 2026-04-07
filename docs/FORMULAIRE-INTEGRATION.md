# Integration du formulaire de demarches

Guide d'integration du formulaire carte d'identite (et autres demarches) sur un site tiers ou en acces direct.

## Modes d'acces

Le formulaire est accessible de 3 facons :

| Mode | URL | Auth requise |
|------|-----|--------------|
| **Acces direct** | `https://franceguichet.fr/nouvelle-demarche/carte-identite` | Non |
| **Embed (iframe)** | `https://franceguichet.fr/embed/carte-identite?partner=nom` | Non |
| **Widget JS** | Script a integrer sur le site partenaire | Non |

L'utilisateur n'a jamais besoin de se connecter. Si son email ou telephone est deja dans la base abonnes, la demarche est automatiquement rattachee a son compte et les frais de traitement sont inclus dans l'abonnement.

## 1. Acces direct (lien simple)

Le plus simple. Un lien vers le formulaire :

```html
<a href="https://franceguichet.fr/nouvelle-demarche/carte-identite">
  Faire ma demande de carte d'identite
</a>
```

Avec un profil de pricing specifique :

```html
<a href="https://franceguichet.fr/nouvelle-demarche/carte-identite?pricing=A">
  Faire ma demande
</a>
```

## 2. Widget JS (recommande pour les partenaires)

Le widget ouvre le formulaire dans une modale par-dessus le site partenaire.

### Installation minimale

```html
<script>
  window.ADVERCITY_CONFIG = {
    baseUrl: 'https://franceguichet.fr',
    partner: 'nom-partenaire',
  };
</script>
<script src="https://franceguichet.fr/widget/advercity-widget.js"></script>

<button data-advercity="carte-identite">
  Demander une carte d'identite
</button>
```

### Avec profil pricing (AB testing)

```html
<script>
  window.ADVERCITY_CONFIG = {
    baseUrl: 'https://franceguichet.fr',
    partner: 'nom-partenaire',
    pricing: 'A',
  };
</script>
<script src="https://franceguichet.fr/widget/advercity-widget.js"></script>
```

Ou par bouton (pour tester plusieurs variantes sur la meme page) :

```html
<button data-advercity="carte-identite" data-advercity-pricing="A">
  Demander (formule A)
</button>
<button data-advercity="carte-identite" data-advercity-pricing="B">
  Demander (formule B)
</button>
```

### API JavaScript

```javascript
// Ouvrir le formulaire programmatiquement
Advercity.open('carte-identite', {
  partner: 'nom-partenaire',
  pricing: 'B',
});
```

### Parametres `ADVERCITY_CONFIG`

| Parametre | Type | Defaut | Description |
|-----------|------|--------|-------------|
| `baseUrl` | string | `https://franceguichet.fr` | URL de base de l'application |
| `partner` | string | `'default'` | Identifiant du partenaire (pour le suivi) |
| `pricing` | string | `''` | Code du profil de pricing (voir section AB testing) |

### Attributs data sur les boutons

| Attribut | Description |
|----------|-------------|
| `data-advercity="carte-identite"` | Type de demarche (obligatoire) |
| `data-advercity-partner="nom"` | Surcharge le partenaire global |
| `data-advercity-pricing="A"` | Surcharge le pricing global |

## 3. Embed iframe (integration directe)

Pour integrer le formulaire directement dans une page :

```html
<iframe
  src="https://franceguichet.fr/embed/carte-identite?partner=nom-partenaire&pricing=A"
  width="100%"
  height="800"
  frameborder="0"
  style="border: none; max-width: 720px;"
></iframe>
```

### Communication parent/iframe

L'iframe envoie des messages `postMessage` au parent :

```javascript
window.addEventListener('message', function(event) {
  if (event.data.source !== 'advercity-widget') return;

  switch (event.data.type) {
    case 'ready':
      // Formulaire charge
      break;
    case 'complete':
      // Demarche creee : event.data.reference
      console.log('Reference:', event.data.reference);
      break;
    case 'checkout':
      // Redirection paiement necessaire : event.data.url
      window.location.href = event.data.url;
      break;
  }
});
```

## Profils de pricing (AB testing)

Les profils sont configures dans `src/lib/process-types.ts` > `PRICING_PROFILES`.

### Profils disponibles

| Code | Mode | Prix abo | Prix prestation | Description |
|------|------|----------|-----------------|-------------|
| `default` | `both` | 9,90 EUR/mois | Standard | Checkbox abo + paiement a l'acte |
| `A` | `subscription` | 9,90 EUR/mois | — | Abonnement uniquement (force) |
| `B` | `one_time` | — | Standard | Paiement a l'acte uniquement |
| `C` | `both` | 7,90 EUR/mois | Standard | Abo reduit + choix |

### Modes de paiement

| `paymentMode` | Comportement |
|---------------|--------------|
| `both` | L'utilisateur voit le prix a l'acte + une checkbox pour souscrire a l'abonnement a la place |
| `subscription` | Abonnement obligatoire, texte informatif, pas de choix |
| `one_time` | Paiement a l'acte uniquement, aucune mention d'abonnement |

### Ajouter un profil

Editer `src/lib/process-types.ts` :

```typescript
export const PRICING_PROFILES: PricingProfile[] = [
  // ... profils existants
  {
    code: 'D',
    label: 'Variante D — presta a 29,90 EUR',
    paymentMode: 'both',
    subscriptionMonthlyPrice: 990,
    basePriceOverride: 2990, // Surcharge le prix de la demarche
  },
];
```

### Proprietes d'un profil

| Propriete | Type | Description |
|-----------|------|-------------|
| `code` | string | Identifiant unique (passe en `?pricing=`) |
| `label` | string | Description interne |
| `paymentMode` | `'both'` \| `'subscription'` \| `'one_time'` | Mode propose |
| `subscriptionMonthlyPrice` | number | Prix abo en centimes |
| `basePriceOverride` | number \| null | Surcharge prix prestation en centimes (`null` = prix par defaut de la demarche) |

### Distribuer les variantes

Cote site partenaire, distribuer aleatoirement le code :

```javascript
// AB testing 50/50
var pricing = Math.random() < 0.5 ? 'A' : 'B';
window.ADVERCITY_CONFIG = {
  partner: 'fridefont',
  pricing: pricing,
};
```

Ou via UTM :

```javascript
var params = new URLSearchParams(window.location.search);
window.ADVERCITY_CONFIG = {
  partner: 'fridefont',
  pricing: params.get('utm_content') || 'default',
};
```

## Detection automatique des abonnes

A la soumission du formulaire, le systeme cherche automatiquement si l'email ou le telephone saisi correspond a un abonne existant :

1. Recherche par email dans la base utilisateurs
2. Si pas trouve, recherche par telephone
3. Si abonne actif trouve : demarche creee directement (frais de traitement inclus, seuls les timbres fiscaux restent a charge)
4. Si non-abonne : redirection vers le paiement (acte ou abonnement selon le profil)

## Tarifs par demarche

Les prix de base sont configures dans `src/lib/process-types.ts` > `PROCESS_TYPES_CONFIG`.

| Demarche | Code | Prix de base |
|----------|------|-------------|
| Carte d'identite | `IDENTITY_CARD` | 39,90 EUR |
| Passeport | `PASSPORT` | 49,90 EUR |
| Acte de naissance | `CIVIL_STATUS_BIRTH` | 29,90 EUR |
| Acte de mariage | `CIVIL_STATUS_MARRIAGE` | 29,90 EUR |
| Acte de deces | `CIVIL_STATUS_DEATH` | 29,90 EUR |
| Carte grise | `REGISTRATION_CERT` | 79,90 EUR |

Le `basePriceOverride` d'un profil de pricing permet de surcharger ces prix pour une variante donnee.

## Types de demarches supportes en embed

| Slug URL | Type |
|----------|------|
| `carte-identite` | Carte d'identite |
| `acte-naissance` | Acte de naissance |

Les autres demarches seront ajoutees progressivement.
