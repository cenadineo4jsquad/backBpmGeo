import { prisma } from "../../../lib/prisma";
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
      `Création du titre foncier à partir de l'extraction ${extraction.id} pour l'utilisateur ${userId}`
    );

    const donnees = extraction.donnees_extraites;

    if (!donnees || !donnees.owner_name || !donnees.area_value) {
      console.log(
        `[WARN] Données d'extraction insuffisantes pour créer un titre foncier pour l'extraction ${extraction.id}.`
      );
      return null;
    }

    try {
      const nouveauTitre = await prisma.titres_fonciers.create({
        data: {
          projet_id: extraction.projet_id,
          proprietaire: donnees.owner_name,
          superficie: donnees.area_value,
          perimetre: donnees.polygon?.perimeter,
          coordonnees_gps: donnees.Coordonnees,
          centroide: donnees.polygon?.centroid,
          localite: donnees.arrondissement_name,
          statut: 'En cours de traitement', // Statut initial
        },
      });

      console.log(
        `[SUCCESS] Titre foncier ${nouveauTitre.id} créé avec succès.`
      );
      return nouveauTitre;

    } catch (error) {
      console.error(`[ERROR] Erreur lors de la création du titre foncier dans la base de données:`, error);
      throw new Error("La création du titre foncier en base de données a échoué.");
    }
  },
};

export default titreFoncierExtractionService;
