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
  // Valide ou rejette un workflow (avancer ou reculer l'étape)
  fastify.put(
    "/api/workflows/:id/valider",
    { preHandler: [authenticate] },
    require("../controllers/workflows.controller").validerWorkflowHandler
  );
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
  // (Supprimé) Valide ou rejette une tâche d'un workflow (remplacé par /api/workflows/:id/valider)
}
