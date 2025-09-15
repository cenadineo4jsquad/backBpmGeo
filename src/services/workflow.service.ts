import { Pool } from "pg";
import { PrismaClient } from "@prisma/client";

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "geobpm",
  password: process.env.DB_PASSWORD || "",
  port: parseInt(process.env.DB_PORT ?? "5432", 10),
});

const prisma = new PrismaClient();
/**
 * Récupère la liste des workflows avec filtrage projet_id, titre_foncier_id, statut, localite (pour niveaux 1-2)
 */
export async function getWorkflows({
  projet_id,
  titre_foncier_id,
  statut,
  localite,
  niveau_hierarchique,
}: any) {
  let query = `SELECT * FROM workflows`;
  const where: string[] = [];
  const params: any[] = [];
  if (projet_id) {
    where.push(`projet_id = $${params.length + 1}`);
    params.push(projet_id);
  }
  if (titre_foncier_id) {
    where.push(`titre_foncier_id = $${params.length + 1}`);
    params.push(titre_foncier_id);
  }
  if (statut) {
    where.push(`statut = $${params.length + 1}`);
    params.push(statut);
  }
  if ((niveau_hierarchique === 1 || niveau_hierarchique === 2) && localite) {
    where.push(`localite->>'valeur' = $${params.length + 1}`);
    params.push(localite);
  }
  if (where.length) query += ` WHERE ` + where.join(" AND ");
  const { rows } = await pool.query(query, params);
  // Pour chaque workflow, charger les taches associées
  for (const wf of rows) {
    const tachesRes = await pool.query(
      "SELECT * FROM taches WHERE workflow_id = $1 ORDER BY etape_ordre ASC",
      [wf.id]
    );
    wf.taches = tachesRes.rows;
  }
  return rows;
}
// src/services/workflow.service.ts
// Squelette du service workflows pour Fastify

export async function createWorkflow(
  projet_id: number,
  titre_foncier_id: number,
  utilisateur_id: number
) {
  try {
    // Vérifier si un workflow existe déjà pour ce titre sur ce projet
    const existingWorkflow = await prisma.workflows.findFirst({
      where: {
        projet_id: projet_id,
        titre_foncier_id: titre_foncier_id,
      },
    });

    if (existingWorkflow) {
      // Si un workflow existe déjà, le retourner au lieu d'en créer un nouveau
      console.log(
        `[WORKFLOW] Un workflow existe déjà (ID: ${existingWorkflow.id}) pour le titre foncier ${titre_foncier_id}. Pas de duplication.`
      );
      return {
        id: existingWorkflow.id,
        projet_id,
        titre_foncier_id,
        status: "existant",
      };
    }

    // Créer un nouveau workflow pour un titre foncier
    const workflow = await prisma.workflows.create({
      data: {
        projet_id: projet_id,
        titre_foncier_id: titre_foncier_id,
        utilisateur_id: utilisateur_id,
        etape_nom: "Étape initiale",
        ordre: 1,
        date_debut: new Date(),
      },
    });

    console.log(
      `[WORKFLOW] Workflow créé avec ID: ${workflow.id} pour le titre foncier ${titre_foncier_id}`
    );
    return { id: workflow.id, projet_id, titre_foncier_id, status: "créé" };
  } catch (error) {
    console.error("[WORKFLOW] Erreur lors de la création du workflow:", error);
    throw error;
  }
}

export async function submitToNextStage(
  titre_foncier_id: number,
  projet_id: number,
  utilisateur_id: number
) {
  try {
    const result = await progressToNextStage(
      titre_foncier_id,
      projet_id,
      utilisateur_id
    );

    return { titre_foncier_id, status: "étape suivante soumise", result };
  } catch (error) {
    console.error(
      "[WORKFLOW] Erreur lors de la soumission à l'étape suivante:",
      error
    );
    throw error;
  }
}

export async function validateTask(
  id: number,
  statut: string,
  commentaire?: string,
  piece_jointe?: any
) {
  // Logique à compléter
  return { id, statut, commentaire, piece_jointe, status: "tâche validée" };
}

/**
 * Met à jour le workflow d'un titre foncier vers l'étape suivante
 * @param titre_foncier_id - ID du titre foncier
 * @param projet_id - ID du projet
 * @param utilisateur_id - ID de l'utilisateur qui effectue l'action
 * @returns Le nouveau workflow ou null si pas d'étape suivante
 */
export async function progressToNextStage(
  titre_foncier_id: number,
  projet_id: number,
  utilisateur_id: number
) {
  try {
    // Récupérer le workflow actuel du titre foncier pour ce projet
    const currentWorkflow = await prisma.workflows.findFirst({
      where: {
        titre_foncier_id: titre_foncier_id,
        projet_id: projet_id,
        date_fin: null,
      },
    });

    if (!currentWorkflow) {
      console.log(
        `[WORKFLOW] Aucun workflow actif trouvé pour le titre foncier ${titre_foncier_id} sur le projet ${projet_id}`
      );
      return null;
    }

    // Récupérer l'étape suivante
    const nextEtape = await prisma.etapes_workflow.findFirst({
      where: {
        projet_id: projet_id,
        ordre: {
          gt: currentWorkflow.ordre || 0,
        },
      },
      orderBy: {
        ordre: "asc",
      },
    });

    if (!nextEtape) {
      console.log(
        `[WORKFLOW] Aucune étape suivante trouvée pour le projet ${projet_id}`
      );
      return null;
    }

    // Terminer le workflow actuel
    await prisma.workflows.update({
      where: {
        id: currentWorkflow.id,
      },
      data: {
        date_fin: new Date(),
      },
    });

    // Créer le nouveau workflow pour l'étape suivante
    const newWorkflow = await prisma.workflows.create({
      data: {
        titre_foncier_id: titre_foncier_id,
        projet_id: projet_id,
        etape_nom: nextEtape.nom,
        ordre: nextEtape.ordre,
        date_debut: new Date(),
        utilisateur_id: utilisateur_id, // On enregistre qui a fait l'action
      },
    });

    console.log(
      `[WORKFLOW] Titre foncier ${titre_foncier_id} passé à l'étape suivante : "${nextEtape.nom}" (ordre: ${nextEtape.ordre}) par l'utilisateur ${utilisateur_id}`
    );
    return newWorkflow;
  } catch (error) {
    console.error(
      `[WORKFLOW] Erreur lors du passage à l'étape suivante:`,
      error
    );
    throw error;
  }
}
