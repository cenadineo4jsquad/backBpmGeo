import { FastifyRequest, FastifyReply } from "fastify";
import { AuditLog } from "../models/auditLogs.model";
import { AuditService } from "../services/audit.service";

export class AuditController {
  private auditService: AuditService;

  constructor() {
    this.auditService = new AuditService();
  }

  public async getAuditLogs(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { projetId, utilisateurId, dateDebut, dateFin } =
        request.query as any;
      const logs = await this.auditService.getAuditLogs(
        projetId,
        utilisateurId,
        dateDebut,
        dateFin
      );
      reply.status(200).send(logs);
    } catch (error) {
      reply
        .status(500)
        .send({ error: "Erreur lors de la récupération des logs d’audit" });
    }
  }

  public async exportAuditLogs(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { projetId, utilisateurId, dateDebut, dateFin } =
        request.body as any;
      const pdfBuffer = await this.auditService.exportAuditLogs(
        projetId,
        utilisateurId,
        dateDebut,
        dateFin
      );
      reply.header("Content-Type", "application/pdf");
      reply.header(
        "Content-Disposition",
        "attachment; filename=audit_logs.pdf"
      );
      reply.send(pdfBuffer);
    } catch (error) {
      reply
        .status(500)
        .send({ error: "Erreur lors de l’exportation des logs d’audit" });
    }
  }
}
