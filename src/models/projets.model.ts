import { Pool } from 'pg';

export class Projet {
    id: number;
    nom: string;
    description: string;
    date_creation: Date;

    constructor(id: number, nom: string, description: string, date_creation: Date) {
        this.id = id;
        this.nom = nom;
        this.description = description;
        this.date_creation = date_creation;
    }

    static async create(nom: string, description: string): Promise<Projet> {
        const pool = new Pool();
        const result = await pool.query(
            'INSERT INTO projets (nom, description) VALUES ($1, $2) RETURNING *',
            [nom, description]
        );
        const { id, date_creation } = result.rows[0];
        return new Projet(id, nom, description, date_creation);
    }

    static async update(id: number, nom: string, description: string): Promise<Projet> {
        const pool = new Pool();
        const result = await pool.query(
            'UPDATE projets SET nom = $1, description = $2 WHERE id = $3 RETURNING *',
            [nom, description, id]
        );
        const { date_creation } = result.rows[0];
        return new Projet(id, nom, description, date_creation);
    }

    static async delete(id: number): Promise<void> {
        const pool = new Pool();
        await pool.query('DELETE FROM projets WHERE id = $1', [id]);
    }

    static async findById(id: number): Promise<Projet | null> {
        const pool = new Pool();
        const result = await pool.query('SELECT * FROM projets WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return null;
        }
        const { nom, description, date_creation } = result.rows[0];
        return new Projet(id, nom, description, date_creation);
    }

    static async findAll(): Promise<Projet[]> {
        const pool = new Pool();
        const result = await pool.query('SELECT * FROM projets');
        return result.rows.map(row => new Projet(row.id, row.nom, row.description, row.date_creation));
    }
}