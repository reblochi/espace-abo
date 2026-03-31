// Définition des modèles de courriers

export interface CourrierField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'select';
  required: boolean;
  options?: string[];
  placeholder?: string;
}

export interface CourrierTemplate {
  id: string;
  category: 'resiliation' | 'administratif' | 'logement';
  title: string;
  description: string;
  fields: CourrierField[];
  bodyTemplate: string;
  recommande?: boolean;
}

export const COURRIER_CATEGORIES = [
  { id: 'resiliation', label: 'Résiliation' },
  { id: 'administratif', label: 'Administratif' },
  { id: 'logement', label: 'Logement' },
] as const;

export const COURRIER_TEMPLATES: CourrierTemplate[] = [
  // === RÉSILIATION ===
  {
    id: 'resiliation-fai',
    category: 'resiliation',
    title: 'Résiliation abonnement internet/mobile',
    description: 'Résilier un abonnement auprès de votre opérateur (Free, Orange, SFR, Bouygues...)',
    recommande: true,
    fields: [
      { name: 'destinataire', label: 'Opérateur', type: 'text', required: true, placeholder: 'Free Mobile, Orange, SFR...' },
      { name: 'adresseDestinataire', label: 'Adresse de l\'opérateur', type: 'textarea', required: true, placeholder: 'Service Résiliation\n75000 Paris' },
      { name: 'numeroContrat', label: 'Numéro de contrat/client', type: 'text', required: true },
      { name: 'typeAbonnement', label: 'Type d\'abonnement', type: 'select', required: true, options: ['Internet (box)', 'Mobile', 'Internet + Mobile'] },
      { name: 'motif', label: 'Motif de résiliation', type: 'select', required: true, options: ['Déménagement', 'Changement d\'opérateur', 'Motif personnel', 'Augmentation tarifaire', 'Insatisfaction du service'] },
      { name: 'dateEffet', label: 'Date d\'effet souhaitée', type: 'date', required: false },
    ],
    bodyTemplate: `Objet : Résiliation de mon abonnement {{typeAbonnement}} - N° {{numeroContrat}}

Madame, Monsieur,

Par la présente, je vous informe de ma volonté de résilier mon abonnement {{typeAbonnement}} souscrit auprès de vos services, référencé sous le numéro {{numeroContrat}}.

Motif : {{motif}}.

Je vous prie de bien vouloir prendre en compte cette résiliation{{dateEffet}} et de procéder à la clôture de mon compte dans les meilleurs délais.

Conformément aux dispositions légales, je vous demande de me confirmer la date effective de résiliation ainsi que les éventuels frais applicables.

Je vous remercie de m'adresser un courrier de confirmation de résiliation.

Dans l'attente de votre retour, je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.`,
  },
  {
    id: 'resiliation-assurance',
    category: 'resiliation',
    title: 'Résiliation contrat d\'assurance',
    description: 'Résilier un contrat d\'assurance (habitation, auto, santé...)',
    recommande: true,
    fields: [
      { name: 'destinataire', label: 'Compagnie d\'assurance', type: 'text', required: true, placeholder: 'AXA, MAIF, Allianz...' },
      { name: 'adresseDestinataire', label: 'Adresse de la compagnie', type: 'textarea', required: true },
      { name: 'numeroContrat', label: 'Numéro de contrat', type: 'text', required: true },
      { name: 'typeAssurance', label: 'Type d\'assurance', type: 'select', required: true, options: ['Habitation', 'Automobile', 'Santé / Mutuelle', 'Responsabilité civile', 'Autre'] },
      { name: 'motif', label: 'Motif', type: 'select', required: true, options: ['Échéance annuelle (loi Hamon)', 'Changement de situation', 'Vente du bien assuré', 'Augmentation injustifiée', 'Autre'] },
    ],
    bodyTemplate: `Objet : Résiliation du contrat d'assurance {{typeAssurance}} N° {{numeroContrat}}

Madame, Monsieur,

Je vous informe par la présente de ma décision de résilier mon contrat d'assurance {{typeAssurance}} référencé sous le numéro {{numeroContrat}}.

Cette résiliation intervient pour le motif suivant : {{motif}}.

Conformément aux dispositions du Code des assurances, je vous demande de prendre acte de cette résiliation et de me confirmer sa date d'effet.

Je vous prie de bien vouloir procéder au remboursement de la cotisation au prorata, le cas échéant.

Veuillez agréer, Madame, Monsieur, l'expression de mes salutations distinguées.`,
  },
  {
    id: 'resiliation-salle-sport',
    category: 'resiliation',
    title: 'Résiliation abonnement salle de sport',
    description: 'Résilier un abonnement en salle de sport (Basic Fit, Fitness Park...)',
    recommande: true,
    fields: [
      { name: 'destinataire', label: 'Salle de sport', type: 'text', required: true, placeholder: 'Basic Fit, Fitness Park...' },
      { name: 'adresseDestinataire', label: 'Adresse', type: 'textarea', required: true },
      { name: 'numeroAbonne', label: 'Numéro d\'abonné', type: 'text', required: true },
      { name: 'motif', label: 'Motif', type: 'select', required: true, options: ['Déménagement', 'Raison médicale', 'Fin d\'engagement', 'Motif personnel'] },
    ],
    bodyTemplate: `Objet : Résiliation de mon abonnement - N° {{numeroAbonne}}

Madame, Monsieur,

Par la présente, je souhaite résilier mon abonnement souscrit auprès de votre établissement, référencé sous le numéro {{numeroAbonne}}.

Motif de résiliation : {{motif}}.

Je vous demande de bien vouloir prendre en compte cette résiliation dans les délais prévus par les conditions générales et de me confirmer la date de fin de mon abonnement.

Veuillez agréer, Madame, Monsieur, mes salutations distinguées.`,
  },
  {
    id: 'resiliation-generique',
    category: 'resiliation',
    title: 'Résiliation de contrat (générique)',
    description: 'Modèle générique de résiliation adaptable à tout type de contrat',
    fields: [
      { name: 'destinataire', label: 'Destinataire', type: 'text', required: true },
      { name: 'adresseDestinataire', label: 'Adresse du destinataire', type: 'textarea', required: true },
      { name: 'numeroContrat', label: 'Numéro de contrat', type: 'text', required: true },
      { name: 'typeContrat', label: 'Type de contrat', type: 'text', required: true, placeholder: 'Abonnement, contrat de service...' },
      { name: 'motif', label: 'Motif', type: 'textarea', required: false, placeholder: 'Précisez le motif (optionnel)' },
    ],
    bodyTemplate: `Objet : Résiliation du contrat {{typeContrat}} N° {{numeroContrat}}

Madame, Monsieur,

Par la présente, je vous notifie ma volonté de résilier le contrat {{typeContrat}} souscrit auprès de vos services, portant le numéro {{numeroContrat}}.

{{motif}}

Je vous prie de bien vouloir prendre en compte cette résiliation et de m'en confirmer la date d'effet par retour de courrier.

Veuillez agréer, Madame, Monsieur, l'expression de mes salutations distinguées.`,
  },

  // === ADMINISTRATIF ===
  {
    id: 'demande-conge',
    category: 'administratif',
    title: 'Demande de congé à l\'employeur',
    description: 'Demande formelle de congés payés ou sans solde',
    fields: [
      { name: 'destinataire', label: 'Nom de l\'employeur / responsable', type: 'text', required: true },
      { name: 'adresseDestinataire', label: 'Adresse de l\'entreprise', type: 'textarea', required: true },
      { name: 'typeConge', label: 'Type de congé', type: 'select', required: true, options: ['Congés payés', 'Congé sans solde', 'Congé parental', 'Congé pour événement familial'] },
      { name: 'dateDebut', label: 'Date de début', type: 'date', required: true },
      { name: 'dateFin', label: 'Date de fin', type: 'date', required: true },
    ],
    bodyTemplate: `Objet : Demande de {{typeConge}}

Madame, Monsieur,

Je sollicite par la présente l'autorisation de bénéficier d'un {{typeConge}} du {{dateDebut}} au {{dateFin}} inclus.

Je reste à votre disposition pour toute information complémentaire et m'engage à assurer la continuité de mes missions avant mon départ.

Dans l'attente de votre accord, je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.`,
  },
  {
    id: 'changement-situation-caf',
    category: 'administratif',
    title: 'Déclaration changement de situation (CAF)',
    description: 'Informer la CAF d\'un changement de situation personnelle ou professionnelle',
    fields: [
      { name: 'adresseDestinataire', label: 'Adresse de votre CAF', type: 'textarea', required: true, placeholder: 'CAF de votre département\nAdresse...' },
      { name: 'numeroCaf', label: 'Numéro d\'allocataire', type: 'text', required: true },
      { name: 'changement', label: 'Nature du changement', type: 'select', required: true, options: ['Déménagement', 'Changement de situation professionnelle', 'Naissance / adoption', 'Séparation / divorce', 'Changement de revenus'] },
      { name: 'details', label: 'Détails', type: 'textarea', required: true, placeholder: 'Précisez les détails du changement...' },
      { name: 'dateChangement', label: 'Date du changement', type: 'date', required: true },
    ],
    bodyTemplate: `Objet : Déclaration de changement de situation - Allocataire N° {{numeroCaf}}

Madame, Monsieur,

Je vous informe par la présente d'un changement de situation intervenu le {{dateChangement}} :

Nature du changement : {{changement}}

{{details}}

Je vous prie de bien vouloir mettre à jour mon dossier et de recalculer mes droits en conséquence.

Je reste à votre disposition pour tout document complémentaire.

Veuillez agréer, Madame, Monsieur, l'expression de mes salutations distinguées.`,
  },
  {
    id: 'contestation-amende',
    category: 'administratif',
    title: 'Contestation d\'amende / PV',
    description: 'Contester une amende ou un procès-verbal',
    recommande: true,
    fields: [
      { name: 'adresseDestinataire', label: 'Adresse de l\'OMP', type: 'textarea', required: true, placeholder: 'Officier du Ministère Public\nTribunal de Police de...' },
      { name: 'numeroAvis', label: 'Numéro de l\'avis de contravention', type: 'text', required: true },
      { name: 'dateInfraction', label: 'Date de l\'infraction', type: 'date', required: true },
      { name: 'motif', label: 'Motif de contestation', type: 'textarea', required: true, placeholder: 'Expliquez pourquoi vous contestez cette amende...' },
    ],
    bodyTemplate: `Objet : Contestation de l'avis de contravention N° {{numeroAvis}}

Monsieur l'Officier du Ministère Public,

J'ai l'honneur de porter à votre connaissance ma contestation de l'avis de contravention N° {{numeroAvis}}, dressé le {{dateInfraction}}.

Je conteste cette amende pour le motif suivant :

{{motif}}

En conséquence, je vous prie de bien vouloir classer sans suite cette contravention ou, à défaut, de me permettre de faire valoir mes arguments devant le tribunal compétent.

Je joins à ce courrier l'avis de contravention original ainsi que les éléments justificatifs.

Veuillez agréer, Monsieur l'Officier du Ministère Public, l'expression de mes salutations respectueuses.`,
  },

  // === LOGEMENT ===
  {
    id: 'preavis-depart',
    category: 'logement',
    title: 'Préavis de départ (locataire)',
    description: 'Donner son préavis de départ au propriétaire (1 ou 3 mois)',
    recommande: true,
    fields: [
      { name: 'destinataire', label: 'Nom du propriétaire / agence', type: 'text', required: true },
      { name: 'adresseDestinataire', label: 'Adresse du propriétaire', type: 'textarea', required: true },
      { name: 'adresseLogement', label: 'Adresse du logement quitté', type: 'textarea', required: true },
      { name: 'dureePreavis', label: 'Durée du préavis', type: 'select', required: true, options: ['1 mois (zone tendue / meublé)', '3 mois (location vide)'] },
      { name: 'dateDepart', label: 'Date de départ souhaitée', type: 'date', required: true },
    ],
    bodyTemplate: `Objet : Congé du logement situé {{adresseLogement}}

Madame, Monsieur,

Je vous informe par la présente de ma décision de quitter le logement que j'occupe à l'adresse suivante :

{{adresseLogement}}

Conformément à l'article 15 de la loi du 6 juillet 1989, je respecterai un préavis de {{dureePreavis}}.

Ma date de départ est fixée au {{dateDepart}}.

Je me tiens à votre disposition pour convenir d'une date pour l'état des lieux de sortie et la remise des clés.

Je vous rappelle que le dépôt de garantie devra m'être restitué dans un délai d'un mois après l'état des lieux, déduction faite des éventuelles retenues justifiées.

Veuillez agréer, Madame, Monsieur, l'expression de mes salutations distinguées.`,
  },
  {
    id: 'demande-reparation',
    category: 'logement',
    title: 'Demande de réparation au propriétaire',
    description: 'Demander au propriétaire d\'effectuer des réparations dans le logement',
    fields: [
      { name: 'destinataire', label: 'Nom du propriétaire / agence', type: 'text', required: true },
      { name: 'adresseDestinataire', label: 'Adresse du propriétaire', type: 'textarea', required: true },
      { name: 'adresseLogement', label: 'Adresse du logement', type: 'textarea', required: true },
      { name: 'description', label: 'Description des réparations nécessaires', type: 'textarea', required: true, placeholder: 'Décrivez les problèmes constatés...' },
      { name: 'urgence', label: 'Degré d\'urgence', type: 'select', required: true, options: ['Urgent (sécurité / habitabilité)', 'Important', 'Non urgent'] },
    ],
    bodyTemplate: `Objet : Demande de réparations - Logement {{adresseLogement}}

Madame, Monsieur,

En ma qualité de locataire du logement situé {{adresseLogement}}, je me permets de vous signaler les désordres suivants nécessitant votre intervention :

{{description}}

Degré d'urgence : {{urgence}}.

Conformément à l'article 6 de la loi du 6 juillet 1989, le bailleur est tenu de remettre au locataire un logement décent et d'effectuer les réparations nécessaires au maintien en état du logement.

Je vous remercie de bien vouloir faire procéder aux réparations dans les meilleurs délais.

Veuillez agréer, Madame, Monsieur, l'expression de mes salutations distinguées.`,
  },
  {
    id: 'mise-en-demeure-depot-garantie',
    category: 'logement',
    title: 'Mise en demeure restitution dépôt de garantie',
    description: 'Réclamer la restitution du dépôt de garantie après un départ',
    recommande: true,
    fields: [
      { name: 'destinataire', label: 'Nom du propriétaire / agence', type: 'text', required: true },
      { name: 'adresseDestinataire', label: 'Adresse du propriétaire', type: 'textarea', required: true },
      { name: 'adresseLogement', label: 'Adresse de l\'ancien logement', type: 'textarea', required: true },
      { name: 'montant', label: 'Montant du dépôt de garantie', type: 'text', required: true, placeholder: '800 €' },
      { name: 'dateEtatLieux', label: 'Date de l\'état des lieux de sortie', type: 'date', required: true },
    ],
    bodyTemplate: `Objet : Mise en demeure de restitution du dépôt de garantie

Madame, Monsieur,

J'ai quitté le logement situé {{adresseLogement}} et l'état des lieux de sortie a été réalisé le {{dateEtatLieux}}.

À ce jour, je n'ai toujours pas reçu la restitution de mon dépôt de garantie d'un montant de {{montant}}.

Or, conformément à l'article 22 de la loi du 6 juillet 1989, le bailleur est tenu de restituer le dépôt de garantie dans un délai maximal d'un mois (si l'état des lieux de sortie est conforme) ou de deux mois (en cas de différences).

Par la présente, je vous mets en demeure de procéder à la restitution de la somme de {{montant}} dans un délai de 8 jours à compter de la réception de ce courrier.

À défaut, je me verrai dans l'obligation de saisir la commission départementale de conciliation ou le tribunal compétent.

Veuillez agréer, Madame, Monsieur, l'expression de mes salutations distinguées.`,
  },
];

export function getTemplate(id: string): CourrierTemplate | undefined {
  return COURRIER_TEMPLATES.find((t) => t.id === id);
}

export function getTemplatesByCategory(category: string): CourrierTemplate[] {
  return COURRIER_TEMPLATES.filter((t) => t.category === category);
}
