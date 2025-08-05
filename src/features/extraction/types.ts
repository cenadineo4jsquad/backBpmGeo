// src/features/extraction/types.ts
export type TitreData = {
  proprietaire: string;
  coordonnees_gps: number[][];
  superficie: number;
  perimetre: number;
  localite: { type: string; valeur: string };
};

export type ExtractionDto = {
  id: number;
  projet_id: number;
  utilisateur_id?: number;
  fichier?: string;
  donnees_extraites: any;
  date_extraction?: Date;
};
