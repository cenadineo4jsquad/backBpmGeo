// Utilitaires pour la gestion de l'accès hiérarchique géographique
import { Pool } from "pg";

export class GeographicAccessService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Construit une clause WHERE SQL pour filtrer les titres fonciers selon l'accès hiérarchique
   * @param niveau_hierarchique Niveau de l'utilisateur (1=arrondissement, 2=département, 3=région, 4=central)
   * @param localite Localité de l'utilisateur
   * @returns Objet avec la clause WHERE et les paramètres
   */
  buildHierarchicalWhereClause(
    niveau_hierarchique: number,
    localite: any
  ): { whereClause: string; params: any[] } {
    const localiteValue = localite?.valeur || localite;

    switch (niveau_hierarchique) {
      case 1: // Arrondissement - accès uniquement à son arrondissement
        return {
          whereClause: `WHERE (localite = $1 OR localite = $2 OR (localite::text LIKE '%"valeur":"' || $1 || '"%'))`,
          params: [
            localiteValue,
            JSON.stringify({ type: "arrondissement", valeur: localiteValue }),
          ],
        };

      case 2: // Département - accès à tous les arrondissements de son département
        return {
          whereClause: `WHERE localite IN (
            SELECT a.nom 
            FROM arrondissements a
            JOIN departements d ON a.departement_id = d.id
            WHERE d.nom = $1
          ) OR localite = $1 OR localite = $2 OR (localite::text LIKE '%"valeur":"' || $1 || '"%')`,
          params: [
            localiteValue,
            JSON.stringify({ type: "departement", valeur: localiteValue }),
          ],
        };

      case 3: // Région - accès à tous les départements et arrondissements de sa région
        return {
          whereClause: `WHERE localite IN (
            SELECT a.nom 
            FROM arrondissements a
            JOIN departements d ON a.departement_id = d.id
            JOIN regions r ON d.region_id = r.id
            WHERE r.nom = $1
            UNION
            SELECT d.nom 
            FROM departements d
            JOIN regions r ON d.region_id = r.id
            WHERE r.nom = $1
          ) OR localite = $1 OR localite = $2 OR (localite::text LIKE '%"valeur":"' || $1 || '"%')`,
          params: [
            localiteValue,
            JSON.stringify({ type: "region", valeur: localiteValue }),
          ],
        };

      case 4: // Central - accès à tout
      default:
        return {
          whereClause: "",
          params: [],
        };
    }
  }

  /**
   * Vérifie si un utilisateur a accès à une localité donnée
   * @param userNiveau Niveau hiérarchique de l'utilisateur
   * @param userLocalite Localité de l'utilisateur
   * @param targetLocalite Localité cible à vérifier
   * @returns true si l'utilisateur a accès
   */
  async hasAccessToLocalite(
    userNiveau: number,
    userLocalite: any,
    targetLocalite: string
  ): Promise<boolean> {
    const userLocaliteValue = userLocalite?.valeur || userLocalite;

    switch (userNiveau) {
      case 1: // Arrondissement
        return userLocaliteValue === targetLocalite;

      case 2: // Département
        // Vérifier si la localité cible est un arrondissement du département de l'utilisateur
        const departmentCheck = await this.pool.query(
          `
          SELECT 1 FROM arrondissements a
          JOIN departements d ON a.departement_id = d.id
          WHERE d.nom = $1 AND a.nom = $2
          UNION
          SELECT 1 WHERE $1 = $2
        `,
          [userLocaliteValue, targetLocalite]
        );
        return departmentCheck.rows.length > 0;

      case 3: // Région
        // Vérifier si la localité cible appartient à la région de l'utilisateur
        const regionCheck = await this.pool.query(
          `
          SELECT 1 FROM arrondissements a
          JOIN departements d ON a.departement_id = d.id
          JOIN regions r ON d.region_id = r.id
          WHERE r.nom = $1 AND a.nom = $2
          UNION
          SELECT 1 FROM departements d
          JOIN regions r ON d.region_id = r.id
          WHERE r.nom = $1 AND d.nom = $2
          UNION
          SELECT 1 WHERE $1 = $2
        `,
          [userLocaliteValue, targetLocalite]
        );
        return regionCheck.rows.length > 0;

      case 4: // Central
      default:
        return true;
    }
  }

  /**
   * Récupère toutes les localités accessibles par un utilisateur
   * @param niveau_hierarchique Niveau de l'utilisateur
   * @param localite Localité de l'utilisateur
   * @returns Liste des localités accessibles
   */
  async getAccessibleLocalites(
    niveau_hierarchique: number,
    localite: any
  ): Promise<string[]> {
    const localiteValue = localite?.valeur || localite;

    switch (niveau_hierarchique) {
      case 1: // Arrondissement
        return [localiteValue];

      case 2: // Département
        const deptResult = await this.pool.query(
          `
          SELECT a.nom FROM arrondissements a
          JOIN departements d ON a.departement_id = d.id
          WHERE d.nom = $1
          UNION
          SELECT $1 as nom
        `,
          [localiteValue]
        );
        return deptResult.rows.map((row) => row.nom);

      case 3: // Région
        const regionResult = await this.pool.query(
          `
          SELECT a.nom FROM arrondissements a
          JOIN departements d ON a.departement_id = d.id
          JOIN regions r ON d.region_id = r.id
          WHERE r.nom = $1
          UNION
          SELECT d.nom FROM departements d
          JOIN regions r ON d.region_id = r.id
          WHERE r.nom = $1
          UNION
          SELECT $1 as nom
        `,
          [localiteValue]
        );
        return regionResult.rows.map((row) => row.nom);

      case 4: // Central
      default:
        // Retourner toutes les localités
        const allResult = await this.pool.query(`
          SELECT nom FROM arrondissements
          UNION
          SELECT nom FROM departements
          UNION
          SELECT nom FROM regions
        `);
        return allResult.rows.map((row) => row.nom);
    }
  }

  /**
   * Récupère les statistiques d'accès pour un utilisateur
   * @param niveau_hierarchique Niveau de l'utilisateur
   * @param localite Localité de l'utilisateur
   * @returns Statistiques d'accès
   */
  async getAccessStats(
    niveau_hierarchique: number,
    localite: any
  ): Promise<{
    niveau: string;
    localite_principale: string;
    arrondissements_accessibles: number;
    departements_accessibles: number;
    regions_accessibles: number;
  }> {
    const localiteValue = localite?.valeur || localite;
    const niveauNames: Record<number, string> = {
      1: "Arrondissement",
      2: "Département",
      3: "Région",
      4: "Central",
    };

    const accessibleLocalites = await this.getAccessibleLocalites(
      niveau_hierarchique,
      localite
    );

    // Compter les différents types de localités accessibles
    const arrondissements = await this.pool.query(
      `
      SELECT COUNT(*) as count FROM arrondissements 
      WHERE nom = ANY($1)
    `,
      [accessibleLocalites]
    );

    const departements = await this.pool.query(
      `
      SELECT COUNT(*) as count FROM departements 
      WHERE nom = ANY($1)
    `,
      [accessibleLocalites]
    );

    const regions = await this.pool.query(
      `
      SELECT COUNT(*) as count FROM regions 
      WHERE nom = ANY($1)
    `,
      [accessibleLocalites]
    );

    return {
      niveau: niveauNames[niveau_hierarchique] || "Inconnu",
      localite_principale: localiteValue,
      arrondissements_accessibles: parseInt(arrondissements.rows[0].count),
      departements_accessibles: parseInt(departements.rows[0].count),
      regions_accessibles: parseInt(regions.rows[0].count),
    };
  }
}

export default GeographicAccessService;
