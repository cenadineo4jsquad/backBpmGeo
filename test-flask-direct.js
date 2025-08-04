/**
 * Test direct du service Flask pour vérifier qu'il reçoit bien les données
 */

const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

async function testFlaskDirectly() {
  console.log("🧪 Test direct du service Flask sur 10.100.213.195:5000\n");

  // Créer un fichier de test temporaire
  const testFilePath = path.join(__dirname, "test-flask.pdf");

  try {
    console.log("📄 Création d'un fichier de test...");
    fs.writeFileSync(testFilePath, "Contenu de test pour Flask");

    // Préparer FormData comme le fait le backend
    console.log("📤 Préparation de la requête multipart...");
    const formData = new FormData();
    formData.append("file", fs.createReadStream(testFilePath), {
      filename: "test-flask.pdf",
      contentType: "application/pdf",
    });

    console.log("🚀 Envoi vers Flask...");

    const response = await axios.post(
      "http://10.100.213.195:5000/api/process",
      formData,
      {
        headers: formData.getHeaders(),
        timeout: 30000,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      }
    );

    console.log("✅ SUCCÈS Flask répond !");
    console.log(`Status: ${response.status}`);
    console.log("Response:", JSON.stringify(response.data, null, 2));
  } catch (error) {
    if (error.response) {
      console.log("⚠️  Flask répond avec une erreur :");
      console.log(`Status: ${error.response.status}`);
      console.log(`Data:`, error.response.data);

      if (error.response.status === 400) {
        console.log(
          "\n💡 Erreur 400 = Flask reçoit la requête mais le format n'est pas celui attendu"
        );
      } else if (error.response.status === 422) {
        console.log(
          "\n💡 Erreur 422 = Flask reçoit mais les données ne sont pas valides"
        );
      }
    } else if (error.code === "ETIMEDOUT") {
      console.log("❌ Timeout - Flask ne répond pas dans les 30 secondes");
    } else if (error.code === "ECONNREFUSED") {
      console.log("❌ Connexion refusée - Flask n'est pas démarré");
    } else {
      console.log("❌ Erreur réseau:", error.message);
    }
  } finally {
    // Nettoyage du fichier temporaire
    try {
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    } catch (e) {
      // Ignore les erreurs de nettoyage
    }
  }

  console.log("\n📊 Conclusion:");
  console.log("Si vous voyez une erreur 400/422, Flask REÇOIT vos données !");
  console.log(
    "Le problème vient du format attendu par Flask, pas de la connectivité."
  );
}

async function testBackendToFlaskTimeout() {
  console.log("\n🔍 Analyse du timeout backend -> Flask:");
  console.log("=====================================");

  console.log("D'après vos logs précédents:");
  console.log("- ✅ Middleware restrictToFirstUser: FONCTIONNE");
  console.log("- ✅ Parsing FormData: FONCTIONNE");
  console.log(
    "- ✅ Connectivité réseau: FONCTIONNE (Test-NetConnection réussi)"
  );
  console.log("- ❌ Timeout Flask: 21+ secondes");

  console.log("\n💡 Causes possibles du timeout:");
  console.log("1. Flask traite le fichier mais c'est très lent (>21s)");
  console.log("2. Flask attend un format de données spécifique");
  console.log("3. Flask a un bug et ne répond jamais");
  console.log("4. Le backend n'envoie pas les bonnes données à Flask");

  console.log("\n🎯 Solutions recommandées:");
  console.log("1. Vérifier les logs de Flask directement");
  console.log("2. Augmenter le timeout du backend");
  console.log("3. Créer un mock Flask pour tester le backend isolément");
}

async function runFlaskTests() {
  await testFlaskDirectly();
  await testBackendToFlaskTimeout();
}

if (require.main === module) {
  runFlaskTests();
}

module.exports = { testFlaskDirectly };
