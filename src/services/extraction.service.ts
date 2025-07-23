import { Pool } from "pg";
import { Extraction } from "../models/extraction.model";
import { TitresFoncier } from "../models/titresFoncier.model";
import { Workflow } from "../models/workflows.model";
import { Task } from "../models/taches.model";

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "geospatial_db",
  password: "password",
  port: 5432,
});

export class ExtractionService {
  async uploadExtraction(
    data: any,
    userId: number,
    projetId: number
  ): Promise<Extraction> {
    const { fichier, donnees_extraites, seuil_confiance, titre_foncier_id } =
      data;

    const extractionQuery = `
      INSERT INTO extractions (projet_id, utilisateur_id, fichier, donnees_extraites, seuil_confiance, titre_foncier_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const result = await pool.query(extractionQuery, [
      projetId,
      userId,
      fichier,
      donnees_extraites,
      seuil_confiance,
      titre_foncier_id,
    ]);

    return result.rows[0];
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
