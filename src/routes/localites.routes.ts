// src/routes/localites.routes.ts
// Endpoints Fastify.js pour localités (départements et arrondissements)

import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { authenticate } from "../middlewares/authenticate";
import { restrictToAdmin } from "../middlewares/restrictToAdmin";

export default async function (fastify: any) {
  // Liste des départements
  fastify.get(
    "/api/localites/departements",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { rows } = await fastify.pg.query(
        "SELECT valeur FROM localites WHERE type = 'departement' ORDER BY valeur"
      );
      reply.send(rows.map((r: { valeur: string }) => r.valeur));
    }
  );

  // Liste des arrondissements
  fastify.get(
    "/api/localites/arrondissements",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { rows } = await fastify.pg.query(
        "SELECT valeur FROM localites WHERE type = 'arrondissement' ORDER BY valeur"
      );
      reply.send(rows.map((r: { valeur: string }) => r.valeur));
    }
  );

  // Autocomplétion
  fastify.get(
    "/api/localites/autocomplete",
    { preHandler: [authenticate, restrictToAdmin] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Accès robuste à la query
      const { type, terme } = (request.query || {}) as { type?: string; terme?: string };
      if (!type || typeof type !== "string" || !["departement", "arrondissement"].includes(type)) {
        return reply.code(400).send({ error: "Type de localité invalide" });
      }
      const termeRecherche = typeof terme === "string" ? terme : "";
      const { rows } = await fastify.pg.query(
        "SELECT valeur FROM localites WHERE type = $1 AND valeur ILIKE $2 ORDER BY valeur LIMIT 10",
        [type, `%${termeRecherche}%`]
      );
      reply.send(rows.map((r: { valeur: string }) => r.valeur));
    }
  );
}
