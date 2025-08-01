// src/routes/localites.routes.ts
// Endpoints Fastify.js pour localités (départements et arrondissements)

import { FastifyInstance } from "fastify";
import { authenticate } from "../middlewares/authenticate";
import { restrictToAdmin } from "../middlewares/restrictToAdmin";
import { prisma } from "../lib/prisma";
import {
  getLocalitesStats,
  searchArrondissementsByDepartement,
  getAllDepartements,
  getAllRegionsSimple,
  searchLocalitesSimple,
  getMyLocalitesSimple,
} from "../controllers/localites.simple.controller";

export default async function (fastify: FastifyInstance) {
  // Routes nouvelles pour la hiérarchie géographique

  // Statistiques des localités
  fastify.get("/api/localites/stats", {
    handler: getLocalitesStats,
  });

  // Toutes les régions
  fastify.get("/api/localites/regions", {
    handler: getAllRegionsSimple,
  });

  // Tous les départements
  fastify.get("/api/localites/departements", {
    handler: getAllDepartements,
  });

  // Recherche de localités
  fastify.get("/api/localites/search", {
    handler: searchLocalitesSimple,
  });

  // Arrondissements d'un département (recherche simple)
  fastify.get("/api/localites/arrondissements/:departement", {
    handler: searchArrondissementsByDepartement,
  });

  // Localités accessibles pour l'utilisateur connecté
  fastify.get("/api/localites/my", {
    preHandler: [authenticate],
    handler: getMyLocalitesSimple,
  });

  // Routes existantes (maintenues pour compatibilité)

  // Route pour rechercher les arrondissements d'un département
  fastify.get(
    "/api/localites/test/arrondissements/:departement",
    async (request, reply) => {
      const { departement } = request.params as { departement: string };

      try {
        // Recherche dans les localités importées
        const arrondissements = await prisma.localites.findMany({
          where: {
            type: "arrondissement",
            valeur: { contains: departement, mode: "insensitive" },
          },
          orderBy: { valeur: "asc" },
        });

        reply.send({
          departement,
          arrondissements: arrondissements.map((a) => ({
            id: a.id,
            nom: a.valeur,
          })),
          total: arrondissements.length,
        });
      } catch (error) {
        reply.status(500).send({ error: "Erreur serveur" });
      }
    }
  );

  // Autocomplétion (route unique sans doublon)
  fastify.get(
    "/api/localites/autocomplete",
    { preHandler: [authenticate, restrictToAdmin] },
    async (request, reply) => {
      const { type, terme = "" } = request.query as {
        type: "departement" | "arrondissement";
        terme?: string;
      };

      if (!["departement", "arrondissement"].includes(type)) {
        return reply.code(400).send({ error: "Type de localité invalide" });
      }

      const rows = await prisma.localites.findMany({
        where: {
          type,
          valeur: { contains: terme, mode: "insensitive" },
        },
        take: 10,
        orderBy: { valeur: "asc" },
      });

      reply.send(rows.map((r) => r.valeur));
    }
  );
}
