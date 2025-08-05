// src/services/extraction.service.ts
import axios from "axios";
import FormData from "form-data";
import { PrismaClient } from "@prisma/client";
import { titreFoncierExtractionService } from "../features/extraction/services/titreFoncier.service";
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
  /**
   * Récupère le workflow associé à un projet donné
   * @param projet_id ID du projet
   */
  async getWorkflowByProjetId(projet_id: number) {
    return prisma.workflows.findFirst({
      where: { projet_id },
    });
  }
  // private titreFoncierExtractionService: TitreFoncierExtractionService;

  constructor() {
    // this.titreFoncierExtractionService = new TitreFoncierExtractionService();
  }

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
      fichier: extraction.fichier ?? "",
      donnees_extraites: extraction.donnees_extraites ?? {},
      date_extraction: extraction.date_extraction ?? new Date(),
    };

    // TODO: Réactivation de la création automatique du titre foncier
    console.log(
      "[INFO] Création automatique du titre foncier temporairement désactivée"
    );

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

    // Vérifier si le passage est vers le niveau 2 (ordre 1 -> 2)
    const nextOrder = (task.ordre ?? 0) + 1;

    // Si passage au niveau 2, créer automatiquement le titre foncier
    if (nextOrder === 2) {
      try {
        // Trouver l'extraction liée au workflow
        const extraction = await prisma.extractions.findFirst({
          where: {
            projet_id: workflowId,
            statut: { in: ["validee", "en_cours", "soumise"] },
          },
          orderBy: { date_extraction: "desc" },
        });

        if (extraction && extraction.projet_id) {
          console.log(
            `[WORKFLOW] Création automatique du titre foncier pour l'extraction ${extraction.id}`
          );

          try {
            // Créer le titre foncier depuis l'extraction
            const extractionDto = {
              id: extraction.id,
              projet_id: extraction.projet_id,
              donnees_extraites: extraction.donnees_extraites,
            };

            const titreCreated =
              await titreFoncierExtractionService.createTitreFromExtraction(
                extractionDto,
                userId
              );

            if (titreCreated) {
              console.log(
                `[SUCCESS] Titre foncier ${titreCreated.id} créé automatiquement lors du passage au niveau 2`
              );

              // Mettre à jour le statut de l'extraction
              await prisma.extractions.update({
                where: { id: extraction.id },
                data: { statut: "titre_cree" },
              });
            }
          } catch (error) {
            console.error(
              `[ERROR] Erreur lors de la création automatique du titre foncier:`,
              error
            );
          }
        } else {
          console.log(
            `[WARN] Aucune extraction trouvée pour le workflow ${workflowId}`
          );
        }
      } catch (error) {
        console.error(
          `[ERROR] Erreur lors de la création automatique du titre foncier:`,
          error
        );
        // Continue le workflow même si la création du titre échoue
      }
    }

    await prisma.$transaction([
      prisma.workflows.create({
        data: {
          projet_id: workflowId, // correspond au champ du modèle
          ordre: nextOrder,
          utilisateur_id: userId,
          etape_nom:
            nextOrder === 2 ? "Validation Niveau 2" : `Étape ${nextOrder}`,
          // statut retiré car non présent dans le modèle
        },
      }),
      prisma.workflows.update({
        where: { id: task.id },
        data: {
          date_fin: new Date(), // Marquer l'étape précédente comme terminée
        }, // statut retiré car non présent dans le modèle
      }),
    ]);

    return {
      success: true,
      message:
        nextOrder === 2
          ? "Extraction soumise au niveau 2 avec création automatique du titre foncier"
          : `Extraction soumise à l'étape ${nextOrder}`,
      next_order: nextOrder,
    };
  }
}
