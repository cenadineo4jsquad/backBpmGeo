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
    { preHandler: [authenticate] },
    getAllUsersHandler
  );
}
