import { FastifyInstance } from "fastify";
import {
  createProject,
  updateProject,
  deleteProject,
  getAllProjects,
} from "../controllers/projets.controller";
import { authenticate } from "../middlewares/authenticate";
import { restrictToAdmin } from "../middlewares/restrictToAdmin";

export default async function projetsRoutes(fastify: FastifyInstance) {
  fastify.post("/api/projets", {
    preHandler: [authenticate, restrictToAdmin],
    handler: createProject,
  });

  fastify.put("/api/projets/:id", {
    preHandler: [authenticate, restrictToAdmin],
    handler: updateProject,
  });

  fastify.delete("/api/projets/:id", {
    preHandler: [authenticate, restrictToAdmin],
    handler: deleteProject,
  });

  fastify.get("/api/projets", {
    preHandler: [authenticate],
    handler: getAllProjects,
  });
}
