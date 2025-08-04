const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

/**
 * Test spécifique du middleware restrictToFirstUser
 *
 * Ce test vérifie UNIQUEMENT le middleware sans dépendre du service Flask
 */
async function testRestrictToFirstUserOnly() {
  console.log("🧪 Test du middleware restrictToFirstUser (sans Flask)...\n");

  try {
    // 1. Test de connexion avec l'utilisateur autorisé
    console.log(
      "🔐 1. Connexion avec utilisateur autorisé (Claudine Belinga)..."
    );
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
    const testFilePath = path.join(__dirname, "test-middleware-only.pdf");
    fs.writeFileSync(
      testFilePath,
      "Contenu de test pour middleware restrictToFirstUser"
    );

    // 3. Test du middleware avec FormData - on s'attend à ce que ça passe le middleware mais échoue sur Flask
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
    console.log("   - file: test-middleware-only.pdf");
    console.log("   - projet_id: 22");
    console.log("   - localite: arrondissement Soa");

    // 4. Test avec middleware - on attend une erreur Flask mais PAS une erreur de middleware
    console.log(
      "\n🚀 4. Test upload (middleware doit passer, Flask va échouer)..."
    );

    try {
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

      console.log("🎉 SUCCÈS COMPLET (inattendu):");
      console.log("Status:", uploadResponse.status);
      console.log("Response:", JSON.stringify(uploadResponse.data, null, 2));
    } catch (error) {
      // Analyser le type d'erreur
      if (error.response?.status === 403) {
        console.log("❌ MIDDLEWARE RESTREINT L'ACCÈS:");
        console.log("Status:", error.response.status);
        console.log("Data:", error.response.data);
        console.log("\n🔍 DIAGNOSTIC:");
        console.log("- Le middleware restrictToFirstUser bloque l'accès");
        console.log(
          "- L'utilisateur n'est peut-être pas assigné à l'étape 1 du projet 22"
        );
        console.log("- Ou il y a un problème dans la logique du middleware");
      } else if (
        error.response?.status === 500 &&
        error.response?.data?.error === "Erreur serveur"
      ) {
        console.log("✅ MIDDLEWARE AUTORISÉ, ERREUR FLASK (attendue):");
        console.log("Status:", error.response.status);
        console.log("Data:", error.response.data);
        console.log("\n🎉 SUCCÈS DU TEST:");
        console.log(
          "- ✅ Le middleware restrictToFirstUser a autorisé l'accès"
        );
        console.log("- ✅ L'authentification fonctionne");
        console.log("- ✅ Le parsing des FormData fonctionne");
        console.log(
          "- ❌ Le service Flask n'est pas accessible (normal en test)"
        );
      } else if (error.response?.status === 400) {
        console.log("⚠️  ERREUR DE PARSING:");
        console.log("Status:", error.response.status);
        console.log("Data:", error.response.data);
        console.log("\n🔍 DIAGNOSTIC:");
        console.log("- Problème de parsing des données FormData");
        console.log("- Vérifiez les champs file, projet_id, localite");
      } else {
        console.log("❓ ERREUR INATTENDUE:");
        console.log("Status:", error.response?.status);
        console.log("Data:", error.response?.data);
        console.log("Message:", error.message);
      }
    }

    // 5. Résumé basé sur les résultats
    console.log("\n📊 RÉSUMÉ DU TEST MIDDLEWARE:");
    console.log("✅ Authentification: SUCCÈS");
    console.log("✅ FormData préparation: SUCCÈS");
    console.log("? Middleware restrictToFirstUser: À ANALYSER SELON LES LOGS");
  } catch (error) {
    console.log("\n❌ ERREUR GÉNÉRALE DANS LE TEST:");
    console.log("Status:", error.response?.status);
    console.log("Data:", error.response?.data);
    console.log("Message:", error.message);
  } finally {
    // Nettoyage
    console.log("\n🧹 Nettoyage...");
    try {
      fs.unlinkSync(path.join(__dirname, "test-middleware-only.pdf"));
    } catch (e) {
      // Ignore
    }
  }
}

if (require.main === module) {
  testRestrictToFirstUserOnly();
}

module.exports = { testRestrictToFirstUserOnly };
