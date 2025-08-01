const axios = require("axios");

async function testLoginWithNewFields() {
  try {
    console.log("🔐 Test de login avec les nouveaux champs...\n");

    // Test avec l'utilisateur de niveau 1
    const userCredentials = {
      email: "reception.foncier@workflow.cm",
      mot_de_passe: "reception2025",
    };

    console.log(`📧 Email: ${userCredentials.email}`);
    console.log(`🔑 Mot de passe: ${userCredentials.mot_de_passe}\n`);

    // Tentative de connexion
    const response = await axios.post(
      "http://localhost:3000/api/login",
      {
        email: userCredentials.email,
        mot_de_passe: userCredentials.mot_de_passe,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    console.log("✅ CONNEXION RÉUSSIE !");
    console.log("=".repeat(70));

    const user = response.data.user;

    // Affichage des informations utilisateur complètes
    console.log("👤 INFORMATIONS UTILISATEUR:");
    console.log(`   🆔 ID: ${user.id}`);
    console.log(`   📧 Email: ${user.email}`);
    console.log(`   👤 Nom: ${user.prenom} ${user.nom}`);
    console.log(`   📊 Niveau hiérarchique: ${user.niveau_hierarchique}`);

    // NOUVEAUX CHAMPS AJOUTÉS
    console.log("\n🆕 NOUVEAUX CHAMPS:");
    console.log(`   📁 Projet ID: ${user.projet_id || "N/A"}`);
    console.log(`   📍 Localité ID: ${user.localite_id || "N/A"}`);

    if (user.localite) {
      console.log("   🗺️ Localité:");
      console.log(`      - Type: ${user.localite.type || "N/A"}`);
      console.log(`      - Valeur: ${user.localite.valeur || "N/A"}`);
    } else {
      console.log("   🗺️ Localité: Non définie");
    }

    // INFORMATIONS DU RÔLE
    console.log("\n👥 RÔLE:");
    if (user.role) {
      console.log(`   🆔 ID: ${user.role.id || "N/A"}`);
      console.log(`   📝 Nom: ${user.role.nom || "N/A"}`);
      console.log(
        `   📊 Niveau hiérarchique: ${user.role.niveau_hierarchique || "N/A"}`
      );
      console.log(`   📄 Description: ${user.role.description || "N/A"}`);
    } else {
      console.log("   ❌ Aucun rôle assigné");
    }

    // INFORMATIONS WORKFLOW
    console.log("\n🔄 WORKFLOW:");
    if (user.etape_courante) {
      console.log(`   📋 Étape courante: ${user.etape_courante.nom}`);
      console.log(`   📊 Ordre: ${user.etape_courante.ordre}`);
      console.log(`   🎯 Niveau étape: ${user.niveau_etape}`);
    } else {
      console.log("   📋 Aucune étape assignée");
    }

    // TOKEN D'AUTHENTIFICATION
    console.log("\n🔑 AUTHENTIFICATION:");
    console.log(
      `   🎫 Token: ${response.data.access_token ? "Généré" : "Manquant"}`
    );
    console.log(
      `   🔄 Refresh Token: ${
        response.data.refresh_token ? "Généré" : "Manquant"
      }`
    );

    console.log("\n=".repeat(70));
    console.log("🎯 RÉSUMÉ DES NOUVEAUX CHAMPS AJOUTÉS:");
    console.log(
      `✅ projet_id: ${user.projet_id !== undefined ? "Présent" : "Manquant"}`
    );
    console.log(
      `✅ localite_id: ${
        user.localite_id !== undefined ? "Présent" : "Manquant"
      }`
    );
    console.log(`✅ localite: ${user.localite ? "Présent" : "Manquant"}`);
    console.log(`✅ role (détaillé): ${user.role ? "Présent" : "Manquant"}`);

    // Test avec un autre utilisateur pour comparaison
    console.log("\n" + "=".repeat(70));
    console.log("🔄 Test avec un utilisateur de niveau supérieur...\n");

    const userLevel3 = {
      email: "dg.foncier@workflow.cm",
      mot_de_passe: "direction2025",
    };

    const response2 = await axios.post(
      "http://localhost:3000/api/login",
      {
        email: userLevel3.email,
        mot_de_passe: userLevel3.mot_de_passe,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const user2 = response2.data.user;
    console.log("👤 UTILISATEUR NIVEAU 3:");
    console.log(`   📧 Email: ${user2.email}`);
    console.log(`   📊 Niveau: ${user2.niveau_hierarchique}`);
    console.log(`   📁 Projet ID: ${user2.projet_id || "N/A"}`);
    console.log(`   👥 Rôle: ${user2.role?.nom || "N/A"}`);
    console.log(`   🗺️ Localité: ${user2.localite?.valeur || "N/A"}`);
  } catch (error) {
    console.error("\n❌ ERREUR DE CONNEXION");
    console.error("=".repeat(70));

    if (error.response) {
      console.error(`📊 Status HTTP: ${error.response.status}`);
      console.error(
        `📄 Message: ${error.response.data?.error || error.response.statusText}`
      );
    } else if (error.request) {
      console.error("🌐 Erreur de réseau - serveur non accessible");
    } else {
      console.error(`🐛 Erreur: ${error.message}`);
    }
  }
}

testLoginWithNewFields();
