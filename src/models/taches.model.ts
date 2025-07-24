import { Pool } from "pg";

export interface Task {
  id: number;
  workflow_id: number;
  etape_id: number;
  utilisateur_id: number;
  statut: string;
  commentaire?: string;
  piece_jointe?: string;
  date_execution?: Date;
}

export class TaskModel {
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

  async createTask(task: Omit<Task, "id">): Promise<Task> {
    const query = `
            INSERT INTO taches (workflow_id, etape_id, utilisateur_id, statut, commentaire, piece_jointe)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `;
    const result = await this.pool.query(query, [
      task.workflow_id,
      task.etape_id,
      task.utilisateur_id,
      task.statut,
      task.commentaire,
      task.piece_jointe,
    ]);
    return result.rows[0];
  }

  async getTaskById(id: number): Promise<Task | null> {
    const query = `
            SELECT * FROM taches WHERE id = $1;
        `;
    const result = await this.pool.query(query, [id]);
    return result.rows.length ? result.rows[0] : null;
  }

  async updateTask(
    id: number,
    updates: Partial<Omit<Task, "id">>
  ): Promise<Task | null> {
    const fields = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(", ");
    const query = `
            UPDATE taches SET ${fields} WHERE id = $1 RETURNING *;
        `;
    const result = await this.pool.query(query, [
      id,
      ...Object.values(updates),
    ]);
    return result.rows.length ? result.rows[0] : null;
  }

  async deleteTask(id: number): Promise<void> {
    const query = `
            DELETE FROM taches WHERE id = $1;
        `;
    await this.pool.query(query, [id]);
  }

  async getTasksByWorkflowId(workflow_id: number): Promise<Task[]> {
    const query = `
            SELECT * FROM taches WHERE workflow_id = $1;
        `;
    const result = await this.pool.query(query, [workflow_id]);
    return result.rows;
  }
}
