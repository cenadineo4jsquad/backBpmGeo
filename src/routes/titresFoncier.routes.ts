import {
  getTitresFoncier,
  getTitreFoncierById,
  updateTitreFoncier,
  createTitreFoncier,
  deleteTitreFoncier,
  getTitresGeojson,
} from "../controllers/titresFoncier.controller";
import { FastifyInstance } from "fastify";
import { authenticate } from "../middlewares/authenticate";
import { restrictToAdmin } from "../middlewares/restrictToAdmin";
import { restrictToFirstUser } from "../middlewares/restrictToFirstUser";

export default async function titresFoncierRoutes(fastify: FastifyInstance) {
  // Liste tous les titres fonciers (conforme doc: /api/titres_fonciers)
  fastify.get(
    "/api/titres_fonciers",
    { preHandler: [authenticate] },
    getTitresFoncier
  );
  // Détail d'un titre foncier (conforme doc: /api/titres_fonciers/:id)
  fastify.get(
    "/api/titres_fonciers/:id",
    { preHandler: [authenticate] },
    getTitreFoncierById
  );
  // Ajout d'un titre foncier (conforme doc: /api/titres_fonciers)
  fastify.post(
    "/api/titres_fonciers",
    { preHandler: [authenticate] },
    createTitreFoncier
  );
  // Modification d'un titre foncier (conforme doc: /api/titres_fonciers/:id)
  fastify.put(
    "/api/titres_fonciers/:id",
    { preHandler: [authenticate] },
    updateTitreFoncier
  );
  // Suppression d'un titre foncier
  fastify.delete(
    "/api/titres_fonciers/:id",
    { preHandler: [authenticate, restrictToAdmin] },
    deleteTitreFoncier
  );
  // Route GeoJSON
  fastify.get(
  "/api/titres_fonciers/geojson",
  { preHandler: [authenticate] },
  getTitresGeojson
);
}
