/**
 * Test pour vérifier les localités en base de données
 */

const { Pool } = require("pg");

async function testDatabase() {
  console.log("🗄️ TEST BASE DE DONNÉES - LOCALITÉS");
  console.log("=".repeat(50));

  const pool = new Pool({
    host: "localhost",
    port: 5432,
    database: "geobpm",
    user: "Cenadi-Squad",
    password: "",
  });

  try {
    // 1. Vérifier la structure de la table titres_fonciers
    console.log("📋 1. Structure de la table titres_fonciers...");
    const tableInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'titres_fonciers' 
      ORDER BY ordinal_position;
    `);

    console.log("Colonnes:");
    tableInfo.rows.forEach((col) => {
      console.log(
        `   ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`
      );
    });

    // 2. Voir tous les titres avec leurs localités
    console.log("\n📊 2. Tous les titres fonciers avec localités...");
    const allTitres = await pool.query(
      "SELECT id, proprietaire, localite FROM titres_fonciers ORDER BY id;"
    );

    console.log(`Trouvé ${allTitres.rows.length} titres:`);
    allTitres.rows.forEach((titre) => {
      console.log(`   ID ${titre.id}: ${titre.proprietaire}`);
      console.log(
        `      Localité (type: ${typeof titre.localite}): ${JSON.stringify(
          titre.localite
        )}`
      );
    });

    // 3. Rechercher spécifiquement les titres pour "Mefou et Afamba"
    console.log("\n🔍 3. Recherche titres pour 'Mefou et Afamba'...");

    // Test 1: Recherche directe par chaîne
    const searchString = await pool.query(
      "SELECT * FROM titres_fonciers WHERE localite = $1;",
      ["Mefou et Afamba"]
    );
    console.log(
      `   Recherche par chaîne "Mefou et Afamba": ${searchString.rows.length} résultats`
    );

    // Test 2: Recherche par objet JSON
    const searchObject = await pool.query(
      "SELECT * FROM titres_fonciers WHERE localite = $1;",
      [JSON.stringify({ type: "departement", valeur: "Mefou et Afamba" })]
    );
    console.log(
      `   Recherche par objet JSON: ${searchObject.rows.length} résultats`
    );

    // Test 3: Recherche avec jsonb
    const searchJsonb = await pool.query(
      "SELECT * FROM titres_fonciers WHERE localite::jsonb @> $1;",
      [JSON.stringify({ valeur: "Mefou et Afamba" })]
    );
    console.log(
      `   Recherche JSONB par valeur: ${searchJsonb.rows.length} résultats`
    );

    // 4. Tester les requêtes du service GeographicAccess
    console.log("\n🔧 4. Test des requêtes du service...");

    // Requête pour niveau 2 (département)
    const niveau2Query = `SELECT * FROM titres_fonciers WHERE localite IN (
      SELECT a.nom 
      FROM arrondissements a
      JOIN departements d ON a.departement_id = d.id
      WHERE d.nom = $1
    ) OR localite = $1`;

    const niveau2Result = await pool.query(niveau2Query, ["Mefou et Afamba"]);
    console.log(`   Requête niveau 2: ${niveau2Result.rows.length} résultats`);

    // 5. Vérifier les tables géographiques
    console.log("\n🗺️ 5. Vérification tables géographiques...");

    const departements = await pool.query(
      "SELECT id, nom FROM departements WHERE nom ILIKE '%Mefou%';"
    );
    console.log(
      `   Départements contenant "Mefou": ${departements.rows.length}`
    );
    departements.rows.forEach((dept) => {
      console.log(`      ID ${dept.id}: ${dept.nom}`);
    });

    const arrondissements = await pool.query(`
      SELECT a.id, a.nom, d.nom as departement
      FROM arrondissements a
      JOIN departements d ON a.departement_id = d.id
      WHERE d.nom ILIKE '%Mefou%';
    `);
    console.log(
      `   Arrondissements dans Mefou: ${arrondissements.rows.length}`
    );
    arrondissements.rows.forEach((arr) => {
      console.log(`      ${arr.nom} (${arr.departement})`);
    });
  } catch (error) {
    console.error("❌ Erreur:", error.message);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  testDatabase();
}

module.exports = { testDatabase };
