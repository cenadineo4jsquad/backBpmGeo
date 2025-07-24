import { Pool } from "pg";

export interface AuditLog {
  id: number;
  utilisateur_id: number;
  action: string;
  projet_id: number;
  details: object;
  date_action: Date;
}

export class AuditLogsModel {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      user: "Cenadi-Squad",
      host: "localhost",
      database: process.env.DB_NAME || "geobpm",
      password: "password",
      port: 5432,
    });
  }

  async createAuditLog(auditLog: AuditLog): Promise<AuditLog> {
    const query = `
            INSERT INTO audit_logs (utilisateur_id, action, projet_id, details)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
    const result = await this.pool.query(query, [
      auditLog.utilisateur_id,
      auditLog.action,
      auditLog.projet_id,
      auditLog.details,
    ]);
    return result.rows[0];
  }

  async getAuditLogs(filter: {
    projet_id?: number;
    utilisateur_id?: number;
    date_range?: [Date, Date];
  }): Promise<AuditLog[]> {
    const conditions: string[] = [];
    const values: any[] = [];
    let index = 1;

    if (filter.projet_id) {
      conditions.push(`projet_id = $${index++}`);
      values.push(filter.projet_id);
    }

    if (filter.utilisateur_id) {
      conditions.push(`utilisateur_id = $${index++}`);
      values.push(filter.utilisateur_id);
    }

    if (filter.date_range) {
      conditions.push(`date_action BETWEEN $${index++} AND $${index++}`);
      values.push(filter.date_range[0], filter.date_range[1]);
    }

    const query = `
            SELECT * FROM audit_logs
            ${conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : ""}
            ORDER BY date_action DESC;
        `;
    const result = await this.pool.query(query, values);
    return result.rows;
  }
}
