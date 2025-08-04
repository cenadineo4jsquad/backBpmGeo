// src/services/extraction.service.ts
import axios from "axios";
import FormData from "form-data";
import { PrismaClient } from "@prisma/client";
// Import supprimé, non utilisé
import type { MultipartFile } from "fastify-multipart";

const prisma = new PrismaClient();
const FLASK_URL =
  process.env.FLASK_API_URL ?? "http://10.100.213.195:5000/api/process";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */
export interface ExtractionFilters {
  projet_id?: number;
  utilisateur_id?: number;
  statut?: string;
}

export class ExtractionService {
  /* ----------------------- READ ----------------------- */
  async getExtractions(filters: ExtractionFilters = {}) {
    return prisma.extractions.findMany({
      where: filters,
      include: { projets: true, utilisateurs: true },
      orderBy: { date_extraction: "desc" },
    });
  }

  async getExtractionById(id: number) {
    return prisma.extractions.findUnique({
      where: { id },
      include: { projets: true, utilisateurs: true },
    });
  }

  /* ----------------------- WRITE ----------------------- */
  async createExtraction(data: {
    projet_id: number;
    utilisateur_id: number;
    fichier: string;
    donnees_extraites: any;
    seuil_confiance: number;
    statut: string;
  }) {
    // Création de l'extraction
    const extraction = await prisma.extractions.create({
      data: {
        ...data,
        date_extraction: new Date(),
      },
    });

    // Correction du typage pour ExtractionData (pas de null)
    const extractionData = {
      id: extraction.id,
      projet_id: extraction.projet_id ?? 0,
      utilisateur_id: extraction.utilisateur_id ?? 0,
      fichier: extraction.fichier ?? '',
      donnees_extraites: extraction.donnees_extraites ?? {},
      date_extraction: extraction.date_extraction ?? new Date(),
    };

    // Création automatique du titre foncier lié à l'extraction
    try {
      // Import dynamique pour éviter les problèmes de dépendance circulaire
      const { TitreFoncierExtractionService } = await import("./titreFoncierExtraction.service");
      const titreFoncierExtractionService = new TitreFoncierExtractionService();
      await titreFoncierExtractionService.createTitreFromExtraction(extractionData, data.utilisateur_id);
    } catch (err) {
      console.error("[ERROR] Création automatique du titre foncier échouée :", err);
    }

    return extraction;
  }

  async deleteExtraction(id: number) {
    return prisma.extractions.delete({ where: { id } });
  }

  async validerExtraction(id: number) {
    return prisma.extractions.update({
      where: { id },
      data: { statut: "valide" },
    });
  }

  async rejeterExtraction(id: number) {
    return prisma.extractions.update({
      where: { id },
      data: { statut: "rejete" },
    });
  }

  async correctExtraction(id: number, data: Partial<any>) {
    return prisma.extractions.update({ where: { id }, data });
  }

  /* ----------------------- UPLOAD ----------------------- */
  async uploadExtractionToFlask(fileData: any, projetId: number) {
    console.log("[DEBUG] ExtractionService: Début uploadExtractionToFlask");
    console.log("[DEBUG] ExtractionService: Fichier reçu:", {
      filename: fileData.filename,
      mimetype: fileData.mimetype,
      fieldname: fileData.fieldname,
      hasBuffer: !!fileData.buffer,
      bufferSize: fileData.buffer ? fileData.buffer.length + " bytes" : "N/A",
    });

    const form = new FormData();

    // fileData contient maintenant un Buffer et les métadonnées
    form.append("file", fileData.buffer, {
      filename: fileData.filename || "document.pdf",
      contentType: fileData.mimetype || "application/pdf",
    });

    console.log("[DEBUG] ExtractionService: FormData préparée");
    console.log("[DEBUG] ExtractionService: URL Flask:", FLASK_URL);
    console.log("[DEBUG] ExtractionService: Envoi vers Flask...");

    try {
      const startTime = Date.now();
      console.log(
        "[DEBUG] ExtractionService: Timeout configuré à 300 secondes (5 minutes)"
      );

      const { data } = await axios.post(FLASK_URL, form, {
        headers: form.getHeaders(),
        maxBodyLength: Infinity,
        timeout: 300000, // 300 secondes = 5 minutes (augmenté pour Flask très lent)
        onUploadProgress: (progressEvent) => {
          const elapsed = Date.now() - startTime;
          console.log(
            `[DEBUG] ExtractionService: Upload progress: ${
              progressEvent.loaded
            } bytes (${Math.round(elapsed / 1000)}s écoulées)`
          );
        },
      });

      const endTime = Date.now();
      console.log(
        `[DEBUG] ExtractionService: Réponse Flask reçue en ${
          endTime - startTime
        }ms`
      );
      console.log("[DEBUG] ExtractionService: Données Flask:", data);
      return data;
    } catch (err: any) {
      console.log("[DEBUG] ExtractionService: Erreur Flask:", err.message);
      console.log("[DEBUG] ExtractionService: Code erreur:", err.code);

      if (err.response) {
        console.log(
          "[DEBUG] ExtractionService: Status Flask:",
          err.response.status
        );
        console.log(
          "[DEBUG] ExtractionService: Data Flask:",
          err.response.data
        );
        console.log(
          "[DEBUG] ExtractionService: Headers Flask:",
          err.response.headers
        );

        // Retourner la réponse d'erreur de Flask au lieu de throw
        return {
          error: err.response.data?.error || "Erreur Flask",
          status: err.response.status,
          flaskResponse: err.response.data,
        };
      } else if (err.code === "ECONNABORTED") {
        console.log(
          "[DEBUG] ExtractionService: Timeout Flask - le service prend plus de 5 minutes"
        );
        return {
          error: "Timeout: Le service Flask prend plus de 5 minutes à répondre",
          status: "timeout",
          timeout: true,
          timeout_duration: "300 secondes",
        };
      } else if (err.code === "ECONNREFUSED") {
        console.log("[DEBUG] ExtractionService: Flask inaccessible");
        return {
          error: "Service Flask inaccessible",
          status: "connection_refused",
          flask_unreachable: true,
        };
      }

      // Autres erreurs
      return {
        error: `Erreur inattendue: ${err.message}`,
        status: "unknown_error",
        originalError: err.message,
      };
    }
  }

  /* ----------------------- WORKFLOW ----------------------- */
  async submitToNextStage(workflowId: number, userId: number) {
    const task = await prisma.workflows.findFirst({
      where: { projet_id: workflowId, utilisateur_id: userId },
    });

    if (!task) throw new Error("Aucune tâche en attente");

    await prisma.$transaction([
      prisma.workflows.create({
        data: {
          projet_id: workflowId, // correspond au champ du modèle
          ordre: (task.ordre ?? 0) + 1,
          utilisateur_id: userId,
          // statut retiré car non présent dans le modèle
        },
      }),
      prisma.workflows.update({
        where: { id: task.id },
        data: {}, // statut retiré car non présent dans le modèle
      }),
    ]);
  }
}
