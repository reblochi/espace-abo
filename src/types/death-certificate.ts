// Types pour l'acte de deces
// Aligne avec l'entite ProcessCivilStatusRecord d'Advercity

// Re-exports depuis birth-certificate
export { Gender, genderLabels, FRANCE_COUNTRY_ID } from './birth-certificate';
export type { GenderValue } from './birth-certificate';

// Types d'extrait pour acte de deces (sans extrait_filiation)
export const RecordType = {
  COPIE_INTEGRALE: 'copie_integrale',
  EXTRAIT_SANS_FILIATION: 'extrait_sans_filiation',
  EXTRAIT_PLURILINGUE: 'extrait_plurilingue',
} as const;

export type RecordTypeValue = typeof RecordType[keyof typeof RecordType];

// Labels pour les types d'extrait
export const recordTypeLabels: Record<RecordTypeValue, string> = {
  [RecordType.COPIE_INTEGRALE]: 'Copie integrale',
  [RecordType.EXTRAIT_SANS_FILIATION]: 'Extrait sans filiation',
  [RecordType.EXTRAIT_PLURILINGUE]: 'Extrait plurilingue',
};

export const recordTypeDescriptions: Record<RecordTypeValue, string> = {
  [RecordType.COPIE_INTEGRALE]: 'Reproduction integrale de l\'acte avec toutes les mentions marginales',
  [RecordType.EXTRAIT_SANS_FILIATION]: 'Extrait sans mention des parents',
  [RecordType.EXTRAIT_PLURILINGUE]: 'Extrait multilingue pour usage a l\'etranger',
};

// Types de demandeur (meme que birth certificate)
export const ClaimerType = {
  CONJOINT: 'conjoint',
  FILS_OU_FILLE: 'fils_ou_fille',
  PERE_OU_MERE: 'pere_ou_mere',
  REPRESENTANT_LEGAL: 'representant_legal',
  AUTRE: 'autre',
} as const;

export type ClaimerTypeValue = typeof ClaimerType[keyof typeof ClaimerType];

export const claimerTypeLabels: Record<ClaimerTypeValue, string> = {
  [ClaimerType.CONJOINT]: 'Conjoint(e)',
  [ClaimerType.FILS_OU_FILLE]: 'Fils ou fille',
  [ClaimerType.PERE_OU_MERE]: 'Pere ou mere',
  [ClaimerType.REPRESENTANT_LEGAL]: 'Representant legal',
  [ClaimerType.AUTRE]: 'Autre (mandataire, avocat...)',
};
