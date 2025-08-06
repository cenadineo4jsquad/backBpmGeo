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
  titre_foncier_id: number
) {
  try {
    // Créer un nouveau workflow pour un titre foncier
    const workflow = await prisma.workflows.create({
      data: {
        projet_id: projet_id,
        titre_foncier_id: titre_foncier_id,
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

export async function submitToNextStage(workflow_id: number) {
  try {
    // Utiliser la fonction progressToNextStage existante
    const currentWorkflow = await prisma.workflows.findUnique({
      where: { id: workflow_id },
    });

    if (!currentWorkflow || !currentWorkflow.utilisateur_id) {
      throw new Error("Workflow non trouvé ou utilisateur manquant");
    }

    const result = await progressToNextStage(
      currentWorkflow.utilisateur_id,
      currentWorkflow.projet_id || 0
    );

    return { workflow_id, status: "étape suivante soumise", result };
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
 * Assigne automatiquement un workflow à un utilisateur basé sur son rôle et le projet
 * @param utilisateur_id - ID de l'utilisateur
 * @param projet_id - ID du projet
 * @param role_niveau_hierarchique - Niveau hiérarchique du rôle de l'utilisateur
 * @returns Le workflow assigné ou null si aucune étape appropriée
 */
export async function assignWorkflowToUser(
  utilisateur_id: number,
  projet_id: number,
  role_niveau_hierarchique?: number
) {
  try {
    // Récupérer les étapes du projet, triées par ordre
    const etapes = await prisma.etapes_workflow.findMany({
      where: {
        projet_id: projet_id,
      },
      orderBy: {
        ordre: "asc",
      },
    });

    if (etapes.length === 0) {
      console.log(
        `[WORKFLOW] Aucune étape trouvée pour le projet ${projet_id}`
      );
      return null;
    }

    // Déterminer quelle étape assigner en fonction du niveau hiérarchique
    let etapeToAssign;

    if (role_niveau_hierarchique) {
      // Stratégie : assigner l'étape correspondant au niveau hiérarchique
      // Niveau 1 -> Première étape, Niveau 2 -> Deuxième étape, etc.
      const etapeIndex = Math.min(
        role_niveau_hierarchique - 1,
        etapes.length - 1
      );
      etapeToAssign = etapes[etapeIndex];
    } else {
      // Par défaut, assigner la première étape
      etapeToAssign = etapes[0];
    }

    // Vérifier si l'utilisateur a déjà un workflow actif pour ce projet
    const existingWorkflow = await prisma.workflows.findFirst({
      where: {
        utilisateur_id: utilisateur_id,
        projet_id: projet_id,
        date_fin: null, // Workflow actif (non terminé)
      },
    });

    if (existingWorkflow) {
      console.log(
        `[WORKFLOW] L'utilisateur ${utilisateur_id} a déjà un workflow actif pour le projet ${projet_id}`
      );
      return existingWorkflow;
    }

    // Créer le nouveau workflow
    const newWorkflow = await prisma.workflows.create({
      data: {
        utilisateur_id: utilisateur_id,
        projet_id: projet_id,
        etape_nom: etapeToAssign.nom,
        ordre: etapeToAssign.ordre,
        date_debut: new Date(),
      },
    });

    console.log(
      `[WORKFLOW] Workflow assigné à l'utilisateur ${utilisateur_id} : étape "${etapeToAssign.nom}" (ordre: ${etapeToAssign.ordre})`
    );
    return newWorkflow;
  } catch (error) {
    console.error(
      `[WORKFLOW] Erreur lors de l'assignation du workflow:`,
      error
    );
    throw error;
  }
}

/**
 * Met à jour le workflow d'un utilisateur vers l'étape suivante
 * @param utilisateur_id - ID de l'utilisateur
 * @param projet_id - ID du projet
 * @returns Le nouveau workflow ou null si pas d'étape suivante
 */
export async function progressToNextStage(
  utilisateur_id: number,
  projet_id: number
) {
  try {
    // Récupérer le workflow actuel de l'utilisateur
    const currentWorkflow = await prisma.workflows.findFirst({
      where: {
        utilisateur_id: utilisateur_id,
        projet_id: projet_id,
        date_fin: null,
      },
    });

    if (!currentWorkflow) {
      console.log(
        `[WORKFLOW] Aucun workflow actif trouvé pour l'utilisateur ${utilisateur_id} sur le projet ${projet_id}`
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
        `[WORKFLOW] Aucune étape suivante trouvée pour l'utilisateur ${utilisateur_id}`
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
        utilisateur_id: utilisateur_id,
        projet_id: projet_id,
        etape_nom: nextEtape.nom,
        ordre: nextEtape.ordre,
        date_debut: new Date(),
      },
    });

    console.log(
      `[WORKFLOW] Utilisateur ${utilisateur_id} passé à l'étape suivante : "${nextEtape.nom}" (ordre: ${nextEtape.ordre})`
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

/**
 * Récupère le workflow actuel d'un utilisateur pour un projet donné
 * @param utilisateur_id - ID de l'utilisateur
 * @param projet_id - ID du projet
 * @returns Le workflow actuel ou null
 */
export async function getCurrentUserWorkflow(
  utilisateur_id: number,
  projet_id: number
) {
  try {
    const workflow = await prisma.workflows.findFirst({
      where: {
        utilisateur_id: utilisateur_id,
        projet_id: projet_id,
        date_fin: null,
      },
      orderBy: {
        date_debut: "desc",
      },
    });

    return workflow;
  } catch (error) {
    console.error(
      `[WORKFLOW] Erreur lors de la récupération du workflow:`,
      error
    );
    throw error;
  }
}
