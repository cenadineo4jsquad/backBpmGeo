import { Pool } from 'pg';

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'geospatial_db',
  password: 'password',
  port: 5432,
});

export interface Workflow {
  id: number;
  projet_id: number;
  titre_foncier_id: number;
  statut: string;
  current_etape_ordre: number;
  date_creation: Date;
}

export const createWorkflow = async (projet_id: number, titre_foncier_id: number): Promise<Workflow> => {
  const query = `
    INSERT INTO workflows (projet_id, titre_foncier_id)
    VALUES ($1, $2)
    RETURNING *;
  `;
  const result = await pool.query(query, [projet_id, titre_foncier_id]);
  return result.rows[0];
};

export const getWorkflowById = async (id: number): Promise<Workflow | null> => {
  const query = `
    SELECT * FROM workflows
    WHERE id = $1;
  `;
  const result = await pool.query(query, [id]);
  return result.rows.length ? result.rows[0] : null;
};

export const updateWorkflowStatus = async (id: number, statut: string): Promise<Workflow | null> => {
  const query = `
    UPDATE workflows
    SET statut = $1
    WHERE id = $2
    RETURNING *;
  `;
  const result = await pool.query(query, [statut, id]);
  return result.rows.length ? result.rows[0] : null;
};

export const getAllWorkflows = async (): Promise<Workflow[]> => {
  const query = `
    SELECT * FROM workflows;
  `;
  const result = await pool.query(query);
  return result.rows;
};