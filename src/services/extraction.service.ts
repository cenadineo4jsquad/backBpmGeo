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
  projetId?: number;
  utilisateurId?: number;
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
  async uploadExtractionToFlask(file: MultipartFile, projetId: number) {
    const form = new FormData();
    form.append("file", await file.toBuffer(), {
      filename: file.filename,
      contentType: file.mimetype,
    });

    try {
      const { data } = await axios.post(FLASK_URL, form, {
        headers: form.getHeaders(),
        maxBodyLength: Infinity,
      });
      return data;
    } catch (err: any) {
      throw new Error(`Flask error: ${err.message}`);
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
