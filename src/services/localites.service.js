// Service pour gérer les localités géographiques
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Récupère tous les arrondissements d'un département donné
 */
async function getArrondissementsByDepartement(departementNom) {
  try {
    const results = await prisma.$queryRawUnsafe(
      `
      SELECT 
        a.id,
        a.nom as arrondissement,
        d.nom as departement,
        r.nom as region
      FROM arrondissements a
      JOIN departements d ON a.departement_id = d.id
      JOIN regions r ON d.region_id = r.id
      WHERE d.nom = $1
      ORDER BY a.nom
    `,
      departementNom
    );

    return results;
  } catch (error) {
    console.error("Erreur lors de la récupération des arrondissements:", error);
    return [];
  }
}

/**
 * Récupère tous les départements d'une région donnée
 */
async function getDepartementsByRegion(regionNom) {
  try {
    const results = await prisma.$queryRawUnsafe(
      `
      SELECT 
        d.id,
        d.nom as departement,
        r.nom as region,
        COUNT(a.id) as nombre_arrondissements
      FROM departements d
      JOIN regions r ON d.region_id = r.id
      LEFT JOIN arrondissements a ON a.departement_id = d.id
      WHERE r.nom = $1
      GROUP BY d.id, d.nom, r.nom
      ORDER BY d.nom
    `,
      regionNom
    );

    return results;
  } catch (error) {
    console.error("Erreur lors de la récupération des départements:", error);
    return [];
  }
}

/**
 * Récupère la hiérarchie complète pour un arrondissement donné
 */
async function getHierarchieByArrondissement(arrondissementNom) {
  try {
    const results = await prisma.$queryRawUnsafe(
      `
      SELECT 
        a.id as arrondissement_id,
        a.nom as arrondissement,
        d.id as departement_id,
        d.nom as departement,
        r.id as region_id,
        r.nom as region
      FROM arrondissements a
      JOIN departements d ON a.departement_id = d.id
      JOIN regions r ON d.region_id = r.id
      WHERE a.nom = $1
      LIMIT 1
    `,
      arrondissementNom
    );

    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error("Erreur lors de la récupération de la hiérarchie:", error);
    return null;
  }
}

/**
 * Récupère toutes les régions avec leurs statistiques
 */
async function getAllRegionsWithStats() {
  try {
    const results = await prisma.$queryRawUnsafe(`
      SELECT 
        r.id,
        r.nom as region,
        COUNT(DISTINCT d.id) as nombre_departements,
        COUNT(a.id) as nombre_arrondissements
      FROM regions r
      LEFT JOIN departements d ON d.region_id = r.id
      LEFT JOIN arrondissements a ON a.departement_id = d.id
      GROUP BY r.id, r.nom
      ORDER BY r.nom
    `);

    return results;
  } catch (error) {
    console.error("Erreur lors de la récupération des régions:", error);
    return [];
  }
}

/**
 * Recherche des localités par terme de recherche
 */
async function searchLocalites(searchTerm, type = null) {
  try {
    let query = `
      SELECT 
        'arrondissement' as type,
        a.id,
        a.nom as nom,
        d.nom as parent,
        r.nom as grand_parent
      FROM arrondissements a
      JOIN departements d ON a.departement_id = d.id
      JOIN regions r ON d.region_id = r.id
      WHERE a.nom ILIKE $1
    `;

    if (!type || type === "departement") {
      query += `
        UNION ALL
        SELECT 
          'departement' as type,
          d.id,
          d.nom as nom,
          r.nom as parent,
          NULL as grand_parent
        FROM departements d
        JOIN regions r ON d.region_id = r.id
        WHERE d.nom ILIKE $1
      `;
    }

    if (!type || type === "region") {
      query += `
        UNION ALL
        SELECT 
          'region' as type,
          r.id,
          r.nom as nom,
          NULL as parent,
          NULL as grand_parent
        FROM regions r
        WHERE r.nom ILIKE $1
      `;
    }

    query += " ORDER BY type, nom";

    const searchPattern = `%${searchTerm}%`;
    const results = await prisma.$queryRawUnsafe(query, searchPattern);

    return results;
  } catch (error) {
    console.error("Erreur lors de la recherche de localités:", error);
    return [];
  }
}

/**
 * Valide si un utilisateur peut accéder à une localité selon son niveau hiérarchique
 */
async function validateUserLocaliteAccess(userId, localiteId, action = "read") {
  try {
    // Récupérer l'utilisateur avec sa localité
    const user = await prisma.utilisateurs.findUnique({
      where: { id: userId },
      include: { localites: true },
    });

    if (!user) return false;

    // Récupérer la hiérarchie de la localité cible
    const targetLocalite = await prisma.localites.findUnique({
      where: { id: localiteId },
    });

    if (!targetLocalite) return false;

    // Si l'utilisateur est niveau 4 (admin), accès total
    if (user.niveau_hierarchique === 4) return true;

    // Si l'utilisateur n'a pas de localité assignée, pas d'accès
    if (!user.localite_id) return false;

    // Récupérer la hiérarchie de l'utilisateur
    const userLocalite = user.localites;

    // Logique d'accès selon le niveau hiérarchique
    switch (user.niveau_hierarchique) {
      case 1: // Arrondissement - peut seulement accéder à son arrondissement
        return user.localite_id === localiteId;

      case 2: // Département - peut accéder à tous les arrondissements de son département
        if (userLocalite.type === "departement") {
          // Vérifier si la localité cible appartient au même département
          const accessQuery = await prisma.$queryRawUnsafe(
            `
            SELECT 1 FROM localites l
            WHERE l.id = $1 
            AND (l.departement_id = $2 OR l.id = $2)
          `,
            localiteId,
            user.localite_id
          );

          return accessQuery.length > 0;
        }
        return false;

      case 3: // Région - peut accéder à tous les départements et arrondissements de sa région
        if (userLocalite.type === "region") {
          const accessQuery = await prisma.$queryRawUnsafe(
            `
            SELECT 1 FROM localites l
            WHERE l.id = $1 
            AND (l.region_id = $2 OR l.id = $2)
          `,
            localiteId,
            user.localite_id
          );

          return accessQuery.length > 0;
        }
        return false;

      default:
        return false;
    }
  } catch (error) {
    console.error("Erreur lors de la validation d'accès:", error);
    return false;
  }
}

module.exports = {
  getArrondissementsByDepartement,
  getDepartementsByRegion,
  getHierarchieByArrondissement,
  getAllRegionsWithStats,
  searchLocalites,
  validateUserLocaliteAccess,
};
