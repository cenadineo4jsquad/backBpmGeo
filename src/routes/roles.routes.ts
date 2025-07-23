import { FastifyInstance } from "fastify";
import {
  createRole,
  updateRole,
  deleteRole,
  getRoles,
} from "../controllers/roles.controller";
import { authenticate } from "../middlewares/authenticate";
import { restrictToAdmin } from "../middlewares/restrictToAdmin";

export default async function rolesRoutes(fastify: FastifyInstance) {
  fastify.route({
    method: "POST",
    url: "/api/roles",
    preHandler: [authenticate, restrictToAdmin],
    handler: createRole,
  });

  fastify.route({
    method: "PUT",
    url: "/api/roles/:id",
    preHandler: [authenticate, restrictToAdmin],
    handler: updateRole,
  });

  fastify.route({
    method: "DELETE",
    url: "/api/roles/:id",
    preHandler: [authenticate, restrictToAdmin],
    handler: deleteRole,
  });

  fastify.route({
    method: "GET",
    url: "/api/roles",
    preHandler: [authenticate],
    handler: getRoles,
  });
}
