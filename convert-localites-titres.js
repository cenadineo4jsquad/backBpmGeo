/**
 * Script pour convertir les localités "simples" en objets JSON dans titres_fonciers
 */

const { Pool } = require("pg");

async function convertLocalites() {
  console.log("🔄 CONVERSION DES LOCALITÉS SIMPLES EN OBJETS JSON");
  console.log("=".repeat(50));

  const pool = new Pool({
    host: "localhost",
    port: 5432,
    database: "geobpm",
    user: "Cenadi-Squad",
    password: "",
  });

  try {
    // 1. Sélectionner les titres avec localité chaîne simple
    const res = await pool.query(
      "SELECT id, localite FROM titres_fonciers WHERE localite IS NOT NULL;"
    );
    let count = 0;
    for (const row of res.rows) {
      let loc = row.localite;
      let parsed = null;
      try {
        parsed = JSON.parse(loc);
      } catch (e) {
        // Ce n'est pas du JSON, donc une chaîne simple
      }
      if (!parsed && typeof loc === "string") {
        // Conversion : on suppose que c'est un arrondissement
        const obj = { type: "arrondissement", valeur: loc };
        await pool.query(
          "UPDATE titres_fonciers SET localite = $1 WHERE id = $2;",
          [JSON.stringify(obj), row.id]
        );
        console.log(`   ID ${row.id} : \"${loc}\" => ${JSON.stringify(obj)}`);
        count++;
      }
    }
    console.log(`\n✅ Conversion terminée. ${count} localités modifiées.`);
  } catch (error) {
    console.error("❌ Erreur:", error.message);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  convertLocalites();
}

module.exports = { convertLocalites };
