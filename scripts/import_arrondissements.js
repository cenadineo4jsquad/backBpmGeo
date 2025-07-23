// Script Node.js pour importer les arrondissements depuis Arrondissements.geojson dans la table localites
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

async function importArrondissements() {
  const data = JSON.parse(fs.readFileSync("Arrondissements.geojson", "utf8"));
  for (const feature of data.features) {
    const nom = feature.properties.NAME_3;
    if (!nom) continue;
    try {
      await pool.query(
        "INSERT INTO localites (type, valeur) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        ["arrondissement", nom]
      );
    } catch (err) {
      console.error("Erreur import:", nom, err.message);
    }
  }
  console.log("Import des arrondissements terminé");
  await pool.end();
}

importArrondissements();
