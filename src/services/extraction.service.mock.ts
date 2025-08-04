import { MultipartFile } from "@fastify/multipart";
import { Logger } from "pino";

export interface ExtractionFilters {
  projetId?: number;
  utilisateurId?: number;
  statut?: string;
}

export class MockExtractionService {
  constructor(private logger: Logger) {}

  async uploadExtractionToFlask(file: MultipartFile, projetId: number) {
    this.logger.info(
      "[MOCK] Simulation extraction Flask pour projet:",
      projetId
    );
    this.logger.info("[MOCK] Fichier reçu:", {
      filename: file.filename,
      mimetype: file.mimetype,
      fieldname: file.fieldname,
    });

    // Simuler un traitement
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Retourner des données simulées
    return {
      id: "mock-" + Date.now(),
      fichier: file.filename,
      donnees_extraites: {
        // Simulation de données extraites
        nom_proprietaire: "MOCK - Jean Dupont",
        superficie: "500 m²",
        numero_titre: "TF-" + Math.floor(Math.random() * 10000),
        localisation: "Yaoundé, Cameroun",
        date_creation: new Date().toISOString(),
        statut: "Extraction simulée avec succès",
      },
      status: "success",
      message: "Extraction simulée avec succès (SERVICE MOCK)",
    };
  }

  async submitToNextStage(workflowId: number, userId: number) {
    this.logger.info("[MOCK] Simulation soumission étape suivante");
    return { success: true, message: "Étape suivante simulée" };
  }

  // Méthodes mock pour les autres fonctionnalités
  async validerExtraction(id: number) {
    this.logger.info("[MOCK] Validation extraction:", id);
    return { success: true, message: "Extraction validée (MOCK)" };
  }

  async rejeterExtraction(id: number) {
    this.logger.info("[MOCK] Rejet extraction:", id);
    return { success: true, message: "Extraction rejetée (MOCK)" };
  }

  async getExtractions(filters: ExtractionFilters = {}) {
    this.logger.info("[MOCK] Récupération extractions avec filtres:", filters);
    return [
      {
        id: 1,
        projet_id: filters.projetId || 22,
        utilisateur_id: filters.utilisateurId || 44,
        fichier: "mock-file.pdf",
        statut: "en_attente",
        date_extraction: new Date(),
        seuil_confiance: 0.95,
        workflow_initiated: false,
        donnees_extraites: {
          nom_proprietaire: "MOCK - Jean Dupont",
          superficie: "500 m²",
        },
        projets: {
          id: 22,
          nom: "Projet Mock",
          description: "Description mock",
          date_creation: new Date(),
          localite_id: 1,
          statut: "actif",
        },
        utilisateurs: {
          id: 44,
          niveau_hierarchique: 1,
          nom: "Mock",
          prenom: "Utilisateur",
          email: "mock@test.com",
          mot_de_passe: "hash",
          date_creation: new Date(),
          localite_id: 1,
          nom_complet: "Utilisateur Mock",
        },
      },
    ];
  }

  async getExtractionById(id: number) {
    this.logger.info("[MOCK] Récupération extraction par ID:", id);
    return {
      id: id,
      projet_id: 22,
      utilisateur_id: 44,
      fichier: "mock-file.pdf",
      statut: "en_attente",
      date_extraction: new Date(),
      seuil_confiance: 0.95,
      workflow_initiated: false,
      donnees_extraites: {
        nom_proprietaire: "MOCK - Jean Dupont",
        superficie: "500 m²",
      },
      projets: {
        id: 22,
        nom: "Projet Mock",
        description: "Description mock",
        date_creation: new Date(),
        localite_id: 1,
        statut: "actif",
      },
      utilisateurs: {
        id: 44,
        niveau_hierarchique: 1,
        nom: "Mock",
        prenom: "Utilisateur",
        email: "mock@test.com",
        mot_de_passe: "hash",
        date_creation: new Date(),
        localite_id: 1,
        nom_complet: "Utilisateur Mock",
      },
    };
  }

  async deleteExtraction(id: number) {
    this.logger.info("[MOCK] Suppression extraction:", id);
    return { success: true, message: "Extraction supprimée (MOCK)" };
  }

  async correctExtraction(id: number, corrections: any) {
    this.logger.info("[MOCK] Correction extraction:", id, corrections);
    return {
      id: id,
      ...corrections,
      message: "Extraction corrigée (MOCK)",
    };
  }
}
