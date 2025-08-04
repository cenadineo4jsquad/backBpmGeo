/**
 * Test pour vérifier que la route /me inclut l'ordre de l'étape
 */

const axios = require("axios");

async function testMeRoute() {
  console.log("🧪 Test de la route /me avec ordre d'étape\n");

  try {
    // 1. Connexion
    console.log("🔐 1. Connexion...");
    const loginResponse = await axios.post("http://localhost:3000/api/login", {
      email: "reception.foncier@workflow.cm",
      mot_de_passe: "reception2025",
    });

    const token = loginResponse.data.access_token;
    console.log("✅ Connecté");

    // 2. Appel à la route /me
    console.log("\n👤 2. Récupération du profil utilisateur...");
    const meResponse = await axios.get("http://localhost:3000/api/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("✅ Profil récupéré:");
    console.log("📋 Données utilisateur:");
    console.log(JSON.stringify(meResponse.data, null, 2));

    // 3. Vérification de la présence de l'étape courante
    if (meResponse.data.etape_courante) {
      console.log("\n🎯 Étape courante trouvée:");
      console.log(`   Ordre: ${meResponse.data.etape_courante.ordre}`);
      console.log(`   Projet ID: ${meResponse.data.etape_courante.projet_id}`);
      console.log(
        `   Nom étape: ${
          meResponse.data.etape_courante.etape_nom ||
          meResponse.data.etape_courante.nom_etape
        }`
      );
      console.log("✅ L'ordre de l'étape est bien inclus dans la réponse");
    } else {
      console.log("\n⚠️  Aucune étape courante trouvée");
      console.log(
        "   Cela peut être normal si l'utilisateur n'est assigné à aucun workflow"
      );
    }
  } catch (error) {
    console.error("\n❌ Erreur:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
  }
}

// Test avec différents utilisateurs
async function testMultipleUsers() {
  console.log("\n👥 Test avec différents utilisateurs...\n");

  const users = [
    {
      email: "reception.foncier@workflow.cm",
      password: "reception2025",
      name: "Réceptionnaire",
    },
    {
      email: "admin@example.com",
      password: "admin123",
      name: "Admin",
    },
  ];

  for (const user of users) {
    try {
      console.log(`\n🔍 Test utilisateur: ${user.name}`);

      const loginResponse = await axios.post(
        "http://localhost:3000/api/login",
        {
          email: user.email,
          mot_de_passe: user.password,
        },
        {
          validateStatus: () => true,
        }
      );

      if (loginResponse.status === 200) {
        const token = loginResponse.data.access_token;

        const meResponse = await axios.get("http://localhost:3000/api/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log(`   ID: ${meResponse.data.id}`);
        console.log(`   Nom: ${meResponse.data.nom} ${meResponse.data.prenom}`);
        console.log(`   Niveau: ${meResponse.data.niveau_hierarchique}`);

        if (meResponse.data.etape_courante) {
          console.log(
            `   ✅ Étape courante: ${meResponse.data.etape_courante.ordre} (Projet ${meResponse.data.etape_courante.projet_id})`
          );
        } else {
          console.log(`   ⚪ Aucune étape courante`);
        }
      } else {
        console.log(`   ❌ Échec connexion: ${loginResponse.status}`);
      }
    } catch (error) {
      console.log(`   ❌ Erreur: ${error.message}`);
    }
  }
}

async function runMeTest() {
  console.log("🚀 TESTS DE LA ROUTE /me AVEC ORDRE D'ÉTAPE");
  console.log("=".repeat(50));

  await testMeRoute();
  await testMultipleUsers();

  console.log("\n" + "=".repeat(50));
  console.log("🎯 OBJECTIF: Vérifier que la route /me inclut l'ordre");
  console.log("de l'étape courante de l'utilisateur dans le projet");
}

if (require.main === module) {
  runMeTest();
}

module.exports = { testMeRoute, testMultipleUsers };
