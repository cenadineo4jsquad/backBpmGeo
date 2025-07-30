import { Pool } from "pg";

export class UtilisateurRolesModel {
  private pool: Pool;

  constructor() {
    this.pool = require("../config/pool").default;
  }

  async assignUserToRole(utilisateurId: number, roleId: number) {
    const query = `
      INSERT INTO utilisateur_roles (utilisateur_id, role_id)
      VALUES ($1, $2)
      RETURNING *;
    `;
    try {
      const result = await this.pool.query(query, [utilisateurId, roleId]);
      return result.rows[0];
    } catch (err: any) {
      if (err.code === "23505") {
        // unique_violation
        throw new Error("ALREADY_ASSIGNED");
      }
      throw err;
    }
  }

  async userRoleExists(utilisateurId: number, roleId: number) {
    const query = `SELECT * FROM utilisateur_roles WHERE utilisateur_id = $1 AND role_id = $2;`;
    const result = await this.pool.query(query, [utilisateurId, roleId]);
    return result.rows.length > 0;
  }
}
