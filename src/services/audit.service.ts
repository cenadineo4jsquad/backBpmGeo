import { Pool } from "pg";
import { AuditLog } from "../models/auditLogs.model";

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "geospatial_db",
  password: "password",
  port: 5432,
});

export class AuditService {
  async logAction(
    userId: number,
    action: string,
    projectId: number | null,
    details: object
  ): Promise<AuditLog> {
    const query = `
      INSERT INTO audit_logs (utilisateur_id, action, projet_id, details)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const values = [userId, action, projectId, details];
    try {
      const result = await pool.query(query, values);
      return result.rows[0] as AuditLog;
    } catch (error) {
      console.error("Error logging action:", error);
      throw new Error("Could not log action");
    }
  }

  async getAuditLogs(
    projetId?: number,
    utilisateurId?: number,
    dateDebut?: string,
    dateFin?: string
  ): Promise<AuditLog[]> {
    const query = `
      SELECT * FROM audit_logs
      WHERE ($1::int IS NULL OR projet_id = $1)
        AND ($2::int IS NULL OR utilisateur_id = $2)
        AND ($3::timestamp IS NULL OR date_action >= $3)
        AND ($4::timestamp IS NULL OR date_action <= $4)
      ORDER BY date_action DESC;
    `;
    const values = [
      projetId || null,
      utilisateurId || null,
      dateDebut || null,
      dateFin || null,
    ];
    try {
      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      throw new Error("Could not fetch audit logs");
    }
  }

  async exportAuditLogs(
    projetId?: number,
    utilisateurId?: number,
    dateDebut?: string,
    dateFin?: string
  ): Promise<Buffer> {
    // Stub: à remplacer par la génération réelle du PDF
    // Pour l’instant, retourne un buffer vide
    return Buffer.from("");
  }
}
