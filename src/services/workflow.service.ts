import pool from "../config/pool";
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
  // Logique à compléter
  return { id: 1, projet_id, titre_foncier_id, status: "créé" };
}

export async function submitToNextStage(workflow_id: number) {
  // Logique à compléter
  return { workflow_id, status: "étape suivante soumise" };
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
