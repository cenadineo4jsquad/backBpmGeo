import { FastifyInstance } from "fastify";
import { getAuditLogsHandler } from "../controllers/audit.controller";
import { authenticate } from "../middlewares/authenticate";
import { exportAuditLogsHandler } from "../controllers/audit.controller";

export default async function auditRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/api/audit",
    { preHandler: [authenticate] },
    getAuditLogsHandler
  );
  fastify.post(
    "/api/audit/export",
    { preHandler: [authenticate] },
    exportAuditLogsHandler
  );
}
