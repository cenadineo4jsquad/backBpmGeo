import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import { authenticate } from "../middlewares/authenticate";

const JWT_SECRET = process.env.JWT_SECRET || "secret";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "refresh_secret";
const REFRESH_EXPIRES_IN = "7d"; // 7 jours

// Store refresh tokens (à remplacer par Redis ou DB en prod)
const refreshStore = new Map<string, string>();

export default async function refreshRoutes(fastify: FastifyInstance) {
  // Route pour générer un nouveau access_token à partir d'un refresh_token
  fastify.post(
    "/api/refresh",
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { refresh_token } = req.body as { refresh_token: string };
      if (!refresh_token)
        return reply.code(400).send({ error: "Refresh token requis" });
      // Vérifier le refresh token
      try {
        const payload = jwt.verify(refresh_token, REFRESH_SECRET) as any;
        // Vérifier qu'il est bien stocké côté serveur
        if (
          !refreshStore.has(payload.sub) ||
          refreshStore.get(payload.sub) !== refresh_token
        ) {
          return reply.code(401).send({ error: "Refresh token invalide" });
        }
        // Générer un nouveau access_token
        const access_token = jwt.sign(
          { sub: payload.sub, email: payload.email },
          JWT_SECRET,
          { expiresIn: "15m" }
        );
        reply.send({ access_token });
      } catch (e) {
        return reply
          .code(401)
          .send({ error: "Refresh token invalide ou expiré" });
      }
    }
  );

  // Route pour login (exemple, à adapter)
  fastify.post(
    "/api/login",
    async (req: FastifyRequest, reply: FastifyReply) => {
      // ...votre logique d'authentification...
      // Si succès :
      const userId = "user_id"; // à remplacer
      const email = "user@email.com"; // à remplacer
      const access_token = jwt.sign({ sub: userId, email }, JWT_SECRET, {
        expiresIn: "15m",
      });
      const refresh_token = jwt.sign({ sub: userId, email }, REFRESH_SECRET, {
        expiresIn: REFRESH_EXPIRES_IN,
      });
      refreshStore.set(userId, refresh_token);
      reply.send({ access_token, refresh_token });
    }
  );

  // Route pour logout (supprime le refresh_token)
  fastify.delete(
    "/api/logout",
    { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const user = req.user as any;
      if (user && refreshStore.has(user.sub)) {
        refreshStore.delete(user.sub);
      }
      reply.code(204).send();
    }
  );
}
