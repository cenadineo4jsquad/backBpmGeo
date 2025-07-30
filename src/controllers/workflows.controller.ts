import { FastifyRequest, FastifyReply } from "fastify";
import { getWorkflows, createWorkflow, submitToNextStage, validateTask } from "../services/workflow.service";
export const getWorkflowsHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const user = request.user as any;
    const { projet_id, titre_foncier_id, statut } = request.query as any;
    // Pour niveaux 1-2, filtrer par localite
    let localite = undefined;
    if (user.niveau_hierarchique === 1 || user.niveau_hierarchique === 2) {
      localite = user.localite?.valeur;
    }
    const workflows = await getWorkflows({
      projet_id,
      titre_foncier_id,
      statut,
      localite,
      niveau_hierarchique: user.niveau_hierarchique,
    });
    reply.status(200).send(workflows);
  } catch (error) {
    reply
      .status(500)
      .send({ error: "Erreur lors de la récupération des workflows" });
  }
};

export const createWorkflowHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { projet_id, titre_foncier_id } = request.body as any;
    const workflow = await createWorkflow(
      projet_id,
      titre_foncier_id
    );
    reply.status(201).send(workflow);
  } catch (error) {
    reply.status(500).send({ error: "Erreur lors de la création du workflow" });
  }
};

export const submitToNextStageHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { workflow_id } = request.body as any;
    const result = await submitToNextStage(workflow_id);
    reply.send(result);
  } catch (error) {
    reply
      .status(500)
      .send({ error: "Erreur lors de la soumission à l’étape suivante" });
  }
};

export const validateTaskHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params as any;
    const { statut, commentaire, piece_jointe } = request.body as any;
    const result = await validateTask(
      id,
      statut,
      commentaire,
      piece_jointe
    );
    reply.send(result);
  } catch (error) {
    reply
      .status(500)
      .send({ error: "Erreur lors de la validation de la tâche" });
  }
};
