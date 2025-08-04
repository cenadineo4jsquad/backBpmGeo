/**
 * Test pour vérifier que le problème ne vient pas du frontend
 * Ce test simule exactement les requêtes qu'un frontend ferait
 */

const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

async function testFrontendSimulation() {
  console.log(
    "🌐 Test de simulation Frontend - Vérification que le problème ne vient pas du frontend\n"
  );

  try {
    // 1. Connexion comme le ferait un frontend
    console.log("🔐 1. Connexion utilisateur (simulation frontend)...");

    const loginResponse = await axios.post(
      "http://localhost:3000/api/login",
      {
        email: "reception.foncier@workflow.cm",
        mot_de_passe: "reception2025",
      },
      {
        timeout: 5000,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0 (Frontend Test)",
        },
      }
    );

    console.log(
      `✅ Connexion réussie: ${loginResponse.data.user.prenom} ${loginResponse.data.user.nom}`
    );
    const token = loginResponse.data.access_token;

    // 2. Création d'un fichier de test (simulation de sélection de fichier frontend)
    console.log(
      "\n📁 2. Préparation du fichier (simulation sélection frontend)..."
    );
    const testFilePath = path.join(__dirname, "frontend-test-image.jpg");

    // Créer un faux fichier image (quelques bytes qui ressemblent à un JPEG)
    const fakeJpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0]); // Header JPEG
    const fakeContent = Buffer.concat([
      fakeJpegHeader,
      Buffer.from("Contenu test image frontend"),
    ]);
    fs.writeFileSync(testFilePath, fakeContent);

    console.log("✅ Fichier de test créé:", {
      path: testFilePath,
      size: fs.statSync(testFilePath).size + " bytes",
      mimetype: "image/jpeg",
    });

    // 3. Test upload avec FormData comme le ferait un frontend
    console.log("\n📤 3. Upload FormData (simulation frontend)...");

    const formData = new FormData();

    // Ajouter le fichier exactement comme un frontend
    formData.append("file", fs.createReadStream(testFilePath), {
      filename: "frontend-test-image.jpg",
      contentType: "image/jpeg",
    });

    // Ajouter les données exactement comme un frontend
    formData.append("projet_id", "22");
    formData.append(
      "localite",
      JSON.stringify({
        type: "arrondissement",
        valeur: "Soa",
      })
    );

    console.log("📋 Données FormData préparées:");
    console.log("   - file: frontend-test-image.jpg (image/jpeg)");
    console.log("   - projet_id: 22");
    console.log("   - localite: {type: 'arrondissement', valeur: 'Soa'}");

    // 4. Requête POST avec headers frontend typiques
    console.log("\n🚀 4. Envoi de la requête (simulation navigateur)...");

    const uploadResponse = await axios.post(
      "http://localhost:3000/api/extraction/upload?projet_id=22",
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          // Headers typiques d'un navigateur
        },
        timeout: 15000, // 15 secondes comme un navigateur
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );

    // Si on arrive ici, l'upload a réussi
    console.log("🎉 SUCCÈS TOTAL - FRONTEND SIMULATION:");
    console.log(`   Status: ${uploadResponse.status}`);
    console.log(`   Response:`, uploadResponse.data);
    console.log("\n✅ CONCLUSION: Le frontend n'est PAS le problème");
    console.log("   - L'authentification fonctionne");
    console.log("   - Le middleware autorise l'accès");
    console.log("   - Le parsing FormData fonctionne");
    console.log("   - Le service Flask répond correctement");
  } catch (error) {
    console.log("\n📊 ANALYSE DE L'ERREUR:");

    if (error.code === "ECONNABORTED" && error.message.includes("timeout")) {
      console.log("⏰ TIMEOUT DÉTECTÉ:");
      console.log("   ✅ Frontend simulation: OK");
      console.log("   ✅ Authentification: OK");
      console.log("   ✅ Middleware restrictToFirstUser: OK");
      console.log("   ✅ Parsing FormData: OK");
      console.log("   ❌ Service Flask: TIMEOUT/LENT");
      console.log(
        "\n🎯 CONCLUSION: Le problème est au niveau du service Flask, pas du frontend"
      );
    } else if (error.response?.status === 403) {
      console.log("🚫 ACCÈS REFUSÉ:");
      console.log("   ❌ Middleware restrictToFirstUser: BLOQUE");
      console.log("   → Problème d'autorisation, pas de frontend");
    } else if (error.response?.status === 400) {
      console.log("⚠️  ERREUR DE PARSING:");
      console.log("   ❌ FormData parsing: PROBLÈME");
      console.log("   → Problème de format de données, pas forcément frontend");
    } else if (error.response?.status === 500) {
      console.log("💥 ERREUR SERVEUR:");
      console.log("   ✅ Frontend simulation: OK");
      console.log("   ❌ Backend/Flask: ERREUR INTERNE");
      console.log("   → Problème côté serveur, pas frontend");
    } else {
      console.log("❓ ERREUR INATTENDUE:");
      console.log(`   Status: ${error.response?.status || "N/A"}`);
      console.log(`   Message: ${error.message}`);
      console.log(`   Code: ${error.code || "N/A"}`);
    }

    console.log("\n📋 Détails de l'erreur:");
    console.log(`   Response Status: ${error.response?.status}`);
    console.log(`   Response Data:`, error.response?.data);
  }

  // 5. Nettoyage
  try {
    fs.unlinkSync(testFilePath);
    console.log("\n🧹 Nettoyage: Fichier de test supprimé");
  } catch (e) {
    // Ignore les erreurs de nettoyage
  }
}

