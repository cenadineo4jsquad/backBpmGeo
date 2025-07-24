import { FastifyInstance } from "fastify";
import {
  createUserHandler,
  updateUserHandler,
  deleteUserHandler,
  getUserByIdHandler,
  getAllUsersHandler,
  loginHandler,
} from "../controllers/utilisateurs.controller";
import { authenticate } from "../middlewares/authenticate";
import { restrictToAdmin } from "../middlewares/restrictToAdmin";

export default async function utilisateursRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/api/me",
    { preHandler: [authenticate] },
    async (request: any, reply: any) => {
      try {
        // L'utilisateur est injecté dans request.user par le middleware authenticate
        const user = request.user;
        if (!user) {
          return reply.code(401).send({ error: "Non autorisé" });
        }
        // On retourne les infos principales (adapter selon votre modèle)
        return {
          id: user.id,
          nom: user.nom,
          prenom: user.prenom,
          email: user.email,
          niveau_hierarchique: user.niveau_hierarchique,
          localite: user.localite,
        };
      } catch (e) {
        return reply.code(401).send({ error: "Non autorisé" });
      }
    }
  );

  fastify.post("/api/login", loginHandler);
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
}
