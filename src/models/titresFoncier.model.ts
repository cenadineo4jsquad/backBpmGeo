import { Pool } from "pg";

export interface TitresFoncier {
  id: number;
  projet_id: number;
  proprietaire: string;
  coordonnees_gps: any; // Adjust type as necessary
  superficie: number;
  perimetre: number;
  localite: any; // Adjust type as necessary
}

export class TitresFoncierModel {
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

  async create(titre: TitresFoncier): Promise<TitresFoncier> {
    const query = `
            INSERT INTO titres_fonciers (projet_id, proprietaire, coordonnees_gps, superficie, perimetre, localite)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `;
    const result = await this.pool.query(query, [
      titre.projet_id,
      titre.proprietaire,
      titre.coordonnees_gps,
      titre.superficie,
      titre.perimetre,
      titre.localite,
    ]);
    return result.rows[0];
  }

  async findById(id: number): Promise<TitresFoncier | null> {
    const query = "SELECT * FROM titres_fonciers WHERE id = $1;";
    const result = await this.pool.query(query, [id]);
    return result.rows.length ? result.rows[0] : null;
  }

  async update(
    id: number,
    titre: Partial<TitresFoncier>
  ): Promise<TitresFoncier | null> {
    const fields = Object.keys(titre)
      .map((key, index) => `${key} = $${index + 1}`)
      .join(", ");
    const values = Object.values(titre);
    const query = `UPDATE titres_fonciers SET ${fields} WHERE id = $${
      values.length + 1
    } RETURNING *;`;
    const result = await this.pool.query(query, [...values, id]);
    return result.rows.length ? result.rows[0] : null;
  }

  async delete(id: number): Promise<boolean> {
    const query = "DELETE FROM titres_fonciers WHERE id = $1;";
    const result = await this.pool.query(query, [id]);
    return result.rowCount > 0;
  }

  async findAll(): Promise<TitresFoncier[]> {
    const query = "SELECT * FROM titres_fonciers;";
    const result = await this.pool.query(query);
    return result.rows;
  }
}
