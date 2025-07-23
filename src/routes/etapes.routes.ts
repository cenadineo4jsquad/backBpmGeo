import { FastifyInstance } from "fastify";
import {
  createEtape,
  updateEtape,
  deleteEtape,
  getEtapesByProjet,
} from "../controllers/etapes.controller";
import { authenticate } from "../middlewares/authenticate";
import { restrictToAdmin } from "../middlewares/restrictToAdmin";

export default async function (fastify: FastifyInstance) {
  fastify.post("/api/etapes", {
    preHandler: [authenticate, restrictToAdmin],
    handler: createEtape,
  });
  fastify.put("/api/etapes/:id", {
    preHandler: [authenticate, restrictToAdmin],
    handler: updateEtape,
  });
  fastify.delete("/api/etapes/:id", {
    preHandler: [authenticate, restrictToAdmin],
    handler: deleteEtape,
  });
  fastify.get("/api/etapes/projet/:projet_id", {
    preHandler: [authenticate],
    handler: getEtapesByProjet,
  });
}
