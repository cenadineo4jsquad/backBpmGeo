import { Pool } from 'pg';

export interface Extraction {
    id: number;
    projet_id: number;
    utilisateur_id: number;
    fichier: string;
    donnees_extraites: object;
    seuil_confiance: number;
    statut: string;
    date_extraction: Date;
    titre_foncier_id: number;
}

export class ExtractionModel {
    private pool: Pool;

    constructor() {
        this.pool = new Pool({
            user: 'postgres',
            host: 'localhost',
            database: 'geospatial_db',
            password: 'password',
            port: 5432,
        });
    }

    async createExtraction(extraction: Extraction): Promise<Extraction> {
        const query = `
            INSERT INTO extractions (projet_id, utilisateur_id, fichier, donnees_extraites, seuil_confiance, titre_foncier_id)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `;
        const result = await this.pool.query(query, [
            extraction.projet_id,
            extraction.utilisateur_id,
            extraction.fichier,
            extraction.donnees_extraites,
            extraction.seuil_confiance,
            extraction.titre_foncier_id,
        ]);
        return result.rows[0];
    }

    async getExtractionById(id: number): Promise<Extraction | null> {
        const query = `
            SELECT * FROM extractions WHERE id = $1;
        `;
        const result = await this.pool.query(query, [id]);
        return result.rows.length ? result.rows[0] : null;
    }

    async updateExtraction(id: number, extraction: Partial<Extraction>): Promise<Extraction | null> {
        const fields = Object.keys(extraction).map((key, index) => `${key} = $${index + 1}`).join(', ');
        const values = Object.values(extraction);
        const query = `
            UPDATE extractions SET ${fields} WHERE id = $${values.length + 1} RETURNING *;
        `;
        const result = await this.pool.query(query, [...values, id]);
        return result.rows.length ? result.rows[0] : null;
    }

    async deleteExtraction(id: number): Promise<void> {
        const query = `
            DELETE FROM extractions WHERE id = $1;
        `;
        await this.pool.query(query, [id]);
    }
}