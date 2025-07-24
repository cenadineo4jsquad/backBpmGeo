import { Pool } from "pg";

export class LocaliteModel {
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

  async createLocalite(type: string, valeur: string) {
    const query = `
            INSERT INTO localites (type, valeur)
            VALUES ($1, $2)
            RETURNING *;
        `;
    const result = await this.pool.query(query, [type, valeur]);
    return result.rows[0];
  }

  async getLocalites(type?: string) {
    const query = `
            SELECT * FROM localites
            ${type ? "WHERE type = $1" : ""}
            ORDER BY valeur;
        `;
    const params = type ? [type] : [];
    const result = await this.pool.query(query, params);
    return result.rows;
  }

  async getLocaliteById(id: number) {
    const query = `
            SELECT * FROM localites
            WHERE id = $1;
        `;
    const result = await this.pool.query(query, [id]);
    return result.rows[0];
  }

  async updateLocalite(id: number, type: string, valeur: string) {
    const query = `
            UPDATE localites
            SET type = $1, valeur = $2
            WHERE id = $3
            RETURNING *;
        `;
    const result = await this.pool.query(query, [type, valeur, id]);
    return result.rows[0];
  }

  async deleteLocalite(id: number) {
    const query = `
            DELETE FROM localites
            WHERE id = $1
            RETURNING *;
        `;
    const result = await this.pool.query(query, [id]);
    return result.rows[0];
  }
}
