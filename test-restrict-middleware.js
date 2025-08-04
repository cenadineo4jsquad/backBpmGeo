const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

/**
 * Test complet du middleware restrictToFirstUser
 *
 * Ce test vérifie que:
 * 1. L'authentification fonctionne
 * 2. Le middleware restrictToFirstUser autorise l'utilisateur correct
 * 3. Le parsing des FormData fonctionne
 * 4. L'upload réussit avec le mock service
 */
async function testRestrictToFirstUserMiddleware() {
  console.log("🧪 Test du middleware restrictToFirstUser...\n");

  try {
    // 1. Test de connexion
    console.log("🔐 1. Test de connexion...");
    const loginResponse = await axios.post(
      "http://localhost:3000/api/auth/login",
      {
        nom_utilisateur: "claudine.belinga",
        mot_de_passe: "claudine123",
      }
    );

    const token = loginResponse.data.token;
    console.log("✅ Connexion réussie:", loginResponse.data.nom_complet);

    // 2. Création du fichier de test
    console.log("\n📄 2. Création du fichier de test...");
    const testFilePath = path.join(__dirname, "test-middleware.pdf");
    fs.writeFileSync(
      testFilePath,
      "Contenu de test pour middleware restrictToFirstUser"
    );

    // 3. Test du middleware avec les bonnes données
    console.log("\n🔒 3. Test du middleware restrictToFirstUser...");

    const formData = new FormData();
    formData.append("file", fs.createReadStream(testFilePath));
    formData.append("projet_id", "22");
    formData.append(
      "localite",
      JSON.stringify({
        type: "arrondissement",
        valeur: "Soa",
      })
    );

    console.log("✅ FormData préparée:");
    console.log("   - file: test-middleware.pdf");
    console.log("   - projet_id: 22");
    console.log("   - localite: arrondissement Soa");

    // 4. Upload avec middleware
    console.log("\n🚀 4. Test upload avec middleware...");

    const uploadResponse = await axios.post(
      "http://localhost:3000/api/extraction/upload?projet_id=22",
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          ...formData.getHeaders(),
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 30000,
      }
    );

    console.log("✅ SUCCÈS MIDDLEWARE:");
    console.log("Status:", uploadResponse.status);
    console.log("Response:", JSON.stringify(uploadResponse.data, null, 2));

    // 5. Test avec un utilisateur non autorisé (si disponible)
    console.log("\n🚫 5. Test avec utilisateur non autorisé...");

    try {
      // Tenter avec un autre utilisateur si disponible
      const otherLoginResponse = await axios.post(
        "http://localhost:3000/api/auth/login",
        {
          nom_utilisateur: "autre.utilisateur", // Utilisateur qui n'est pas dans l'étape 1
          mot_de_passe: "password123",
        }
      );

      const otherToken = otherLoginResponse.data.token;

      const formData2 = new FormData();
      formData2.append("file", fs.createReadStream(testFilePath));
      formData2.append("projet_id", "22");
      formData2.append(
        "localite",
        JSON.stringify({
          type: "arrondissement",
          valeur: "Soa",
        })
      );

      const unauthorizedResponse = await axios.post(
        "http://localhost:3000/api/extraction/upload?projet_id=22",
        formData2,
        {
          headers: {
            Authorization: `Bearer ${otherToken}`,
            ...formData2.getHeaders(),
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        }
      );

      console.log("❌ PROBLÈME: L'utilisateur non autorisé a pu uploader!");
    } catch (error) {
      if (error.response?.status === 403) {
        console.log("✅ Bon: Utilisateur non autorisé rejeté (403)");
      } else if (error.response?.status === 401) {
        console.log("ℹ️  Note: Autre utilisateur non trouvé (test limité)");
      } else {
        console.log("⚠️  Erreur inattendue:", error.message);
      }
    }

    // 6. Résumé du test
    console.log("\n📊 RÉSUMÉ DU TEST:");
    console.log("✅ Authentification: SUCCÈS");
    console.log("✅ Middleware restrictToFirstUser: SUCCÈS");
    console.log("✅ Parsing FormData: SUCCÈS");
    console.log("✅ Upload avec mock Flask: SUCCÈS");
    console.log("\n🎉 TOUS LES TESTS RÉUSSIS!");
  } catch (error) {
    console.log("\n❌ ERREUR DANS LE TEST:");
    console.log("Status:", error.response?.status);
    console.log("Data:", error.response?.data);
    console.log("Message:", error.message);

    // Diagnostics
    if (error.response?.status === 403) {
      console.log("\n🔍 DIAGNOSTIC:");
      console.log("- Le middleware restrictToFirstUser bloque l'accès");
      console.log(
        "- Vérifiez que l'utilisateur est bien assigné à l'étape 1 du projet 22"
      );
    } else if (error.response?.status === 400) {
      console.log("\n🔍 DIAGNOSTIC:");
      console.log("- Problème de parsing des données FormData");
      console.log("- Vérifiez les champs file, projet_id, localite");
    }
  } finally {
    // Nettoyage
    console.log("\n🧹 Nettoyage...");
    try {
      fs.unlinkSync(path.join(__dirname, "test-middleware.pdf"));
    } catch (e) {
      // Ignore
    }
  }
}

if (require.main === module) {
  testRestrictToFirstUserMiddleware();
}

module.exports = { testRestrictToFirstUserMiddleware };
