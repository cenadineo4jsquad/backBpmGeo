import { Pool } from "pg";

export class PermissionsModel {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      user: process.env.DB_USER || "postgres",
      host: "localhost",
      database: process.env.DB_NAME || "geobpm",
      password: "password",
      port: 5432,
    });
  }

  async assignPermission(roleId: number, action: string) {
    const query = `
      INSERT INTO permissions (role_id, action)
      VALUES ($1, $2)
      RETURNING *;
    `;
    try {
      const result = await this.pool.query(query, [roleId, action]);
      return result.rows[0];
    } catch (err: any) {
      if (err.code === "23505") {
        // unique_violation
        throw new Error("ALREADY_ASSIGNED");
      }
      throw err;
    }
  }

  async permissionExists(roleId: number, action: string) {
    const query = `SELECT * FROM permissions WHERE role_id = $1 AND action = $2;`;
    const result = await this.pool.query(query, [roleId, action]);
    return result.rows.length > 0;
  }
}
