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
  const REFRESH_SECRET = process.env.REFRESH_SECRET || "refresh_secret";
  const REFRESH_EXPIRES_IN = "7d";

  /* ---------------------------- Routes ------------------------------ */

  // Profil authentifié
  fastify.get(
    "/me",
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
      };
    }
  );

  // Authentification
  // Authentification avec refresh token
  fastify.post(
    "/api/login",
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { email, mot_de_passe } = req.body as any;
      const utilisateur = await getUserByEmail(email);
      if (
        !utilisateur ||
        !(await compare(mot_de_passe, utilisateur.mot_de_passe))
      ) {
        return reply.code(401).send({ error: "Identifiants invalides" });
      }
      const userId = utilisateur.id;
      const access_token = jwt.sign(
        { sub: userId, email: utilisateur.email },
        JWT_SECRET,
        { expiresIn: "15m" }
      );
      const refresh_token = jwt.sign(
        { sub: userId, email: utilisateur.email },
        REFRESH_SECRET,
        { expiresIn: REFRESH_EXPIRES_IN }
      );
      refreshStore.set(String(userId), refresh_token);

      // Ajout des cookies
      reply.setCookie("access_token", access_token, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 15,
      });
      reply.setCookie("refresh_token", refresh_token, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
      });
      reply.send({ user: utilisateur });
    }
  );

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
          { expiresIn: "15m" }
        );
        // Ajout du cookie
        reply.setCookie("access_token", access_token, {
          path: "/",
          httpOnly: true,
          sameSite: "lax",
          maxAge: 60 * 15,
        });
        reply.send({ user: utilisateur });
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
      reply
        .clearCookie("access_token", { path: "/" })
        .clearCookie("refresh_token", { path: "/" })
        .code(204)
        .send();
    }
  );
}
