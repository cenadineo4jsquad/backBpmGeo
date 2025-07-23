import { FastifyInstance } from "fastify";
import { AuditController } from "../controllers/audit.controller";
import { authenticate } from "../middlewares/authenticate";
import { restrictToAdmin } from "../middlewares/restrictToAdmin";

const auditController = new AuditController();
const auditRoutes = async (fastify: FastifyInstance) => {
  fastify.get("/api/audit", {
    preHandler: [authenticate],
    handler: auditController.getAuditLogs,
  });

  fastify.post("/api/audit/export", {
    preHandler: [authenticate, restrictToAdmin],
    handler: auditController.exportAuditLogs,
  });
};

export default auditRoutes;
