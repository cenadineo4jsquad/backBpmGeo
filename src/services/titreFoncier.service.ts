import { Pool } from "pg";
import { TitresFoncier } from "../models/titresFoncier.model";
import { AuditLog } from "../models/auditLogs.model";

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "geospatial_db",
  password: "password",
  port: 5432,
});

export class TitreFoncierService {
  async getTitresFoncier(localite: string, niveau_hierarchique: number) {
    const query = `
      SELECT * FROM titres_fonciers
      WHERE 
        (niveau_hierarchique = 1 AND localite->>'valeur' = $1) OR
        (niveau_hierarchique = 2 AND localite->>'valeur' = $1) OR
        (niveau_hierarchique >= 3)
    `;
    const result = await pool.query(query, [localite]);
    return result.rows;
  }

  async getTitreFoncierById(id: number) {
    const query = "SELECT * FROM titres_fonciers WHERE id = $1";
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  async updateTitreFoncier(
    id: number,
    data: TitresFoncier,
    utilisateurId: number
  ) {
    const query = `
      UPDATE titres_fonciers
      SET proprietaire = $1, coordonnees_gps = $2, surface_m2 = $3, perimetre_m = $4
      WHERE id = $5 RETURNING *;
    `;
    const result = await pool.query(query, [
      data.proprietaire,
      data.coordonnees_gps,
      data.surface_m2,
      data.perimetre_m,
      id,
    ]);

    const { id: _id, ...auditDetails } = data;
    await this.logAudit(
      utilisateurId,
      "update_titre_foncier",
      result.rows[0].projet_id,
      { id, ...auditDetails }
    );
    return result.rows[0];
  }

  private async logAudit(
    utilisateurId: number,
    action: string,
    projetId: number,
    details: object
  ) {
    const query = `
      INSERT INTO audit_logs (utilisateur_id, action, projet_id, details)
      VALUES ($1, $2, $3, $4);
    `;
    await pool.query(query, [
      utilisateurId,
      action,
      projetId,
      JSON.stringify(details),
    ]);
  }
}
