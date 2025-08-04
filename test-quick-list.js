/**
 * Test rapide pour vérifier si la liste des extractions fonctionne maintenant
 */

const axios = require("axios");

async function quickTestList() {
  console.log("🔧 TEST RAPIDE : LISTE APRÈS CORRECTION");
  console.log("=".repeat(50));

  try {
    // Connexion
    const loginResponse = await axios.post("http://localhost:3000/api/login", {
      email: "reception.foncier@workflow.cm",
      mot_de_passe: "reception2025",
    });

    const token = loginResponse.data.access_token;
    console.log("✅ Connecté");

    // Test de la liste
    const listResponse = await axios.get(
      "http://localhost:3000/api/extractions",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log("📋 Résultat de la liste:");
    console.log("   Status:", listResponse.status);
    console.log("   Nombre d'extractions:", listResponse.data.length);

    if (listResponse.data.length > 0) {
      console.log("\n✅ SUCCÈS ! Extractions trouvées:");
      listResponse.data.forEach((extraction, index) => {
        console.log(`   ${index + 1}. ID: ${extraction.id}`);
        console.log(`      Projet: ${extraction.projet_id}`);
        console.log(`      Utilisateur: ${extraction.utilisateur_id}`);
        console.log(`      Fichier: ${extraction.fichier}`);
        console.log(`      Statut: ${extraction.statut}`);
        console.log(
          `      Date: ${new Date(extraction.date_extraction).toLocaleString(
            "fr-FR"
          )}`
        );

        if (extraction.donnees_extraites) {
          if (extraction.donnees_extraites.localite) {
            console.log(
              `      Localité: ${extraction.donnees_extraites.localite.type} - ${extraction.donnees_extraites.localite.valeur}`
            );
          } else if (extraction.donnees_extraites.message) {
            console.log(
              `      Message: ${extraction.donnees_extraites.message}`
            );
          }
        }
        console.log("");
      });
    } else {
      console.log("⚠️  Liste toujours vide");
    }

    // Test avec filtres
    console.log("🔍 Test avec filtres:");

    const userFilterResponse = await axios.get(
      "http://localhost:3000/api/extractions?utilisateur_id=44",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    console.log(
      `   Par utilisateur 44: ${userFilterResponse.data.length} extractions`
    );

    const projetFilterResponse = await axios.get(
      "http://localhost:3000/api/extractions?projet_id=22",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    console.log(
      `   Par projet 22: ${projetFilterResponse.data.length} extractions`
    );
  } catch (error) {
    console.error("❌ Erreur:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
  }
}

if (require.main === module) {
  quickTestList();
}

module.exports = { quickTestList };
