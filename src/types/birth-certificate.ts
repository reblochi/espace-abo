// Types pour l'acte de naissance
// Aligne avec l'entite ProcessCivilStatusRecord d'Advercity

// Types d'extrait (recordType)
export const RecordType = {
  COPIE_INTEGRALE: 'copie_integrale',
  EXTRAIT_FILIATION: 'extrait_filiation',
  EXTRAIT_SANS_FILIATION: 'extrait_sans_filiation',
  EXTRAIT_PLURILINGUE: 'extrait_plurilingue',
} as const;

export type RecordTypeValue = typeof RecordType[keyof typeof RecordType];

// Labels pour les types d'extrait
export const recordTypeLabels: Record<RecordTypeValue, string> = {
  [RecordType.COPIE_INTEGRALE]: 'Copie integrale',
  [RecordType.EXTRAIT_FILIATION]: 'Extrait avec filiation',
  [RecordType.EXTRAIT_SANS_FILIATION]: 'Extrait sans filiation',
  [RecordType.EXTRAIT_PLURILINGUE]: 'Extrait plurilingue',
};

export const recordTypeDescriptions: Record<RecordTypeValue, string> = {
  [RecordType.COPIE_INTEGRALE]: 'Reproduction integrale de l\'acte avec toutes les mentions marginales',
  [RecordType.EXTRAIT_FILIATION]: 'Extrait mentionnant les informations des parents',
  [RecordType.EXTRAIT_SANS_FILIATION]: 'Extrait sans mention des parents',
  [RecordType.EXTRAIT_PLURILINGUE]: 'Extrait multilingue pour usage a l\'etranger',
};

// Types de demandeur (claimerType)
export const ClaimerType = {
  TITULAIRE: 'titulaire',
  PERE_OU_MERE: 'pere_ou_mere',
  CONJOINT: 'conjoint',
  FILS_OU_FILLE: 'fils_ou_fille',
  REPRESENTANT_LEGAL: 'representant_legal',
  AUTRE: 'autre',
} as const;

export type ClaimerTypeValue = typeof ClaimerType[keyof typeof ClaimerType];

export const claimerTypeLabels: Record<ClaimerTypeValue, string> = {
  [ClaimerType.TITULAIRE]: 'La personne concernee par l\'acte',
  [ClaimerType.PERE_OU_MERE]: 'Pere ou mere',
  [ClaimerType.CONJOINT]: 'Conjoint(e)',
  [ClaimerType.FILS_OU_FILLE]: 'Fils ou fille',
  [ClaimerType.REPRESENTANT_LEGAL]: 'Representant legal',
  [ClaimerType.AUTRE]: 'Autre (mandataire, avocat...)',
};

// Civilite (gender)
export const Gender = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
} as const;

export type GenderValue = typeof Gender[keyof typeof Gender];

export const genderLabels: Record<GenderValue, string> = {
  [Gender.MALE]: 'Monsieur',
  [Gender.FEMALE]: 'Madame',
};

// ID pays France dans Advercity
export const FRANCE_COUNTRY_ID = 257;
