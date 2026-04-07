// Types pour la carte d'identite (CNI)
// Aligne avec l'entite ProcessIdentityCard d'Advercity

// Civilite (gender) - reutilise de birth-certificate
export { Gender, type GenderValue, genderLabels, FRANCE_COUNTRY_ID } from './birth-certificate';

// ============================================================
// MOTIFS DE DEMANDE
// ============================================================

export const RequestMotif = {
  PREMIERE_DEMANDE: '13',
  RENOUVELLEMENT_VOL: '14',
  RENOUVELLEMENT_PERTE: '15',
  RENOUVELLEMENT_EXPIRATION: '16',
  MODIFICATION_ETAT_CIVIL: '17',
  CHANGEMENT_ADRESSE: '18',
  RECTIFICATION: '19',
  DETERIORATION: '20',
  IDENTITE_NUMERIQUE: '21',
} as const;

export type RequestMotifValue = typeof RequestMotif[keyof typeof RequestMotif];

export const requestMotifLabels: Record<RequestMotifValue, string> = {
  [RequestMotif.PREMIERE_DEMANDE]: 'Premiere demande',
  [RequestMotif.RENOUVELLEMENT_VOL]: 'Renouvellement pour vol',
  [RequestMotif.RENOUVELLEMENT_PERTE]: 'Renouvellement pour perte',
  [RequestMotif.RENOUVELLEMENT_EXPIRATION]: 'Renouvellement (expiration)',
  [RequestMotif.MODIFICATION_ETAT_CIVIL]: 'Modification d\'etat civil',
  [RequestMotif.CHANGEMENT_ADRESSE]: 'Changement d\'adresse',
  [RequestMotif.RECTIFICATION]: 'Rectification',
  [RequestMotif.DETERIORATION]: 'Deterioration',
  [RequestMotif.IDENTITE_NUMERIQUE]: 'Identite numerique',
};

export const requestMotifDescriptions: Record<RequestMotifValue, string> = {
  [RequestMotif.PREMIERE_DEMANDE]: 'Vous n\'avez jamais possede de carte d\'identite',
  [RequestMotif.RENOUVELLEMENT_VOL]: 'Votre carte a ete volee',
  [RequestMotif.RENOUVELLEMENT_PERTE]: 'Vous avez perdu votre carte',
  [RequestMotif.RENOUVELLEMENT_EXPIRATION]: 'Votre carte n\'est plus valide',
  [RequestMotif.MODIFICATION_ETAT_CIVIL]: 'Changement de nom, mariage...',
  [RequestMotif.CHANGEMENT_ADRESSE]: 'Vous avez demenage',
  [RequestMotif.RECTIFICATION]: 'Erreur sur votre carte actuelle',
  [RequestMotif.DETERIORATION]: 'Votre carte est abimee',
  [RequestMotif.IDENTITE_NUMERIQUE]: 'Ajout de l\'identite numerique',
};

// ============================================================
// RAISON NATIONALITE FRANCAISE
// ============================================================

export const NationalityReason = {
  PARENT_FRANCAIS: 'parent-francais',
  PARENT_FRANCE: 'parent-france',
  PARENT_ANCIEN_TERRITOIRE: 'parent-ancien-territoire',
  PARENT_FRANCAIS_PAS_NE_FRANCE: 'parent-francais-pas-ne-france',
  PARENT_MAJORITE: 'parent-majorite',
  MARIAGE: 'mariage',
  PARENT_PAS_FRANCAIS: 'parent-pas-francais',
  NATURALISE: 'naturalise',
  REINTEGRE: 'reintegre',
  DECLARATION: 'declaration',
  AUTRE: 'autre',
} as const;

export type NationalityReasonValue = typeof NationalityReason[keyof typeof NationalityReason];

