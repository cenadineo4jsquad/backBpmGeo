/**
 * Test simple pour créer et lister des titres fonciers
 */

const axios = require("axios");

async function testSimple() {
  console.log("🏠 TEST SIMPLE TITRES FONCIERS");
  console.log("=".repeat(50));

  try {
    // 1. Connexion admin
    console.log("🔐 1. Connexion admin...");
    const loginAdmin = await axios.post("http://localhost:3000/api/login", {
      email: "admin@gov.cm",
      mot_de_passe: "motdepassefort",
    });

    const tokenAdmin = loginAdmin.data.access_token;
    console.log("✅ Admin connecté");

    // 2. Voir tous les titres existants
    console.log("\n📋 2. Liste tous les titres (admin)...");
    const adminList = await axios.get(
      "http://localhost:3000/api/titres_fonciers",
      {
        headers: { Authorization: `Bearer ${tokenAdmin}` },
      }
    );

    console.log("📊 Titres existants :", adminList.data.titres.length);
    adminList.data.titres.forEach((titre, index) => {
      console.log(`   ${index + 1}. ID ${titre.id} - ${titre.proprietaire}`);
      console.log(`      Localité: ${JSON.stringify(titre.localite)}`);
    });

    // 3. Créer un titre pour "Mefou et Afamba"
    console.log("\n➕ 3. Création titre pour Mefou et Afamba...");
    const nouveauTitre = {
      projet_id: 22,
      proprietaire: "TEST ADMIN - NDJOMO Paul",
      surface_m2: 500.0,
      perimetre_m: 90.0,
      coordonnees_gps: [
        [11.6001, 3.992],
        [11.6002, 3.9921],
        [11.6003, 3.992],
        [11.6001, 3.992],
      ],
      localite: {
        type: "departement",
        valeur: "Mefou et Afamba",
      },
    };

    const createResponse = await axios.post(
      "http://localhost:3000/api/titres_fonciers",
      nouveauTitre,
      {
        headers: {
          Authorization: `Bearer ${tokenAdmin}`,
          "Content-Type": "application/json",
        },
        validateStatus: () => true,
      }
    );

    if (createResponse.status === 201) {
      console.log("✅ Titre créé avec ID:", createResponse.data.id);
    } else {
      console.log("❌ Erreur:", createResponse.status, createResponse.data);
    }

    // 4. Test avec utilisateur niveau 2
    console.log("\n🔐 4. Test avec utilisateur niveau 2...");
    const loginNiveau2 = await axios.post("http://localhost:3000/api/login", {
      email: "expert.geo@workflow.cm",
      mot_de_passe: "geotechnique2025",
    });

    const tokenNiveau2 = loginNiveau2.data.access_token;
    const userNiveau2 = loginNiveau2.data.user;
    console.log("✅ Utilisateur niveau 2 connecté:");
    console.log("   Localité:", JSON.stringify(userNiveau2.localite));

    // 5. Liste pour niveau 2
    console.log("\n📋 5. Liste pour niveau 2...");
    const niveau2List = await axios.get(
      "http://localhost:3000/api/titres_fonciers",
      {
        headers: { Authorization: `Bearer ${tokenNiveau2}` },
      }
    );

    console.log("📊 Résultat niveau 2:");
    console.log("   Nombre de titres:", niveau2List.data.titres.length);
    console.log("   Access info:", niveau2List.data.access_info);

    if (niveau2List.data.titres.length > 0) {
      console.log("🎉 Titres visibles pour niveau 2:");
      niveau2List.data.titres.forEach((titre, index) => {
        console.log(`   ${index + 1}. ID ${titre.id} - ${titre.proprietaire}`);
        console.log(`      Localité: ${JSON.stringify(titre.localite)}`);
      });
    } else {
      console.log("❌ Aucun titre visible pour niveau 2");
    }

  } catch (error) {
    console.error("❌ Erreur:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
  }
}

if (require.main === module) {
  testSimple();
}

module.exports = { testSimple };
