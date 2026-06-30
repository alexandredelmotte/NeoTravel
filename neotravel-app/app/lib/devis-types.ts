export type CodeDateDemande =
  | "DD_PRIORITAIRE"
  | "DD_URGENT"
  | "DD_NORMAL"
  | "DD_3MOISETPLUS";

export interface CalculerDevisInput {
  prixBase: number;
  distanceKm?: number;
  dateDepart: Date | string;
  codeDateDemande: CodeDateDemande;
  nombrePassagers: number;
  nombreJoursGuide?: number;
  nombreNuitsChauffeur?: number;
  forfaitPeages?: number;
}

export interface CalculDevisDetail {
  prixBase: number;
  coefficientSaisonnalite: number;
  coefficientDateDemande: number;
  coefficientCapacite: number;
  totalCoefficients: number;
  montantAjuste: number;
  supplements: number;
  sousTotalHt: number;
  margeCommerciale: number;
  totalApresMargeHt: number;
  tva: number;
  prixFinalTtc: number;
}
