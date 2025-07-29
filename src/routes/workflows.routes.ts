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
  fastify.get(
    "/api/workflows",
    { preHandler: [authenticate] },
    getWorkflowsHandler
  );
  fastify.post(
    "/api/workflows",
    { preHandler: [authenticate, restrictToAdmin] },
    createWorkflowHandler
  );
  fastify.get(
    "/api/workflows/:id",
    { preHandler: [authenticate] },
    getWorkflowsHandler
  );
  fastify.post(
    "/api/workflows/submit",
    { preHandler: [authenticate] },
    submitToNextStageHandler
  );
  fastify.put(
    "/api/taches/:id/valider",
    { preHandler: [authenticate] },
    validateTaskHandler
  );
}
