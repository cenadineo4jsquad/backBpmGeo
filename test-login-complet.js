const axios = require("axios");

async function testLoginWithFullInfo() {
  try {
    console.log("🔐 Test de connexion avec informations complètes...\n");

    // Utilisateur de test
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

    // Affichage des informations utilisateur
    console.log("👤 INFORMATIONS UTILISATEUR COMPLÈTES:");
    console.log(`   🆔 ID: ${user.id}`);
    console.log(`   👤 Nom: ${user.prenom} ${user.nom}`);
    console.log(`   📧 Email: ${user.email}`);
    console.log(`   📊 Niveau hiérarchique: ${user.niveau_hierarchique}`);

    // Projet
    console.log("\n📁 PROJET:");
    if (user.projet_id) {
      console.log(`   🆔 Projet ID: ${user.projet_id}`);
    } else {
      console.log("   ⚠️ Aucun projet assigné");
    }

    // Localité
    console.log("\n📍 LOCALITÉ:");
    console.log(`   🆔 Localité ID: ${user.localite_id || "Non définie"}`);
    if (user.localite) {
      console.log(`   🏠 Type: ${user.localite.type || "Non défini"}`);
      console.log(`   📍 Valeur: ${user.localite.valeur || "Non définie"}`);
    } else {
      console.log("   ⚠️ Informations de localité non disponibles");
    }

    // Rôle
    console.log("\n👥 RÔLE:");
    if (user.role && user.role.nom) {
      console.log(`   🆔 Rôle ID: ${user.role.id}`);
      console.log(`   📝 Nom: ${user.role.nom}`);
      console.log(`   📊 Niveau: ${user.role.niveau_hierarchique}`);
      console.log(
        `   📄 Description: ${user.role.description || "Non définie"}`
      );
    } else {
      console.log("   ⚠️ Aucun rôle assigné");
    }

    // Étape courante
    console.log("\n🔄 WORKFLOW:");
    if (user.etape_courante) {
      console.log(`   📋 Étape: ${user.etape_courante.nom}`);
      console.log(`   🔢 Ordre: ${user.etape_courante.ordre}`);
      console.log(`   📊 Niveau étape: ${user.niveau_etape}`);
    } else {
      console.log("   ⚠️ Aucune étape de workflow assignée");
    }

    // Token
    console.log("\n🔑 AUTHENTIFICATION:");
    console.log(
      `   🎫 Access Token: ${response.data.access_token.substring(0, 50)}...`
    );
    console.log(
      `   🔄 Refresh Token: ${
        response.data.refresh_token ? "Fourni" : "Non fourni"
      }`
    );

    console.log("\n✅ TOUTES LES INFORMATIONS RÉCUPÉRÉES AVEC SUCCÈS !");

    return {
      success: true,
      user: user,
      token: response.data.access_token,
    };
  } catch (error) {
    console.error("\n❌ ERREUR DE CONNEXION");
    console.error("=".repeat(70));

    if (error.response) {
      console.error(`📊 Status HTTP: ${error.response.status}`);
      console.error(
        `📄 Message: ${
          error.response.data?.message || error.response.statusText
        }`
      );
      console.error(
        `🔍 Détails: ${JSON.stringify(error.response.data, null, 2)}`
      );
    } else if (error.request) {
      console.error("🌐 Erreur de réseau - serveur non accessible");
      console.error(
        "   Vérifiez que le backend est démarré sur http://localhost:3000"
      );
    } else {
      console.error(`🐛 Erreur: ${error.message}`);
    }

    return {
      success: false,
      error: error.message,
    };
  }
}

// Test avec plusieurs utilisateurs
async function testMultipleUsers() {
  const users = [
    { email: "reception.foncier@workflow.cm", password: "reception2025" },
    { email: "expert.geo@workflow.cm", password: "geotechnique2025" },
    { email: "juriste.expert@workflow.cm", password: "juridique2025" },
    { email: "dg.foncier@workflow.cm", password: "direction2025" },
  ];

  console.log("🧪 TEST MULTIPLE UTILISATEURS");
  console.log("=".repeat(50));

  for (let i = 0; i < users.length; i++) {
    console.log(`\n${i + 1}. Test utilisateur: ${users[i].email}`);
    console.log("-".repeat(40));

    try {
      const response = await axios.post("http://localhost:3000/api/login", {
        email: users[i].email,
        mot_de_passe: users[i].password,
      });

      const user = response.data.user;
      console.log(`   ✅ Connexion: Succès`);
      console.log(`   👤 Nom: ${user.prenom} ${user.nom}`);
      console.log(`   📊 Niveau: ${user.niveau_hierarchique}`);
      console.log(`   📁 Projet: ${user.projet_id || "Non assigné"}`);
      console.log(`   📍 Localité: ${user.localite_id || "Non définie"}`);
      console.log(`   👥 Rôle: ${user.role?.nom || "Non assigné"}`);
    } catch (error) {
      console.log(
        `   ❌ Connexion: Échec - ${
          error.response?.data?.error || error.message
        }`
      );
    }
  }
}

// Exécution des tests
async function runTests() {
  await testLoginWithFullInfo();
  console.log("\n" + "=".repeat(80) + "\n");
  await testMultipleUsers();
}

runTests();
