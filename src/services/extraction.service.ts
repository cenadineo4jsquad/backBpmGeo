import axios from "axios";
import * as dotenv from "dotenv";
import { Pool } from "pg";
import { Extraction } from "../models/extraction.model";
dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: "localhost",
  database: "geobpm",
  password: "",
  port: 5432,
});

export class ExtractionService {
  async getExtractions(filters: {
    projet_id?: number;
    statut?: string;
    utilisateur_id?: number;
  }): Promise<any[]> {
    let query = "SELECT * FROM extractions WHERE 1=1";
    const params: any[] = [];
    if (filters.projet_id) {
      params.push(filters.projet_id);
      query += ` AND projet_id = $${params.length}`;
    }
    if (filters.statut) {
      params.push(filters.statut);
      query += ` AND statut = $${params.length}`;
    }
    if (filters.utilisateur_id) {
      params.push(filters.utilisateur_id);
      query += ` AND utilisateur_id = $${params.length}`;
    }
    query += " ORDER BY date_extraction DESC";
    const { rows } = await pool.query(query, params);
    return rows;
  }

  async getExtractionById(id: number): Promise<any | null> {
    const { rows } = await pool.query(
      "SELECT * FROM extractions WHERE id = $1",
      [id]
    );
    return rows[0] || null;
  }

  async deleteExtraction(id: number): Promise<void> {
    await pool.query("DELETE FROM extractions WHERE id = $1", [id]);
  }

  async validerExtraction(id: number): Promise<void> {
    await pool.query("UPDATE extractions SET statut = $1 WHERE id = $2", [
      "valide",
      id,
    ]);
  }

  async rejeterExtraction(id: number): Promise<void> {
    await pool.query("UPDATE extractions SET statut = $1 WHERE id = $2", [
      "rejete",
      id,
    ]);
  }
  async uploadExtractionToFlask(file: any, projet_id: any): Promise<any> {
    // Préparation du form-data pour Flask
    const FormData = require("form-data");
    const form = new FormData();
    form.append("file", file.file, {
      filename: file.filename,
      contentType: file.mimetype,
    });
    // L'API Flask attend uniquement le champ 'file' (comme dans le curl fourni)

    // Envoi à Flask
    const flaskUrl =
      process.env.FLASK_API_URL || "http://10.100.213.195:5000/api/process";
    try {
      const response = await axios.post(flaskUrl, form, {
        headers: {
          ...form.getHeaders(),
        },
        maxBodyLength: Infinity,
      });
      return response.data;
    } catch (err: any) {
      return { error: "Erreur lors de l'appel à Flask", details: err.message };
    }
  }

  async correctExtraction(id: number, updatedData: any): Promise<Extraction> {
    const { proprietaire, coordonnees_gps, surface_m2, perimetre_m } =
      updatedData;

    const updateQuery = `
      UPDATE extractions
      SET donnees_extraites = $1
      WHERE id = $2
      RETURNING *;
    `;
    const result = await pool.query(updateQuery, [updatedData, id]);

    return result.rows[0];
  }

  async submitToNextStage(workflowId: number, userId: number): Promise<void> {
    const taskQuery = `
      SELECT id, etape_id
      FROM taches
      WHERE workflow_id = $1 AND utilisateur_id = $2 AND statut = 'En attente'
      LIMIT 1;
    `;
    const taskResult = await pool.query(taskQuery, [workflowId, userId]);

    if (taskResult.rows.length === 0) {
      throw new Error("No pending tasks found for this user in the workflow.");
    }

    const taskId = taskResult.rows[0].id;
    const nextStageQuery = `
      INSERT INTO taches (workflow_id, etape_id, utilisateur_id)
      VALUES ($1, $2, $3);
    `;
    await pool.query(nextStageQuery, [
      workflowId,
      taskResult.rows[0].etape_id + 1,
      userId,
    ]);

    await pool.query("UPDATE taches SET statut = $1 WHERE id = $2", [
      "Terminé",
      taskId,
    ]);
  }
}
