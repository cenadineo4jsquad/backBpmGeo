// Script d'importation rapide des localités depuis les GeoJSON
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");

const prisma = new PrismaClient();

async function quickImportLocalites() {
  console.log("🚀 IMPORTATION RAPIDE DES LOCALITÉS");
  console.log("===================================");

  try {
    // Lire le fichier des arrondissements
    console.log("📂 Lecture du fichier Arrondissements.geojson...");
    const arrondissementsData = JSON.parse(
      fs.readFileSync("./Arrondissements.geojson", "utf8")
    );

    // Extraire les données uniques
    const localitesMap = new Map();

    console.log("🔍 Extraction des localités...");
    let featuresProcessed = 0;

    arrondissementsData.features.forEach((feature) => {
      const props = feature.properties;

      if (props.NAME_1 && props.NAME_2 && props.NAME_3) {
        const region = props.NAME_1.trim();
        const departement = props.NAME_2.trim();
        const arrondissement = props.NAME_3.trim();

        // Ajouter région
        if (!localitesMap.has(`region:${region}`)) {
          localitesMap.set(`region:${region}`, {
            type: "region",
            valeur: region,
            parent: null,
          });
        }

        // Ajouter département
        const deptKey = `departement:${departement}:${region}`;
        if (!localitesMap.has(deptKey)) {
          localitesMap.set(deptKey, {
            type: "departement",
            valeur: departement,
            parent: region,
          });
        }

        // Ajouter arrondissement
        const arrKey = `arrondissement:${arrondissement}:${departement}:${region}`;
        if (!localitesMap.has(arrKey)) {
          localitesMap.set(arrKey, {
            type: "arrondissement",
            valeur: arrondissement,
            parent: departement,
            grandParent: region,
          });
        }

        featuresProcessed++;
      }
    });

    console.log(`✅ ${featuresProcessed} features traitées`);
    console.log(`📊 ${localitesMap.size} localités uniques extraites`);

    // Compter par type
    const stats = { region: 0, departement: 0, arrondissement: 0 };
    localitesMap.forEach((localite) => stats[localite.type]++);
    console.log(`   • Régions: ${stats.region}`);
    console.log(`   • Départements: ${stats.departement}`);
    console.log(`   • Arrondissements: ${stats.arrondissement}`);

    // Importer dans la base de données
    console.log("\n💾 Importation en base de données...");

    let imported = 0;
    let errors = 0;

    for (const [key, localite] of localitesMap) {
      try {
        await prisma.localites.upsert({
          where: {
            type_valeur: {
              type: localite.type,
              valeur: localite.valeur,
            },
          },
          update: {}, // Ne rien mettre à jour si existe déjà
          create: {
            type: localite.type,
            valeur: localite.valeur,
          },
        });
        imported++;

        if (imported % 100 === 0) {
          console.log(`   📊 ${imported} localités importées...`);
        }
      } catch (error) {
        errors++;
        if (errors <= 5) {
          // Afficher seulement les 5 premières erreurs
          console.warn(
            `   ⚠️  Erreur pour "${localite.valeur}":`,
            error.message
          );
        }
      }
    }

    console.log(`\n✅ Importation terminée:`);
    console.log(`   • ${imported} localités importées`);
    console.log(`   • ${errors} erreurs`);

    // Afficher un échantillon des données importées
    console.log("\n📋 ÉCHANTILLON DES DONNÉES IMPORTÉES:");

    const regions = await prisma.localites.findMany({
      where: { type: "region" },
      take: 5,
      orderBy: { valeur: "asc" },
    });

    console.log("\n🏛️  Régions (échantillon):");
    regions.forEach((r) => console.log(`   • ${r.valeur}`));

    const departements = await prisma.localites.findMany({
      where: { type: "departement" },
      take: 5,
      orderBy: { valeur: "asc" },
    });

    console.log("\n🏢 Départements (échantillon):");
    departements.forEach((d) => console.log(`   • ${d.valeur}`));

    const arrondissements = await prisma.localites.findMany({
      where: { type: "arrondissement" },
      take: 5,
      orderBy: { valeur: "asc" },
    });

    console.log("\n🏘️  Arrondissements (échantillon):");
    arrondissements.forEach((a) => console.log(`   • ${a.valeur}`));

    // Statistiques finales
    const finalStats = await Promise.all([
      prisma.localites.count({ where: { type: "region" } }),
      prisma.localites.count({ where: { type: "departement" } }),
      prisma.localites.count({ where: { type: "arrondissement" } }),
    ]);

    console.log("\n📊 STATISTIQUES FINALES:");
    console.log(`   • Régions en base: ${finalStats[0]}`);
    console.log(`   • Départements en base: ${finalStats[1]}`);
    console.log(`   • Arrondissements en base: ${finalStats[2]}`);
    console.log(`   • Total: ${finalStats[0] + finalStats[1] + finalStats[2]}`);
  } catch (error) {
    console.error("❌ Erreur lors de l'importation:", error);
    console.error("Stack:", error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Lancer l'importation
quickImportLocalites();
