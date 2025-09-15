// src/services/extraction.service.ts
import axios from "axios";
import FormData from "form-data";
import { PrismaClient } from "@prisma/client";
import { titreFoncierExtractionService } from "../features/extraction/services/titreFoncier.service";
import { createWorkflow } from "./workflow.service";
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

    // Si l'extraction est réussie, créer le titre foncier et le workflow associé
    if (extraction && extraction.projet_id) {
      try {
        const titreFoncierCree =
          await titreFoncierExtractionService.createTitreFromExtraction(
            extraction,
            data.utilisateur_id
          );

        if (titreFoncierCree && titreFoncierCree.id) {
          await prisma.extractions.update({
            where: { id: extraction.id },
            data: { statut: "titre_cree" },
          });
          console.log(
            `[SUCCESS] Titre foncier ${titreFoncierCree.id} créé à partir de l'extraction ${extraction.id}.`
          );

          // Créer le workflow initial pour ce titre foncier
          await createWorkflow(
            extraction.projet_id,
            titreFoncierCree.id,
            data.utilisateur_id
          );
          console.log(
            `[SUCCESS] Workflow initial créé pour le titre foncier ${titreFoncierCree.id}.`
          );

        } else {
          console.log(
            `[WARN] Impossible de créer le titre foncier pour l'extraction ${extraction.id} - données insuffisantes ou invalides.`
          );
        }
      } catch (error) {
        console.error(
          `[ERROR] Erreur lors de la création du titre foncier ou du workflow pour l'extraction ${extraction.id}:`,
          error
        );
        // On ne propage pas l'erreur pour ne pas faire échouer la création de l'extraction elle-même
      }
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
    console.log(
      `[WORKFLOW] Début submitToNextStage - workflowId: ${workflowId}, userId: ${userId}`
    );

    // 1. Récupérer le workflow actuel
    const currentWorkflow = await prisma.workflows.findUnique({
      where: {
        id: workflowId,
      },
    });

    if (!currentWorkflow) {
      console.log(
        `[WORKFLOW] Aucun workflow actif trouvé pour l'ID ${workflowId}`
      );
      throw new Error("Aucun workflow actif trouvé");
    }

    if (currentWorkflow.utilisateur_id !== userId) {
        throw new Error("L'utilisateur n'est pas autorisé à soumettre ce workflow.");
    }

    if (currentWorkflow.date_fin) {
        throw new Error("Le workflow est déjà terminé.");
    }

    if (!currentWorkflow.titre_foncier_id) {
        throw new Error("Le workflow n'est pas lié à un titre foncier.");
    }

    // 2. Récupérer l'étape suivante du projet
    const currentOrder = currentWorkflow.ordre ?? 1;
    const nextOrder = currentOrder + 1;
    const nextEtape = await prisma.etapes_workflow.findFirst({
      where: {
        projet_id: currentWorkflow.projet_id,
        ordre: nextOrder,
      },
    });

    if (!nextEtape) {
      console.log(
        `[WORKFLOW] Aucune étape suivante trouvée pour l'ordre ${nextOrder}. Le processus se termine ici.`
      );
      // Terminer le workflow actuel sans en créer de nouveau car c'est la fin.
      await prisma.workflows.update({
        where: { id: currentWorkflow.id },
        data: { date_fin: new Date() },
      });
      return {
        success: true,
        message: `Titre Foncier ${currentWorkflow.titre_foncier_id} traité. C'était la dernière étape du workflow.`,
        next_order: null,
        next_etape: null,
      };
    }

    console.log(
      `[WORKFLOW] Étape suivante trouvée: ${nextEtape.nom} (ordre: ${nextEtape.ordre})`
    );

    // Transaction pour terminer le workflow actuel et créer le suivant
    await prisma.$transaction([
      prisma.workflows.update({
        where: { id: currentWorkflow.id },
        data: {
          date_fin: new Date(),
        },
      }),
      prisma.workflows.create({
        data: {
          projet_id: currentWorkflow.projet_id,
          ordre: nextOrder,
          utilisateur_id: userId, // or maybe the user of the next step?
          etape_nom: nextEtape.nom,
          date_debut: new Date(),
          titre_foncier_id: currentWorkflow.titre_foncier_id,
        },
      }),
    ]);

    console.log(
      `[WORKFLOW] Transition réussie vers l'étape "${nextEtape.nom}"`
    );
    return {
      success: true,
      message: `Extraction soumise à l'étape "${nextEtape.nom}"`,
      next_order: nextOrder,
      next_etape: nextEtape.nom,
      titre_foncier_id: currentWorkflow.titre_foncier_id,
    };
  }

  
}
