import { Pool } from 'pg';

export class UtilisateurModel {
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

    async createUtilisateur(nom: string, prenom: string, email: string, mot_de_passe: string, niveau_hierarchique: number, localite: object) {
        const query = `
            INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, niveau_hierarchique, localite)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `;
        const result = await this.pool.query(query, [nom, prenom, email, mot_de_passe, niveau_hierarchique, localite]);
        return result.rows[0];
    }

    async getUtilisateurById(id: number) {
        const query = `
            SELECT * FROM utilisateurs WHERE id = $1;
        `;
        const result = await this.pool.query(query, [id]);
        return result.rows[0];
    }

    async updateUtilisateur(id: number, nom: string, prenom: string, email: string, mot_de_passe: string, niveau_hierarchique: number, localite: object) {
        const query = `
            UPDATE utilisateurs
            SET nom = $1, prenom = $2, email = $3, mot_de_passe = $4, niveau_hierarchique = $5, localite = $6
            WHERE id = $7
            RETURNING *;
        `;
        const result = await this.pool.query(query, [nom, prenom, email, mot_de_passe, niveau_hierarchique, localite, id]);
        return result.rows[0];
    }

    async deleteUtilisateur(id: number) {
        const query = `
            DELETE FROM utilisateurs WHERE id = $1 RETURNING *;
        `;
        const result = await this.pool.query(query, [id]);
        return result.rows[0];
    }

    async getAllUtilisateurs() {
        const query = `
            SELECT * FROM utilisateurs;
        `;
        const result = await this.pool.query(query);
        return result.rows;
    }
}