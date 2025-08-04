/**
 * Test direct de la base de données pour vérifier les extractions
 */

const { Pool } = require("pg");

async function checkDatabase() {
  console.log("🗃️  VÉRIFICATION DIRECTE DE LA BASE DE DONNÉES");
  console.log("=".repeat(50));

  const pool = new Pool({
    user: process.env.DATABASE_USER || "postgres",
    host: process.env.DATABASE_HOST || "localhost",
    database: process.env.DATABASE_NAME || "geobpm",
    password: process.env.DATABASE_PASSWORD || "postgres",
    port: process.env.DATABASE_PORT || 5432,
  });

  try {
    // 1. Vérifier la table extractions
    console.log("📊 1. Comptage des extractions...");
    const countResult = await pool.query("SELECT COUNT(*) FROM extractions");
    console.log(`   Total extractions: ${countResult.rows[0].count}`);

    // 2. Si extractions existent, voir quelques exemples
    if (parseInt(countResult.rows[0].count) > 0) {
      console.log("\n📋 2. Exemples d'extractions:");
      const sampleResult = await pool.query(`
        SELECT id, projet_id, utilisateur_id, fichier, statut, 
               date_extraction, donnees_extraites
        FROM extractions 
        ORDER BY date_extraction DESC 
        LIMIT 3
      `);

      sampleResult.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ID ${row.id}:`);
        console.log(`      Projet: ${row.projet_id}`);
        console.log(`      Utilisateur: ${row.utilisateur_id}`);
        console.log(`      Fichier: ${row.fichier}`);
        console.log(`      Statut: ${row.statut}`);
        console.log(`      Date: ${row.date_extraction}`);
        console.log(
          `      Localité dans données:`,
          row.donnees_extraites?.localite || "Non définie"
        );
        console.log("");
      });
    }

    // 3. Vérifier les données utilisateur
    console.log("👤 3. Vérification utilisateur 44:");
    const userResult = await pool.query(`
      SELECT u.id, u.email, u.niveau_hierarchique, 
             l.type, l.valeur as localite_valeur
      FROM utilisateurs u
      LEFT JOIN localites l ON u.localite_id = l.id
      WHERE u.id = 44
    `);

    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      console.log("   ID:", user.id);
      console.log("   Email:", user.email);
      console.log("   Niveau:", user.niveau_hierarchique);
      console.log("   Localité type:", user.type);
      console.log("   Localité valeur:", user.localite_valeur);
    }

    // 4. Créer une extraction de test si aucune n'existe
    if (parseInt(countResult.rows[0].count) === 0) {
      console.log("\n💡 4. Création d'une extraction de test...");

      const testExtraction = await pool.query(`
        INSERT INTO extractions (
          projet_id, utilisateur_id, fichier, donnees_extraites, 
          seuil_confiance, statut, date_extraction
        ) VALUES (
          22, 44, 'test-document.pdf', 
          '{"localite": {"type": "arrondissement", "valeur": "Soa"}, "test": true}',
          95.0, 'Extrait', NOW()
        ) RETURNING id
      `);

      console.log(
        `   ✅ Extraction de test créée avec ID: ${testExtraction.rows[0].id}`
      );
      console.log("   📄 Contenu:");
      console.log("      Projet: 22");
      console.log("      Utilisateur: 44");
      console.log("      Localité: Soa (arrondissement)");
      console.log("      Statut: Extrait");
    }
  } catch (error) {
    console.error("❌ Erreur base de données:", error.message);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  checkDatabase();
}

module.exports = { checkDatabase };
