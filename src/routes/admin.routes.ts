import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "../middlewares/authenticate";
import { restrictToAdmin } from "../middlewares/restrictToAdmin";

const prisma = new PrismaClient();

async function getAdminStats(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Vérification admin
    const user = (request as any).user;
    if (!user || user.niveau_hierarchique !== 4) {
      return reply.status(403).send({ error: "Réservé aux administrateurs" });
    }
    // Comptages
    const [
      utilisateurs,
      projets,
      extractions,
      titres_fonciers,
      workflows,
      logs,
    ] = await Promise.all([
      prisma.utilisateurs.count(),
      prisma.projets.count(),
      prisma.extractions.count(),
      prisma.titres_fonciers.count(),
      prisma.workflows.count(),
      prisma.audit_logs.count(),
    ]);
    // Dernier login
    const dernier = await prisma.utilisateurs.findFirst({
      orderBy: { dernier_login_at: "desc" },
      select: { dernier_login_at: true },
    });
    reply.send({
      utilisateurs,
      projets,
      extractions,
      titres_fonciers,
      workflows,
      logs,
      dernier_login: dernier?.dernier_login || null,
    });
  } catch (error) {
    reply.status(500).send({ error: "Erreur serveur" });
  }
}

export default async function adminRoutes(fastify: FastifyInstance) {
  fastify.get("/api/admin/stats", {
    preHandler: [authenticate, restrictToAdmin],
    handler: getAdminStats,
  });
}
