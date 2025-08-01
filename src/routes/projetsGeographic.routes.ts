import { FastifyInstance } from "fastify";
import { authenticate } from "../middlewares/authenticate";
import {
  getProjectsWithGeographicAccess,
  getProjectByIdWithGeographicAccess,
  createProjectWithGeographicAccess,
  updateProjectWithGeographicAccess,
  deleteProjectWithGeographicAccess,
  getProjectStatsWithGeographicAccess,
} from "../controllers/projetsGeographic.controller";

export default async function projetsGeographicRoutes(
  fastify: FastifyInstance
) {
  // Routes avec accès géographique restrictif

  // Récupérer tous les projets accessibles par l'utilisateur selon sa localité
  fastify.get(
    "/api/projets/geographic",
    { preHandler: [authenticate] },
    getProjectsWithGeographicAccess
  );

  // Récupérer un projet spécifique avec vérification d'accès géographique
  fastify.get(
    "/api/projets/geographic/:id",
    { preHandler: [authenticate] },
    getProjectByIdWithGeographicAccess
  );

  // Créer un projet avec restriction géographique
  fastify.post(
    "/api/projets/geographic",
    { preHandler: [authenticate] },
    createProjectWithGeographicAccess
  );

  // Mettre à jour un projet avec vérification d'accès géographique
  fastify.put(
    "/api/projets/geographic/:id",
    { preHandler: [authenticate] },
    updateProjectWithGeographicAccess
  );

  // Supprimer un projet avec vérification d'accès géographique
  fastify.delete(
    "/api/projets/geographic/:id",
    { preHandler: [authenticate] },
    deleteProjectWithGeographicAccess
  );

  // Statistiques des projets selon l'accès géographique de l'utilisateur
  fastify.get(
    "/api/projets/geographic/stats",
    { preHandler: [authenticate] },
    getProjectStatsWithGeographicAccess
  );
}
