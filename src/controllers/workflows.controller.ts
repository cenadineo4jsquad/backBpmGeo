import { FastifyRequest, FastifyReply } from "fastify";
import * as workflowService from "../services/workflow.service";

export const createWorkflowHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { projet_id, titre_foncier_id } = request.body as any;
    const workflow = await workflowService.createWorkflow(
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
    const result = await workflowService.submitToNextStage(workflow_id);
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
    const result = await workflowService.validateTask(
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
