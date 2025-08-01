// ...imports et pool...
import { Pool } from "pg";
import { TitresFoncier } from "../models/titresFoncier.model";
import { AuditLog } from "../models/auditLogs.model";
import { GeographicAccessService } from "./geographicAccess.service";

import pool from "../config/pool";

export class TitreFoncierService {
  private geographicAccess: GeographicAccessService;

  constructor() {
    this.geographicAccess = new GeographicAccessService(pool);
  }
  async findAllTitresFoncier() {
    const result = await pool.query("SELECT * FROM titres_fonciers");
    return result.rows;
  }
  async createTitreFoncier(data: any, utilisateurId: number) {
    const query = `
      INSERT INTO titres_fonciers (projet_id, proprietaire, coordonnees_gps, superficie, perimetre, localite)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    console.log("[DEBUG][createTitreFoncier] Données reçues:", data);
    try {
      const result = await pool.query(query, [
        data.projet_id ?? null,
        data.proprietaire,
        JSON.stringify(data.coordonnees_gps),
        data.superficie,
        data.perimetre,
        data.localite ?? null,
      ]);
      console.log("[DEBUG][createTitreFoncier] Résultat SQL:", result.rows[0]);
      await this.logAudit(
        utilisateurId,
        "create_titre_foncier",
        result.rows[0]?.projet_id,
        result.rows[0]
      );
      const row = result.rows[0];
      // Conversion explicite pour éviter les strings SQL sur les champs numériques
      if (row) {
        if (row.superficie !== undefined)
          row.superficie = Number(row.superficie);
        if (row.perimetre !== undefined) row.perimetre = Number(row.perimetre);
      }
      return row;
    } catch (error) {
      console.error("[ERREUR][createTitreFoncier]", error);
      throw error;
    }
  }

  async findTitreFoncierById(id: number) {
    const result = await pool.query(
      "SELECT * FROM titres_fonciers WHERE id = $1",
      [id]
    );
    return result.rows[0] || null;
  }

  async deleteTitreFoncier(id: number) {
    await pool.query("DELETE FROM titres_fonciers WHERE id = $1", [id]);
  }

  async getTitresGeojson(localite?: any, niveau_hierarchique?: number) {
    let query = "SELECT * FROM titres_fonciers";
    let params: any[] = [];

    if (localite && niveau_hierarchique) {
      const { whereClause, params: whereParams } =
        this.geographicAccess.buildHierarchicalWhereClause(
          niveau_hierarchique,
          localite
        );

      if (whereClause) {
        query += ` ${whereClause}`;
        params = whereParams;
      }
    } else if (localite) {
      // Ancienne logique pour compatibilité
      query += " WHERE localite = $1";
      params.push(localite);
    }

    const { rows } = await pool.query(query, params);

    const features = rows.map((row: any) => ({
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: row.coordonnees_gps,
      },
      properties: {
        id: row.id,
        nom: row.nom || row.projet_id || "",
        proprietaire: row.proprietaire,
        localite: row.localite,
      },
    }));

    return {
      type: "FeatureCollection",
      features,
    };
  }
  async getTitresFoncier(localite: any, niveau_hierarchique: number) {
    const { whereClause, params } =
      this.geographicAccess.buildHierarchicalWhereClause(
        niveau_hierarchique,
        localite
      );

    const query = `SELECT * FROM titres_fonciers ${whereClause}`;
    const result = await pool.query(query, params);
    return result.rows;
  }

  async getTitreFoncierById(id: number) {
    const query = "SELECT * FROM titres_fonciers WHERE id = $1";
    const result = await pool.query(query, [id]);
    const row = result.rows[0];
    if (row) {
      if (row.superficie !== undefined) row.superficie = Number(row.superficie);
      if (row.perimetre !== undefined) row.perimetre = Number(row.perimetre);
    }
    return row;
  }

  async updateTitreFoncier(
    id: number,
    data: TitresFoncier,
    utilisateurId: number
  ) {
    const query = `
      UPDATE titres_fonciers
      SET proprietaire = $1, coordonnees_gps = $2, superficie = $3, perimetre = $4
      WHERE id = $5 RETURNING *;
    `;
    const result = await pool.query(query, [
      data.proprietaire,
      JSON.stringify(data.coordonnees_gps),
      data.superficie,
      data.perimetre,
      id,
    ]);

    const { id: _id, ...auditDetails } = data;
    await this.logAudit(
      utilisateurId,
      "update_titre_foncier",
      result.rows[0].projet_id,
      { id, ...auditDetails }
    );
    const row = result.rows[0];
    if (row) {
      if (row.superficie !== undefined) row.superficie = Number(row.superficie);
      if (row.perimetre !== undefined) row.perimetre = Number(row.perimetre);
    }
    return row;
  }

  /**
   * Obtient les statistiques d'accès pour un utilisateur donné
   */
  async getAccessStatistics(niveau_hierarchique: number, localite: any) {
    return await this.geographicAccess.getAccessStats(
      niveau_hierarchique,
      localite
    );
  }

  /**
   * Vérifie si un utilisateur a accès à une localité donnée
   */
  async hasAccessToLocalite(
    userNiveau: number,
    userLocalite: any,
    targetLocalite: string
  ): Promise<boolean> {
    return await this.geographicAccess.hasAccessToLocalite(
      userNiveau,
      userLocalite,
      targetLocalite
    );
  }

  /**
   * Récupère toutes les localités accessibles par un utilisateur
   */
  async getAccessibleLocalites(
    niveau_hierarchique: number,
    localite: any
  ): Promise<string[]> {
    return await this.geographicAccess.getAccessibleLocalites(
      niveau_hierarchique,
      localite
    );
  }

  private async logAudit(
    utilisateurId: number,
    action: string,
    projetId: number,
    details: object
  ) {
    const query = `
      INSERT INTO audit_logs (utilisateur_id, action, projet_id, details)
      VALUES ($1, $2, $3, $4);
    `;
    await pool.query(query, [
      utilisateurId,
      action,
      projetId,
      JSON.stringify(details),
    ]);
  }
}
