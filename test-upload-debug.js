const FormData = require("form-data");
const fs = require("fs");
const axios = require("axios");

async function testUploadDebug() {
  try {
    console.log("🧪 Test de debug upload avec logs détaillés...\n");

    // 1. Connexion
    console.log("🔐 1. Connexion...");
    const loginResponse = await axios.post("http://localhost:3000/api/login", {
      email: "reception.foncier@workflow.cm",
      mot_de_passe: "reception2025",
    });

    const token = loginResponse.data.access_token;
    const user = loginResponse.data.user;
    console.log(`✅ Connecté : ${user.prenom} ${user.nom}`);

    // 2. Créer un fichier de test
    console.log("\n📄 2. Création fichier de test...");
    const testImageContent = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
      "base64"
    );
    fs.writeFileSync("./debug-test.png", testImageContent);

    // 3. Préparer FormData avec logs détaillés
    console.log("\n📤 3. Préparation FormData...");
    const formData = new FormData();

    // Ajouter le fichier
    formData.append("file", fs.createReadStream("./debug-test.png"), {
      filename: "debug-test.png",
      contentType: "image/png",
    });
    console.log("✅ Fichier ajouté");

    // Ajouter projet_id
    formData.append("projet_id", "22");
    console.log("✅ projet_id ajouté: 22");

    // Ajouter localite
    const localiteStr = JSON.stringify({
      type: "arrondissement",
      valeur: "Soa",
    });
    formData.append("localite", localiteStr);
    console.log("✅ localite ajoutée:", localiteStr);

    // Vérifier le contenu du FormData
    console.log("\n🔍 Headers FormData:");
    console.log(formData.getHeaders());

    // 4. Upload avec logs détaillés
    console.log("\n🚀 4. Upload vers API...");
    const response = await axios.post(
      "http://localhost:3000/api/extraction/upload?projet_id=22",
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          ...formData.getHeaders(),
        },
        timeout: 30000,
      }
    );

    console.log("✅ Upload réussi !");
    console.log("Réponse:", response.data);
  } catch (error) {
    console.error("\n❌ ERREUR:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else {
      console.error("Message:", error.message);
    }
  } finally {
    // Nettoyage
    try {
      if (fs.existsSync("./debug-test.png")) {
        fs.unlinkSync("./debug-test.png");
        console.log("🧹 Fichier nettoyé");
      }
    } catch (e) {
      console.log("⚠️ Erreur nettoyage:", e.message);
    }
  }
}

testUploadDebug();
