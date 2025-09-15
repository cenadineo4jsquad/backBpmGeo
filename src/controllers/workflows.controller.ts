import { FastifyRequest, FastifyReply } from "fastify";
import { getWorkflows, createWorkflow, submitToNextStage, validateTask } from "../services/workflow.service";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
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
    const user = request.user as any; // Get the user from the request
    if (!user || !user.id) { // Add a check for the user
        return reply.status(401).send({ error: "Utilisateur non authentifié" });
    }
    const workflow = await createWorkflow(
      projet_id,
      titre_foncier_id,
      user.id // Pass the user's ID
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
    const user = request.user as any;

    const currentWorkflow = await prisma.workflows.findUnique({
      where: { id: workflow_id },
    });

    if (!currentWorkflow) {
      return reply.status(404).send({ error: "Workflow non trouvé" });
    }

    if (!currentWorkflow.titre_foncier_id) {
      return reply
        .status(400)
        .send({ error: "Le workflow n'est pas lié à un titre foncier." });
    }
    if (!currentWorkflow.projet_id) {
      return reply
        .status(400)
        .send({ error: "Le workflow n'est pas lié à un projet." });
    }

    const result = await submitToNextStage(
      currentWorkflow.titre_foncier_id,
      currentWorkflow.projet_id,
      user.id
    );
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
