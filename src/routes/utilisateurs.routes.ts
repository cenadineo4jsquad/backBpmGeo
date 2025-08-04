// src/routes/utilisateurs.routes.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  createUserHandler,
  updateUserHandler,
  deleteUserHandler,
  getUserByIdHandler,
  getAllUsersHandler,
  loginHandler,
} from "../controllers/utilisateurs.controller";
import { authenticate } from "../middlewares/authenticate";
import jwt from "jsonwebtoken";
import { getUserByEmail, getUserById } from "../services/utilisateurs.service";
import { compare } from "bcrypt";
import { restrictToAdmin } from "../middlewares/restrictToAdmin";

/* ------------------------------------------------------------------ */
/*                          Blacklist store                            */
/* ------------------------------------------------------------------ */
declare module "fastify" {
  interface FastifyInstance {
    jwtBlacklist: Set<string>;
  }
}

export default async function utilisateursRoutes(fastify: FastifyInstance) {
  // Initialise le store (remplacer par Redis en production)
  fastify.decorate("jwtBlacklist", new Set<string>());
  // Store refresh tokens (à remplacer par Redis ou DB en prod)
  const refreshStore = new Map<string, string>();
  const JWT_SECRET = process.env.JWT_SECRET || "secret";
  const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refresh_secret";
  const REFRESH_EXPIRES_IN = "7d";
  const ACCESS_EXPIRES_IN = "1h";

  /* ---------------------------- Routes ------------------------------ */

  // Profil authentifié
  fastify.get(
    "/api/me",
    { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const user = req.user as
        | {
            id: string;
            nom: string;
            prenom: string;
            email: string;
            niveau_hierarchique: string;
            localite: string;
            etape_courante?: {
              ordre: number;
              projet_id: number;
              etape_nom: string;
              nom_etape: string;
            } | null;
          }
        | undefined; // injecté par authenticate
      if (!user) return reply.code(401).send({ error: "Non autorisé" });

      return {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        niveau_hierarchique: user.niveau_hierarchique,
        localite: user.localite,
        etape_courante: user.etape_courante || null,
      };
    }
  );

  // Authentification (login enrichi via contrôleur)
  fastify.post("/api/login", loginHandler);

  // Refresh token
  fastify.post(
    "/api/refresh",
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { refresh_token } = req.body as { refresh_token: string };
      if (!refresh_token)
        return reply.code(400).send({ error: "Refresh token requis" });
      try {
        const payload = jwt.verify(refresh_token, REFRESH_SECRET) as any;
        if (
          !refreshStore.has(String(payload.sub)) ||
          refreshStore.get(String(payload.sub)) !== refresh_token
        ) {
          return reply.code(401).send({ error: "Refresh token invalide" });
        }
        const utilisateur = await getUserById(String(payload.sub));
        if (!utilisateur)
          return reply.code(401).send({ error: "Utilisateur non trouvé" });
        const access_token = jwt.sign(
          { sub: utilisateur.id, email: utilisateur.email },
          JWT_SECRET,
          { expiresIn: ACCESS_EXPIRES_IN }
        );
        reply.send({ token: access_token, refresh_token });
      } catch (e) {
        return reply
          .code(401)
          .send({ error: "Refresh token invalide ou expiré" });
      }
    }
  );

  // CRUD utilisateurs (admin uniquement)
  fastify.post(
    "/api/utilisateurs",
    { preHandler: [authenticate, restrictToAdmin] },
    createUserHandler
  );
  fastify.put(
    "/api/utilisateurs/:id",
    { preHandler: [authenticate, restrictToAdmin] },
    updateUserHandler
  );
  fastify.delete(
    "/api/utilisateurs/:id",
    { preHandler: [authenticate, restrictToAdmin] },
    deleteUserHandler
  );
  fastify.get(
    "/api/utilisateurs/:id",
    { preHandler: [authenticate] },
    getUserByIdHandler
  );
  fastify.get(
    "/api/utilisateurs",
    { preHandler: [authenticate, restrictToAdmin] },
    getAllUsersHandler
  );

  // Logout
  // Logout (supprime le refresh_token)
  fastify.delete(
    "/api/logout",
    { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const user = req.user as any;
      if (user && refreshStore.has(String(user.id))) {
        refreshStore.delete(String(user.id));
      }
      const token = req.headers.authorization?.split(" ")[1];
      if (token) fastify.jwtBlacklist.add(token);
      reply.code(204).send();
    }
  );
}
