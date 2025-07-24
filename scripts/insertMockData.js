// Script d’insertion des données mock dans la base PostgreSQL
const { Pool } = require("pg");
const {
  MOCK_LOCALITES,
  MOCK_ROLES,
  MOCK_USERS,
  MOCK_PROJETS,
  MOCK_TITRES_FONCIERS,
} = require("../mockData");

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: "localhost",
  database: process.env.DB_NAME || "geobpm",
  password: process.env.DB_PASSWORD || "password",
  port: 5432,
});

async function insertLocalites() {
  for (const loc of MOCK_LOCALITES) {
    await pool.query(
      `INSERT INTO localites (id, nom, type, valeur) VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) DO NOTHING;`,
      [loc.id, loc.nom, loc.type, loc.valeur]
    );
  }
}

async function insertRoles() {
  for (const role of MOCK_ROLES) {
    await pool.query(
      `INSERT INTO roles (id, nom, niveau_hierarchique) VALUES ($1, $2, $3)
      ON CONFLICT (id) DO NOTHING;`,
      [role.id, role.nom, role.niveau_hierarchique]
    );
  }
}

async function insertUsers() {
  for (const user of MOCK_USERS) {
    await pool.query(
      `INSERT INTO utilisateurs (id, nom, prenom, email, niveau_hierarchique, localite_id, role_id) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO NOTHING;`,
      [
        user.id,
        user.nom,
        user.prenom,
        user.email,
        user.niveau_hierarchique,
        user.localite.id,
        user.role.id,
      ]
    );
  }
}

async function insertProjets() {
  for (const projet of MOCK_PROJETS) {
    await pool.query(
      `INSERT INTO projets (id, nom, description, created_at) VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) DO NOTHING;`,
      [
        projet.id,
        projet.nom,
        projet.description,
        projet.created_at || new Date(),
      ]
    );
  }
}

async function insertTitresFoncier() {
  for (const titre of MOCK_TITRES_FONCIERS) {
    await pool.query(
      `INSERT INTO titres_fonciers (id, proprietaire, coordonnees_gps, superficie, perimetre, localite, statut, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (id) DO NOTHING;`,
      [
        titre.id,
        titre.proprietaire,
        JSON.stringify(titre.coordonnees_gps),
        titre.surface_m2,
        titre.perimetre_m,
        JSON.stringify(titre.localite),
        titre.statut,
        titre.created_at,
        titre.updated_at,
      ]
    );
  }
}

async function main() {
  try {
    await insertLocalites();
    await insertRoles();
    await insertUsers();
    await insertProjets();
    await insertTitresFoncier();
    console.log("Mock data insérée avec succès !");
  } catch (err) {
    console.error("Erreur lors de l’insertion des données mock :", err);
  } finally {
    await pool.end();
  }
}

main();
