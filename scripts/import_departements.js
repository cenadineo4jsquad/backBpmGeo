// Script Node.js pour importer les départements depuis Departements.geojson dans la table localites
// Utilise pg et fs

require("dotenv").config();
const fs = require("fs");
const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT ?? "5432", 10),
});

async function importDepartements() {
  const data = JSON.parse(fs.readFileSync("Departements.geojson", "utf8"));
  for (const feature of data.features) {
    const nom = feature.properties.NAME_2;
    if (!nom) continue;
    try {
      await pool.query(
        "INSERT INTO localites (type, valeur) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        ["departement", nom]
      );
    } catch (err) {
      console.error("Erreur import:", nom, err.message);
    }
  }
  console.log("Import des départements terminé");
  await pool.end();
}

importDepartements();
