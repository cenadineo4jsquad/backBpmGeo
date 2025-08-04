/**
 * Test pour lister les extractions déjà faites
 */

const axios = require("axios");

async function listExtractions() {
  console.log("📋 LISTE DES EXTRACTIONS DÉJÀ FAITES");
  console.log("=".repeat(50));

  try {
    // 1. Connexion
    console.log("🔐 1. Connexion...");
    const loginResponse = await axios.post("http://localhost:3000/api/login", {
      email: "reception.foncier@workflow.cm",
      mot_de_passe: "reception2025",
    });

    const token = loginResponse.data.access_token;
    console.log("✅ Connecté");

    // 2. Récupération de toutes les extractions
    console.log("\n📋 2. Récupération de toutes les extractions...");
    const allExtractionsResponse = await axios.get(
      "http://localhost:3000/api/extractions",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log(
      `✅ ${allExtractionsResponse.data.length} extractions trouvées`
    );

    if (allExtractionsResponse.data.length > 0) {
      console.log("\n📊 Résumé des extractions:");
      allExtractionsResponse.data.forEach((extraction, index) => {
        console.log(`   ${index + 1}. ID: ${extraction.id}`);
        console.log(`      Projet: ${extraction.projet_id}`);
        console.log(`      Statut: ${extraction.statut}`);
        console.log(`      Fichier: ${extraction.fichier}`);
        console.log(
          `      Date: ${new Date(extraction.date_extraction).toLocaleString(
            "fr-FR"
          )}`
        );
        console.log(`      Utilisateur: ${extraction.utilisateur_id}`);

        if (
          extraction.donnees_extraites &&
          extraction.donnees_extraites.localite
        ) {
          console.log(
            `      Localité: ${extraction.donnees_extraites.localite.type} - ${extraction.donnees_extraites.localite.valeur}`
          );
        }
        console.log("");
      });
    }

    // 3. Test avec filtres
    console.log("\n🔍 3. Tests avec filtres...");

    // Filtrer par projet
    console.log("\n   📁 Filtrage par projet (projet_id=22):");
    const projetFilterResponse = await axios.get(
      "http://localhost:3000/api/extractions?projet_id=22",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log(
      `   ✅ ${projetFilterResponse.data.length} extractions pour le projet 22`
    );

    // Filtrer par statut
    console.log("\n   📊 Filtrage par statut (statut=Extrait):");
    const statutFilterResponse = await axios.get(
      "http://localhost:3000/api/extractions?statut=Extrait",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log(
      `   ✅ ${statutFilterResponse.data.length} extractions avec le statut 'Extrait'`
    );

    // Filtrer par utilisateur
    console.log("\n   👤 Filtrage par utilisateur (utilisateur_id=44):");
    const userFilterResponse = await axios.get(
      "http://localhost:3000/api/extractions?utilisateur_id=44",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log(
      `   ✅ ${userFilterResponse.data.length} extractions pour l'utilisateur 44`
    );

    // Combinaison de filtres
    console.log("\n   🎯 Filtrage combiné (projet=22 + statut=Extrait):");
    const combinedFilterResponse = await axios.get(
      "http://localhost:3000/api/extractions?projet_id=22&statut=Extrait",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log(
      `   ✅ ${combinedFilterResponse.data.length} extractions (projet 22 + statut Extrait)`
    );
  } catch (error) {
    console.error("\n❌ Erreur:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
  }
}

async function getExtractionDetails() {
  console.log("\n🔍 DÉTAILS D'UNE EXTRACTION SPÉCIFIQUE");
  console.log("=".repeat(50));

  try {
    // Connexion
    const loginResponse = await axios.post("http://localhost:3000/api/login", {
      email: "reception.foncier@workflow.cm",
      mot_de_passe: "reception2025",
    });

    const token = loginResponse.data.access_token;

    // Récupérer la première extraction pour avoir un ID
    const allExtractionsResponse = await axios.get(
      "http://localhost:3000/api/extractions",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (allExtractionsResponse.data.length > 0) {
      const firstExtraction = allExtractionsResponse.data[0];
      console.log(`\n📄 Détails de l'extraction ID ${firstExtraction.id}:`);

      const detailResponse = await axios.get(
        `http://localhost:3000/api/extractions/${firstExtraction.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(JSON.stringify(detailResponse.data, null, 2));
    } else {
      console.log("ℹ️  Aucune extraction trouvée pour afficher les détails");
    }
  } catch (error) {
    console.error("\n❌ Erreur:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
  }
}

async function runExtractionsList() {
  await listExtractions();
  await getExtractionDetails();

  console.log("\n" + "=".repeat(50));
  console.log("📚 GUIDE D'UTILISATION DE L'API EXTRACTIONS:");
  console.log("");
  console.log("🔗 Routes disponibles:");
  console.log(
    "  GET /api/extractions              - Liste toutes les extractions"
  );
  console.log("  GET /api/extractions?projet_id=X  - Filtre par projet");
  console.log("  GET /api/extractions?statut=X     - Filtre par statut");
  console.log(
    "  GET /api/extractions?utilisateur_id=X - Filtre par utilisateur"
  );
  console.log("  GET /api/extractions/:id          - Détails d'une extraction");
  console.log("");
  console.log("📊 Statuts possibles:");
  console.log("  - 'Extrait'      - Extraction terminée");
  console.log("  - 'En cours'     - En cours de traitement");
  console.log("  - 'Corrigé'      - Corrigée manuellement");
  console.log("  - 'Validé'       - Validée par un superviseur");
  console.log("  - 'Rejeté'       - Rejetée");
  console.log("");
  console.log("🔐 Autorisation:");
  console.log("  - Header: Authorization: Bearer {token}");
  console.log("  - Les utilisateurs de niveau 1-2 voient uniquement");
  console.log("    les extractions de leur localité");
  console.log("  - Les utilisateurs de niveau 3-4 voient tout");
}

if (require.main === module) {
  runExtractionsList();
}

module.exports = { listExtractions, getExtractionDetails };
