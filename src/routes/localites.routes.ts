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
      const { type, terme } = request.query as any;
      if (!["departement", "arrondissement"].includes(type)) {
        reply.code(400).send({ error: "Type de localité invalide" });
        return;
      }
      const { rows } = await fastify.pg.query(
        "SELECT valeur FROM localites WHERE type = $1 AND valeur ILIKE $2 ORDER BY valeur LIMIT 10",
        [type, `%${terme}%`]
      );
      reply.send(rows.map((r: { valeur: string }) => r.valeur));
    }
  );
}
