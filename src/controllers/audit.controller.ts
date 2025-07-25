import { FastifyRequest, FastifyReply } from "fastify";
import { getAuditLogs } from "../services/audit.service";
import { exportAuditLogsPDF } from "../services/audit.service";

export const getAuditLogsHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const user = request.user as any;
    if (!user || user.niveau_hierarchique < 3) {
      return reply.status(403).send({ error: "Accès interdit" });
    }
    const { projet_id, utilisateur_id, date_debut, date_fin } =
      request.query as any;
    const localite =
      user.niveau_hierarchique === 3 ? user.localite?.valeur : undefined;
    const logs = await getAuditLogs({
      projet_id,
      utilisateur_id,
      date_debut,
      date_fin,
      niveau_hierarchique: user.niveau_hierarchique,
      localite,
    });
    reply.send(logs);
  } catch (error) {
    reply.status(401).send({ error: "Non autorisé" });
  }
};

export const exportAuditLogsHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const user = request.user as any;
    if (!user || user.niveau_hierarchique < 3) {
      return reply.status(403).send({ error: "Accès interdit" });
    }
    const { projet_id, utilisateur_id, date_debut, date_fin } = request.body as any;
    const localite = user.niveau_hierarchique === 3 ? user.localite?.valeur : undefined;
    const filePath = await exportAuditLogsPDF({
      projet_id,
      utilisateur_id,
      date_debut,
      date_fin,
      niveau_hierarchique: user.niveau_hierarchique,
      localite,
    });
    reply.send({ success: true, file_path: filePath });
  } catch (error) {
    reply.status(401).send({ error: "Non autorisé" });
  }
};
