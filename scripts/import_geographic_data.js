// Script d'importation des données géographiques depuis les fichiers GeoJSON
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function importGeographicData() {
  console.log("🌍 IMPORTATION DES DONNÉES GÉOGRAPHIQUES");
  console.log("========================================");

  try {
    // Lire les fichiers GeoJSON
    const arrondissementsPath = path.join(
      __dirname,
      "../Arrondissements.geojson"
    );
    const departementsPath = path.join(__dirname, "Departements.geojson");

    if (!fs.existsSync(arrondissementsPath)) {
      throw new Error("Fichier Arrondissements.geojson non trouvé");
    }

    if (!fs.existsSync(departementsPath)) {
      throw new Error("Fichier Departements.geojson non trouvé");
    }

    console.log("📂 Lecture des fichiers GeoJSON...");
    const arrondissementsData = JSON.parse(
      fs.readFileSync(arrondissementsPath, "utf8")
    );
    const departementsData = JSON.parse(
      fs.readFileSync(departementsPath, "utf8")
    );

    // Extraire les données uniques
    const regions = new Set();
    const departements = new Map(); // key: nom_departement, value: { nom, region }
    const arrondissements = new Map(); // key: nom_arrondissement, value: { nom, departement }

    console.log("🔍 Extraction des données depuis Arrondissements.geojson...");

    // Traiter les arrondissements pour extraire la hiérarchie
    arrondissementsData.features.forEach((feature) => {
      const properties = feature.properties;

      if (properties.NAME_1 && properties.NAME_2 && properties.NAME_3) {
        const region = properties.NAME_1;
        const departement = properties.NAME_2;
        const arrondissement = properties.NAME_3;

        // Ajouter la région
        regions.add(region);

        // Ajouter le département avec sa région
        if (!departements.has(departement)) {
          departements.set(departement, { nom: departement, region: region });
        }

        // Ajouter l'arrondissement avec son département
        const arrKey = `${arrondissement}-${departement}`;
        if (!arrondissements.has(arrKey)) {
          arrondissements.set(arrKey, {
            nom: arrondissement,
            departement: departement,
            region: region,
          });
        }
      }
    });

    console.log(`📊 Statistiques d'extraction:`);
    console.log(`   • Régions: ${regions.size}`);
    console.log(`   • Départements: ${departements.size}`);
    console.log(`   • Arrondissements: ${arrondissements.size}`);

    // Commencer la transaction d'importation
    await prisma.$transaction(async (prisma) => {
      console.log("\n💾 IMPORTATION EN BASE DE DONNÉES");
      console.log("=================================");

      // 1. Importer les régions
      console.log("1️⃣  Importation des régions...");
      const regionMap = new Map();

      for (const regionNom of regions) {
        try {
          const region = await prisma.$executeRawUnsafe(
            `
            INSERT INTO regions (nom) 
            VALUES ($1)
            ON CONFLICT (nom) DO UPDATE SET nom = EXCLUDED.nom
            RETURNING id
          `,
            regionNom
          );

          // Récupérer l'ID de la région
          const regionRecord = await prisma.$queryRawUnsafe(
            `
            SELECT id FROM regions WHERE nom = $1
          `,
            regionNom
          );

          if (regionRecord && regionRecord.length > 0) {
            regionMap.set(regionNom, regionRecord[0].id);
            console.log(
              `   ✅ Région "${regionNom}" -> ID: ${regionRecord[0].id}`
            );
          }
        } catch (error) {
          console.warn(`   ⚠️  Erreur région "${regionNom}":`, error.message);
        }
      }

      // 2. Importer les départements
      console.log("\n2️⃣  Importation des départements...");
      const departementMap = new Map();

      for (const [deptNom, deptData] of departements) {
        try {
          const regionId = regionMap.get(deptData.region);
          if (regionId) {
            await prisma.$executeRawUnsafe(
              `
              INSERT INTO departements (nom, region_id) 
              VALUES ($1, $2)
              ON CONFLICT (nom, region_id) DO UPDATE SET nom = EXCLUDED.nom
            `,
              deptNom,
              regionId
            );

            // Récupérer l'ID du département
            const deptRecord = await prisma.$queryRawUnsafe(
              `
              SELECT id FROM departements WHERE nom = $1 AND region_id = $2
            `,
              deptNom,
              regionId
            );

            if (deptRecord && deptRecord.length > 0) {
              departementMap.set(deptNom, deptRecord[0].id);
              console.log(
                `   ✅ Département "${deptNom}" (${deptData.region}) -> ID: ${deptRecord[0].id}`
              );
            }
          }
        } catch (error) {
          console.warn(
            `   ⚠️  Erreur département "${deptNom}":`,
            error.message
          );
        }
      }

      // 3. Importer les arrondissements
      console.log("\n3️⃣  Importation des arrondissements...");
      let arrCount = 0;

      for (const [arrKey, arrData] of arrondissements) {
        try {
          const departementId = departementMap.get(arrData.departement);
          if (departementId) {
            await prisma.$executeRawUnsafe(
              `
              INSERT INTO arrondissements (nom, departement_id) 
              VALUES ($1, $2)
              ON CONFLICT (nom, departement_id) DO UPDATE SET nom = EXCLUDED.nom
            `,
              arrData.nom,
              departementId
            );

            arrCount++;
            if (arrCount % 50 === 0) {
              console.log(`   📊 ${arrCount} arrondissements importés...`);
            }
          }
        } catch (error) {
          console.warn(
            `   ⚠️  Erreur arrondissement "${arrData.nom}":`,
            error.message
          );
        }
      }

      console.log(`   ✅ Total: ${arrCount} arrondissements importés`);

      // 4. Mettre à jour les localités existantes
      console.log("\n4️⃣  Mise à jour des localités existantes...");

      // Récupérer toutes les localités actuelles
      const localitesExistantes = await prisma.localites.findMany();

      for (const localite of localitesExistantes) {
        try {
          if (localite.type === "arrondissement") {
            // Chercher l'arrondissement correspondant
            const arrRecord = await prisma.$queryRawUnsafe(
              `
              SELECT a.id as arr_id, d.id as dept_id, r.id as region_id
              FROM arrondissements a
              JOIN departements d ON a.departement_id = d.id
              JOIN regions r ON d.region_id = r.id
              WHERE a.nom = $1
              LIMIT 1
            `,
              localite.valeur
            );

            if (arrRecord && arrRecord.length > 0) {
              await prisma.localites.update({
                where: { id: localite.id },
                data: {
                  arrondissement_id: arrRecord[0].arr_id,
                  departement_id: arrRecord[0].dept_id,
                  region_id: arrRecord[0].region_id,
                },
              });
            }
          } else if (localite.type === "departement") {
            // Chercher le département correspondant
            const deptRecord = await prisma.$queryRawUnsafe(
              `
              SELECT d.id as dept_id, r.id as region_id
              FROM departements d
              JOIN regions r ON d.region_id = r.id
              WHERE d.nom = $1
              LIMIT 1
            `,
              localite.valeur
            );

            if (deptRecord && deptRecord.length > 0) {
              await prisma.localites.update({
                where: { id: localite.id },
                data: {
                  departement_id: deptRecord[0].dept_id,
                  region_id: deptRecord[0].region_id,
                },
              });
            }
          }
        } catch (error) {
          console.warn(
            `   ⚠️  Erreur mise à jour localité "${localite.valeur}":`,
            error.message
          );
        }
      }
    });

    console.log("\n🎉 IMPORTATION TERMINÉE AVEC SUCCÈS !");
    console.log("====================================");

    // Afficher un résumé
    const regionsCount = await prisma.$queryRawUnsafe(
      "SELECT COUNT(*) as count FROM regions"
    );
    const departementsCount = await prisma.$queryRawUnsafe(
      "SELECT COUNT(*) as count FROM departements"
    );
    const arrondissementsCount = await prisma.$queryRawUnsafe(
      "SELECT COUNT(*) as count FROM arrondissements"
    );

    console.log("📈 RÉSUMÉ FINAL:");
    console.log(`   • Régions en base: ${regionsCount[0]?.count || 0}`);
    console.log(
      `   • Départements en base: ${departementsCount[0]?.count || 0}`
    );
    console.log(
      `   • Arrondissements en base: ${arrondissementsCount[0]?.count || 0}`
    );
  } catch (error) {
    console.error("❌ Erreur lors de l'importation:", error);
    console.error("Stack:", error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Lancer l'importation
importGeographicData();
