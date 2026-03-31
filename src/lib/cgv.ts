// Conditions Générales de Vente — version et hash
// Quand les CGV changent : mettre à jour CGV_TEXT et bumper CGV_VERSION

import crypto from 'crypto';

export const CGV_VERSION = '2026-03-31';

export const CGV_TEXT = `CONDITIONS GÉNÉRALES DE VENTE — France Guichet (SAF)

Le service France Guichet (SAF - Service d'Aide aux Formalités) est un service privé d'assistance aux démarches administratives. Il n'est affilié à aucune administration publique.

1. OBJET
Le présent contrat a pour objet de définir les conditions dans lesquelles France Guichet fournit un service d'assistance aux démarches administratives, soit à l'unité, soit via un abonnement mensuel.

2. ABONNEMENT
L'abonnement mensuel est facturé 9,90 € TTC par mois. Il donne accès aux démarches incluses dans l'offre. L'abonnement est sans engagement et peut être résilié à tout moment. La résiliation prend effet à la fin de la période en cours.

3. DÉMARCHES À L'UNITÉ
Les démarches à l'unité sont facturées selon le tarif affiché au moment de la commande. Le paiement est dû avant le traitement de la démarche.

4. DROIT DE RÉTRACTATION
Conformément à l'article L221-28 du Code de la consommation, le droit de rétractation ne s'applique pas aux services pleinement exécutés avant la fin du délai de rétractation. Pour les services non encore exécutés, le client dispose d'un délai de 14 jours pour exercer son droit de rétractation.

5. DONNÉES PERSONNELLES
Les données personnelles collectées sont traitées conformément au RGPD. Elles sont nécessaires au traitement des démarches et à la gestion de l'abonnement. Le client peut exercer ses droits (accès, rectification, effacement) en contactant le service client.

6. RESPONSABILITÉ
France Guichet s'engage à transmettre les demandes aux administrations compétentes dans les meilleurs délais. Les délais de traitement dépendent des administrations et ne sont pas de la responsabilité de France Guichet.

7. LOI APPLICABLE
Le présent contrat est soumis au droit français. Tout litige sera porté devant les tribunaux compétents.`;

export const CGV_HASH = crypto.createHash('sha256').update(CGV_TEXT).digest('hex');
