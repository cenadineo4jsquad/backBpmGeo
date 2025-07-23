import {
  getTitresFoncier,
  getTitreFoncierById,
  updateTitreFoncier,
} from "../controllers/titresFoncier.controller";
import { FastifyInstance } from "fastify";
import { authenticate } from "../middlewares/authenticate";
import { restrictToAdmin } from "../middlewares/restrictToAdmin";
import { restrictToFirstUser } from "../middlewares/restrictToFirstUser";

export default async function titresFoncierRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/titres-foncier",
    { preHandler: [authenticate] },
    getTitresFoncier
  );
  fastify.get(
    "/titres-foncier/:id",
    { preHandler: [authenticate] },
    getTitreFoncierById
  );
  fastify.put(
    "/titres-foncier/:id",
    { preHandler: [authenticate, restrictToAdmin] },
    updateTitreFoncier
  );
  // Si vous souhaitez ajouter la création, il faudra d'abord implémenter createTitreFoncier dans le contrôleur
}
