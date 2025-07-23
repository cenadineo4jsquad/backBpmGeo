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
