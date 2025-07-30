import { FastifyInstance } from "fastify";
import {
  createWorkflowHandler,
  submitToNextStageHandler,
  validateTaskHandler,
  getWorkflowsHandler,
  // getWorkflowByIdHandler,
} from "../controllers/workflows.controller";
import { authenticate } from "../middlewares/authenticate";
import { restrictToAdmin } from "../middlewares/restrictToAdmin";
import { restrictToFirstUser } from "../middlewares/restrictToFirstUser";

export default async function workflowsRoutes(fastify: FastifyInstance) {
  // Liste tous les workflows accessibles à l'utilisateur authentifié
  fastify.get(
    "/api/workflows",
    { preHandler: [authenticate] },
    getWorkflowsHandler
  );
  // Crée un nouveau workflow (réservé à l'admin)
  fastify.post(
    "/api/workflows",
    { preHandler: [authenticate, restrictToAdmin] },
    createWorkflowHandler
  );
  // Récupère les détails d'un workflow par son id
  fastify.get(
    "/api/workflows/:id",
    { preHandler: [authenticate] },
    getWorkflowsHandler
  );
  // Soumet le workflow à l'étape suivante (utilisateur courant)
  fastify.post(
    "/api/workflows/submit",
    { preHandler: [authenticate] },
    submitToNextStageHandler
  );
  // Valide ou rejette une tâche d'un workflow (utilisateur courant)
  fastify.put(
    "/api/taches/:id/valider",
    { preHandler: [authenticate] },
    validateTaskHandler
  );
}
