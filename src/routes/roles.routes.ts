import { FastifyInstance } from "fastify";
import {
  createRole,
  updateRole,
  deleteRole,
  getRoles,
} from "../controllers/roles.controller";
import { assignPermission } from "../controllers/permissions.controller";
import { assignUserToRole } from "../controllers/utilisateur_roles.controller";
import { authenticate } from "../middlewares/authenticate";
import { restrictToAdmin } from "../middlewares/restrictToAdmin";

export default async function rolesRoutes(fastify: FastifyInstance) {
  fastify.route({
    method: "POST",
    url: "/api/roles/:id/permissions",
    preHandler: [authenticate, restrictToAdmin],
    handler: assignPermission,
  });

  fastify.route({
    method: "POST",
    url: "/api/roles/:id/utilisateurs",
    preHandler: [authenticate, restrictToAdmin],
    handler: assignUserToRole,
  });

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
    preHandler: [authenticate, restrictToAdmin],
    handler: getRoles,
  });

  // Route GET /api/permissions : liste statique des permissions (admin uniquement)
  fastify.route({
    method: "GET",
    url: "/api/permissions",
    preHandler: [authenticate, restrictToAdmin],
    handler: async (request, reply) => {
      // Liste statique des permissions du système
      const permissions = [
        "extract_data",
        "validate",
        "reject",
        "manage_users",
        "manage_projects",
        "manage_roles",
        "view_audit_logs",
      ];
      return permissions;
    },
  });
}