export const nationalityReasonLabels: Record<NationalityReasonValue, string> = {
  [NationalityReason.PARENT_FRANCAIS]: 'Ne(e) en France, au moins un parent francais',
  [NationalityReason.PARENT_FRANCE]: 'Ne(e) en France, au moins un parent ne en France',
  [NationalityReason.PARENT_ANCIEN_TERRITOIRE]: 'Ne(e) en France, parent ne dans un ancien territoire francais',
  [NationalityReason.PARENT_FRANCAIS_PAS_NE_FRANCE]: 'Pas ne(e) en France, au moins un parent francais',
  [NationalityReason.PARENT_MAJORITE]: 'Parent devenu francais avant votre majorite',
  [NationalityReason.MARIAGE]: 'Nationalite francaise par mariage',
  [NationalityReason.PARENT_PAS_FRANCAIS]: 'Ne(e) en France, parents non francais',
  [NationalityReason.NATURALISE]: 'Naturalise(e) francais(e)',
  [NationalityReason.REINTEGRE]: 'Reintegration de la nationalite francaise',
  [NationalityReason.DECLARATION]: 'Francais(e) par declaration (hors mariage)',
  [NationalityReason.AUTRE]: 'Autre motif',
};

// ============================================================
// NOM D'USAGE
// ============================================================

export const UsageNameType = {
  PERE: 'Pere',
  MERE: 'Mere',
  EPOUX: 'Epoux',
  EPOUSE: 'Epouse',
} as const;

export type UsageNameTypeValue = typeof UsageNameType[keyof typeof UsageNameType];

export const usageNameTypeLabels: Record<UsageNameTypeValue, string> = {
  [UsageNameType.PERE]: 'Nom du pere',
  [UsageNameType.MERE]: 'Nom de la mere',
  [UsageNameType.EPOUX]: 'Nom de l\'epoux',
  [UsageNameType.EPOUSE]: 'Nom de l\'epouse',
};

// ============================================================
// MOT ADDITIONNEL NOM
// ============================================================

export const AdditionalNameWord = {
  EPOUX: 'Epoux',
  VEUF: 'Veuf',
} as const;

export type AdditionalNameWordValue = typeof AdditionalNameWord[keyof typeof AdditionalNameWord];

export const additionalNameWordLabels: Record<AdditionalNameWordValue, string> = {
  [AdditionalNameWord.EPOUX]: 'Epoux(se)',
  [AdditionalNameWord.VEUF]: 'Veuf(ve)',
};

// ============================================================
// CASE 2004 (motif expiration)
// ============================================================

/** Motif necessitant la case 2004 (renouvellement expiration) */
export const CASE_2004_MOTIF = RequestMotif.RENOUVELLEMENT_EXPIRATION;

// ============================================================
// MODE DE RECEPTION
// ============================================================

export const ReceptionMode = {
  MAIL: 'Mail',
  COURRIER: 'Courrier',
} as const;

export type ReceptionModeValue = typeof ReceptionMode[keyof typeof ReceptionMode];

// ============================================================
// TIMBRE FISCAL
// ============================================================

/** Montant du timbre fiscal en centimes (25 EUR) */
export const STAMP_TAX_AMOUNT = 2500;

/** Montant reduit pour la Guyane en centimes (12.50 EUR) */
export const STAMP_TAX_GUYANA = 1250;

/** Motifs necessitant un timbre fiscal (vol, perte) */
export const STAMP_TAX_MOTIFS: RequestMotifValue[] = [
  RequestMotif.RENOUVELLEMENT_VOL,
  RequestMotif.RENOUVELLEMENT_PERTE,
];

/**
 * Calcule le montant du timbre fiscal en centimes.
 * @param motif - Motif de la demande
 * @param zipCode - Code postal du demandeur (pour detecter Guyane 973)
 * @returns Montant en centimes (0 si pas de timbre)
 */
export function calculateStampTax(motif: string, zipCode?: string): number {
  if (!STAMP_TAX_MOTIFS.includes(motif as RequestMotifValue)) return 0;
  if (zipCode && zipCode.startsWith('973')) return STAMP_TAX_GUYANA;
  return STAMP_TAX_AMOUNT;
}
