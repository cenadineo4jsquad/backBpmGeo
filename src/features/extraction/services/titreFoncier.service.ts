import { prisma } from '../../../lib/prisma';
import { ExtractionResult } from "../types";

export interface TitreFoncierExtractionData {
  numero: string;
  surface: number;
  proprietaire: string;
  localite: string;
  dateCreation: Date;
}

export const titreFoncierExtractionService = {
  async extractTitreFoncierData(
    filePath: string
  ): Promise<ExtractionResult<TitreFoncierExtractionData>> {
    // Implementation for extracting titre foncier data
    console.log(`Extracting titre foncier data from: ${filePath}`);

    // Mock implementation - replace with actual extraction logic
    return {
      success: true,
      data: {
        numero: "TF-2024-001",
        surface: 1250.5,
        proprietaire: "John Doe",
        localite: "Paris",
        dateCreation: new Date(),
      },
      metadata: {
        fileName: filePath,
        extractedAt: new Date(),
        recordCount: 1,
      },
    };
  },

  async validateTitreFoncierData(
    data: TitreFoncierExtractionData
  ): Promise<boolean> {
    // Validation logic for titre foncier data
    return !!(
      data.numero &&
      data.surface > 0 &&
      data.proprietaire &&
      data.localite
    );
  },

  async createTitreFromExtraction(extraction: any, userId: number) {
    console.log(
      `[REAL] Attempting to create Titre Foncier from extraction ${extraction.id}`
    );
    const data = extraction.donnees_extraites;

    // 1. Valider que les données essentielles sont présentes
    if (
      !data ||
      !data.numero ||
      !data.surface ||
      !data.proprietaire ||
      !data.localite
    ) {
      console.warn(
        `[FAIL] Validation failed for extraction ${extraction.id}. Missing required data.`
      );
      return null; // Retourne null pour indiquer l'échec, comme attendu par le service appelant
    }

    // 2. Tenter de créer l'enregistrement en base de données
    try {
      const newTitreFoncier = await prisma.titres_fonciers.create({
        data: {
          projet_id: extraction.projet_id,
          proprietaire: data.proprietaire,
          superficie: data.surface,
          perimetre: data.perimetre, // Optionnel
          coordonnees_gps: data.coordonnees_gps, // Optionnel
          centroide: data.centroide, // Optionnel
          localite: data.localite,
        },
      });

      // 3. Lier le nouveau titre à l'extraction dans la table de liaison
      await prisma.titres_extractions.create({
        data: {
          titre_id: newTitreFoncier.id,
          extraction_id: extraction.id,
        },
      });

      console.log(
        `[SUCCESS] Created and linked Titre Foncier ${newTitreFoncier.id} from extraction ${extraction.id}`
      );
      return newTitreFoncier;
    } catch (error) {
      console.error(
        `[ERROR] Database error while creating titre foncier for extraction ${extraction.id}:`,
        error
      );
      return null; // En cas d'erreur BDD, on retourne aussi null
    }
  },
};

export default titreFoncierExtractionService;
