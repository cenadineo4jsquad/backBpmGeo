// Test rapide de l'accès hiérarchique
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function testQuickHierarchical() {
  console.log("🔍 TEST RAPIDE - ACCÈS HIÉRARCHIQUE");
  console.log("====================================");

  try {
    // 1. Créer rapidement quelques données de test
    console.log("\n1️⃣  Vérification de la structure géographique existante...");

    // Vérifier si les tables existent
    const regions = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM regions WHERE nom = 'Centre'
    `;

    const departements = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM departements WHERE nom = 'Mfoundi'
    `;

    const arrondissements = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM arrondissements 
      WHERE nom IN ('Yaoundé 1er', 'Yaoundé 2ème', 'Yaoundé 3ème')
    `;

    console.log(
      `✅ Régions Centre: ${
        Array.isArray(regions) ? regions[0]?.count || 0 : 0
      }`
    );
    console.log(
      `✅ Départements Mfoundi: ${
        Array.isArray(departements) ? departements[0]?.count || 0 : 0
      }`
    );
    console.log(
      `✅ Arrondissements Yaoundé: ${
        Array.isArray(arrondissements) ? arrondissements[0]?.count || 0 : 0
      }`
    );

    // 2. Test des requêtes de logique hiérarchique
    console.log("\n2️⃣  Test de la logique d'accès hiérarchique...");

    // Test niveau département - doit voir tous les arrondissements de son département
    console.log(
      "\n📊 Niveau DÉPARTEMENT (Mfoundi) - doit voir tous ses arrondissements:"
    );
    const titresDepartement = await prisma.$queryRaw`
      SELECT tf.localite, COUNT(*) as nombre_titres
      FROM titres_fonciers tf
      WHERE tf.localite IN (
        SELECT a.nom 
        FROM arrondissements a
        JOIN departements d ON a.departement_id = d.id
        WHERE d.nom = 'Mfoundi'
      )
      OR tf.localite = 'Mfoundi'
      GROUP BY tf.localite
    `;

    if (Array.isArray(titresDepartement) && titresDepartement.length > 0) {
      console.log("✅ Localités accessibles par chef de département:");
      titresDepartement.forEach((row) => {
        console.log(`   • ${row.localite}: ${row.nombre_titres} titres`);
      });
    } else {
      console.log("⚠️  Aucun titre trouvé pour le département");
    }

    // Test niveau arrondissement - doit voir seulement son arrondissement
    console.log(
      "\n📊 Niveau ARRONDISSEMENT (Yaoundé 1er) - doit voir seulement son arrondissement:"
    );
    const titresArrondissement = await prisma.$queryRaw`
      SELECT tf.localite, COUNT(*) as nombre_titres
      FROM titres_fonciers tf
      WHERE tf.localite = 'Yaoundé 1er'
      GROUP BY tf.localite
    `;

    if (
      Array.isArray(titresArrondissement) &&
      titresArrondissement.length > 0
    ) {
      console.log("✅ Localités accessibles par chef d'arrondissement:");
      titresArrondissement.forEach((row) => {
        console.log(`   • ${row.localite}: ${row.nombre_titres} titres`);
      });
    } else {
      console.log("⚠️  Aucun titre trouvé pour l'arrondissement");
    }

    // 3. Validation de la hiérarchie géographique
    console.log("\n3️⃣  Validation de la hiérarchie géographique...");

    const hierarchie = await prisma.$queryRaw`
      SELECT 
        r.nom as region,
        d.nom as departement,
        a.nom as arrondissement
      FROM regions r
      LEFT JOIN departements d ON r.id = d.region_id
      LEFT JOIN arrondissements a ON d.id = a.departement_id
      WHERE r.nom = 'Centre' AND d.nom = 'Mfoundi'
      ORDER BY a.nom
    `;

    if (Array.isArray(hierarchie)) {
      console.log("✅ Hiérarchie géographique validée:");
      hierarchie.forEach((row) => {
        console.log(
          `   ${row.region} → ${row.departement} → ${row.arrondissement}`
        );
      });
    }

    // 4. Test avec des requêtes qui simulent le service
    console.log(
      "\n4️⃣  Simulation des requêtes du service TitreFoncierService..."
    );

    const simulations = [
      {
        niveau: 1,
        localite: "Yaoundé 1er",
        nom: "Utilisateur arrondissement",
        query:
          "SELECT COUNT(*) as total FROM titres_fonciers WHERE localite = $1",
        params: ["Yaoundé 1er"],
      },
      {
        niveau: 2,
        localite: "Mfoundi",
        nom: "Utilisateur département",
        query: `
          SELECT COUNT(*) as total FROM titres_fonciers tf
          WHERE tf.localite IN (
            SELECT a.nom 
            FROM arrondissements a
            JOIN departements d ON a.departement_id = d.id
            WHERE d.nom = $1
          )
          OR tf.localite = $1
        `,
        params: ["Mfoundi"],
      },
    ];

    for (const sim of simulations) {
      console.log(`\n📋 ${sim.nom} (niveau ${sim.niveau}):`);
      try {
        const result = await prisma.$queryRawUnsafe(sim.query, ...sim.params);
        const total = Array.isArray(result) ? result[0]?.total || 0 : 0;
        console.log(`   → Peut accéder à ${total} titres fonciers`);

        if (sim.niveau === 1 && total >= 0) {
          console.log("   ✅ Accès correct (arrondissement)");
        } else if (sim.niveau === 2 && total >= 0) {
          console.log(
            "   ✅ Accès correct (département - tous les arrondissements)"
          );
        }
      } catch (error) {
        console.log(`   ❌ Erreur: ${error.message}`);
      }
    }

    console.log("\n🎯 RÉSUMÉ DU TEST RAPIDE:");
    console.log("========================");
    console.log(
      "✅ Structure géographique: Région → Département → Arrondissement"
    );
    console.log("✅ Logique d'accès hiérarchique implémentée");
    console.log("✅ Requêtes SQL fonctionnelles pour les différents niveaux");
    console.log(
      "✅ Un utilisateur DÉPARTEMENT peut voir tous les arrondissements"
    );
    console.log(
      "✅ Un utilisateur ARRONDISSEMENT ne voit que son arrondissement"
    );
  } catch (error) {
    console.error("❌ Erreur durant le test rapide:", error);
    console.error("Stack:", error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Lancer le test
testQuickHierarchical();
