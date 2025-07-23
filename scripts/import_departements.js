// Script Node.js pour importer les départements depuis Departements.geojson dans la table localites
// Utilise pg et fs

const fs = require("fs");
const { Pool } = require("pg");

const pool = new Pool({
  user: "Cenadi-Squad",
  host: "localhost",
  database: "geobpm",
  password: "",
  port: 5432,
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
