// Types pour le certificat d'immatriculation (carte grise)

// Types d'operation alignes avec RegistrationCertificateType d'Advercity
export const OperationType = {
  CHANGEMENT_TITULAIRE: 1,   // TYPE_TITULAIRE
  CHANGEMENT_ADRESSE: 2,     // TYPE_DOMICILE
  DUPLICATA: 3,              // TYPE_DUPLICATA
} as const;

export type OperationTypeValue = typeof OperationType[keyof typeof OperationType];

// Etats du vehicule
export const VehicleState = {
  OCCASION: 0,
  NEUF: 1,
} as const;

export type VehicleStateValue = typeof VehicleState[keyof typeof VehicleState];

// Motifs de duplicata
export const DuplicateReason = {
  VOL: 0,
  PERTE: 1,
  DETERIORATION: 2,
} as const;

export type DuplicateReasonValue = typeof DuplicateReason[keyof typeof DuplicateReason];

// Labels pour les types d'operation
export const operationTypeLabels: Record<OperationTypeValue, string> = {
  [OperationType.CHANGEMENT_TITULAIRE]: 'Changement de titulaire',
  [OperationType.CHANGEMENT_ADRESSE]: 'Changement d\'adresse',
  [OperationType.DUPLICATA]: 'Duplicata (perte, vol, deterioration)',
};

export const vehicleStateLabels: Record<VehicleStateValue, string> = {
  [VehicleState.OCCASION]: 'Occasion',
  [VehicleState.NEUF]: 'Neuf',
};

export const duplicateReasonLabels: Record<DuplicateReasonValue, string> = {
  [DuplicateReason.VOL]: 'Vol',
  [DuplicateReason.PERTE]: 'Perte',
  [DuplicateReason.DETERIORATION]: 'Deterioration',
};
