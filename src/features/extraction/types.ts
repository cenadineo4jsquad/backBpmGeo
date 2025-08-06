export interface ExtractionMetadata {
  fileName: string;
  extractedAt: Date;
  recordCount: number;
  fileSize?: number;
  mimeType?: string;
}

export interface ExtractionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: ExtractionMetadata;
}

export interface ExtractionError {
  code: string;
  message: string;
  details?: any;
}

export interface ExtractionProgress {
  current: number;
  total: number;
  percentage: number;
  status: string;
}

export interface TitreData {
  proprietaire: string;
  coordonnees_gps: number[][];
  superficie: number;
  perimetre: number;
  localite: {
    type: string;
    valeur: string;
  };
}

export interface ExtractionDto {
  id: number;
  projet_id: number;
  utilisateur_id?: number;
  fichier?: string;
  donnees_extraites: any;
  seuil_confiance?: number;
  statut?: string;
  date_extraction?: Date;
}
