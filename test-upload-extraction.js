const FormData = require("form-data");
const fs = require("fs");
const axios = require("axios");

async function testUploadExtraction() {
  try {
    console.log("🧪 Test de l'upload d'extraction...\n");

    // 1. D'abord, se connecter pour obtenir un token
    console.log("🔐 1. Connexion pour obtenir le token...");
    const loginResponse = await axios.post("http://localhost:3000/api/login", {
      email: "reception.foncier@workflow.cm",
      mot_de_passe: "reception2025",
    });

    const token = loginResponse.data.access_token;
    const user = loginResponse.data.user;

    console.log(`✅ Connexion réussie pour ${user.prenom} ${user.nom}`);
    console.log(`   📧 Email: ${user.email}`);
    console.log(`   🆔 ID: ${user.id}`);
    console.log(`   👥 Rôle: ${user.role.nom}`);
    console.log(`   📁 Projet ID: ${user.projet_id}`);
    console.log(`   📍 Localité ID: ${user.localite_id}`);
    console.log(`   🔑 Token: ${token.substring(0, 30)}...`);

    // 2. Créer un fichier de test simple
    console.log("\n📄 2. Création d'un fichier de test...");
    const testImageContent = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
      "base64"
    );
    const testFilePath = "./test-document.png";
    fs.writeFileSync(testFilePath, testImageContent);
    console.log(`✅ Fichier de test créé: ${testFilePath}`);

    // 3. Préparer le FormData pour l'upload
    console.log("\n📤 3. Préparation de l'upload...");
    const formData = new FormData();
    formData.append("file", fs.createReadStream(testFilePath), {
      filename: "test-document.png",
      contentType: "image/png",
    });
    formData.append("projet_id", user.projet_id || "22");
    formData.append(
      "localite",
      JSON.stringify({
        type: user.localite?.type || "arrondissement",
        valeur: user.localite?.valeur || "Soa",
      })
    );

    console.log("📋 Données à envoyer:");
    console.log(`   📁 Projet ID: ${user.projet_id || "22"}`);
    console.log(
      `   📍 Localité: ${JSON.stringify({
        type: user.localite?.type || "arrondissement",
        valeur: user.localite?.valeur || "Soa",
      })}`
    );
    console.log(
      `   📄 Fichier: test-document.png (${testImageContent.length} bytes)`
    );

    // 4. Effectuer l'upload (avec projet_id dans l'URL)
    console.log("\n🚀 4. Upload vers l'API...");
    const uploadResponse = await axios.post(
      `http://localhost:3000/api/extraction/upload?projet_id=${user.projet_id || "22"}`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          ...formData.getHeaders(),
        },
        timeout: 30000, // 30 secondes
      }
    );

    console.log("\n✅ UPLOAD RÉUSSI !");
    console.log("=".repeat(60));
    console.log("📊 Réponse de l'API:");
    console.log(`   🆔 ID Extraction: ${uploadResponse.data.id}`);
    console.log(`   📁 Projet ID: ${uploadResponse.data.projet_id}`);
    console.log(`   👤 Utilisateur ID: ${uploadResponse.data.utilisateur_id}`);
    console.log(`   📄 Fichier: ${uploadResponse.data.fichier}`);
    console.log(`   📊 Statut: ${uploadResponse.data.statut}`);
    console.log(
      `   🎯 Seuil de confiance: ${uploadResponse.data.seuil_confiance}%`
    );
    console.log(
      `   📅 Date extraction: ${uploadResponse.data.date_extraction}`
    );
    console.log(`   🔄 Workflow ID: ${uploadResponse.data.workflow_id}`);

    if (uploadResponse.data.donnees_extraites) {
      console.log(
        `   📋 Données extraites:`,
        JSON.stringify(uploadResponse.data.donnees_extraites, null, 2)
      );
    }

    // 5. Nettoyer le fichier de test
    console.log("\n🧹 5. Nettoyage...");
    fs.unlinkSync(testFilePath);
    console.log("✅ Fichier de test supprimé");

    return uploadResponse.data;
  } catch (error) {
    console.error("\n❌ ERREUR LORS DU TEST");
    console.error("=".repeat(60));

    if (error.response) {
      console.error(`📊 Status HTTP: ${error.response.status}`);
      console.error(
        `📄 Message: ${error.response.data?.error || error.response.statusText}`
      );
      console.error(
        `🔍 Détails:`,
        JSON.stringify(error.response.data, null, 2)
      );
    } else if (error.request) {
      console.error("🌐 Erreur de réseau - serveur non accessible");
      console.error(
        "   Vérifiez que le backend est démarré sur http://localhost:3000"
      );
    } else {
      console.error(`🐛 Erreur: ${error.message}`);
    }

    // Nettoyer le fichier de test en cas d'erreur
    try {
      if (fs.existsSync("./test-document.png")) {
        fs.unlinkSync("./test-document.png");
        console.log("✅ Fichier de test nettoyé");
      }
    } catch (cleanupError) {
      console.error("⚠️ Erreur lors du nettoyage:", cleanupError.message);
    }

    throw error;
  }
}

// Test avec gestion d'erreur
testUploadExtraction()
  .then((result) => {
    console.log("\n🎉 TEST TERMINÉ AVEC SUCCÈS !");
    console.log("🆔 ID de l'extraction créée:", result.id);
  })
  .catch((error) => {
    console.log("\n💥 TEST ÉCHOUÉ !");
    process.exit(1);
  });