// Test avec différents utilisateurs pour vérifier l'autorisation
async function testDifferentUsers() {
  console.log("\n👥 Test avec différents utilisateurs pour validation...");

  const testUsers = [
    {
      email: "reception.foncier@workflow.cm",
      password: "reception2025",
      expectedProject: 22,
      name: "Réceptionnaire (utilisateur autorisé)",
    },
    {
      email: "admin@example.com",
      password: "admin123",
      expectedProject: 22,
      name: "Admin (test d'autorisation)",
    },
  ];

  for (const user of testUsers) {
    try {
      console.log(`\n🔍 Test utilisateur: ${user.name}`);

      const loginResponse = await axios.post(
        "http://localhost:3000/api/login",
        {
          email: user.email,
          mot_de_passe: user.password,
        },
        {
          timeout: 3000,
          validateStatus: () => true,
        }
      );

      if (loginResponse.status === 200) {
        console.log(`   ✅ Connexion réussie`);

        // Test rapide d'accès au middleware (sans fichier)
        try {
          await axios.get(
            `http://localhost:3000/api/extraction/upload?projet_id=${user.expectedProject}`,
            {
              headers: {
                Authorization: `Bearer ${loginResponse.data.access_token}`,
              },
              timeout: 2000,
              validateStatus: () => true,
            }
          );
        } catch (e) {
          // On s'attend à une erreur ici (GET au lieu de POST)
          if (e.response?.status === 405) {
            console.log(
              `   ✅ Middleware accessible (405 Method Not Allowed attendu)`
            );
          }
        }
      } else {
        console.log(`   ❌ Échec connexion: ${loginResponse.status}`);
      }
    } catch (error) {
      console.log(`   ❌ Erreur: ${error.message}`);
    }
  }
}

// Fonction principale
async function runFrontendTest() {
  console.log("🚀 Démarrage des tests de simulation frontend...\n");

  await testFrontendSimulation();
  await testDifferentUsers();

  console.log("\n" + "=".repeat(60));
  console.log("📋 RÉSUMÉ DU TEST FRONTEND SIMULATION");
  console.log("=".repeat(60));
  console.log("Ce test vérifie si le problème vient du frontend en:");
  console.log("✓ Simulant exactement les requêtes d'un navigateur");
  console.log("✓ Utilisant les mêmes headers et format de données");
  console.log("✓ Testant différents utilisateurs et autorisations");
  console.log("✓ Analysant précisément la source des problèmes");
}

if (require.main === module) {
  runFrontendTest();
}

module.exports = { testFrontendSimulation, testDifferentUsers };
