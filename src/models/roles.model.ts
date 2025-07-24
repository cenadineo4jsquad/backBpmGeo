import { Pool } from "pg";

export class RoleModel {
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

  async getAllRoles() {
    const result = await this.pool.query("SELECT * FROM roles;");
    return result.rows;
  }

  async createRole(
    projetId: number,
    nom: string,
    niveauHierarchique: number,
    description: string
  ) {
    const query = `
            INSERT INTO roles (projet_id, nom, niveau_hierarchique, description)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
    const result = await this.pool.query(query, [
      projetId,
      nom,
      niveauHierarchique,
      description,
    ]);
    return result.rows[0];
  }

  async updateRole(
    id: number,
    nom: string,
    niveauHierarchique: number,
    description: string
  ) {
    const query = `
            UPDATE roles
            SET nom = $1, niveau_hierarchique = $2, description = $3
            WHERE id = $4
            RETURNING *;
        `;
    const result = await this.pool.query(query, [
      nom,
      niveauHierarchique,
      description,
      id,
    ]);
    return result.rows[0];
  }

  async deleteRole(id: number) {
    const query = `
            DELETE FROM roles
            WHERE id = $1
            RETURNING *;
        `;
    const result = await this.pool.query(query, [id]);
    return result.rows[0];
  }

  async getRolesByProject(projetId: number) {
    const query = `
            SELECT * FROM roles
            WHERE projet_id = $1;
        `;
    const result = await this.pool.query(query, [projetId]);
    return result.rows;
  }
}
