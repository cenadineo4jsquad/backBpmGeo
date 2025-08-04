const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

async function testUploadSansFlask() {
  console.log("🧪 Test de debug upload SANS service Flask...\n");

  try {
    // 1. Se connecter d'abord
    console.log("🔐 1. Connexion...");
    const loginResponse = await axios.post(
      "http://localhost:3000/api/auth/login",
      {
        nom_utilisateur: "claudine.belinga",
        mot_de_passe: "claudine123",
      }
    );

    const token = loginResponse.data.token;
    console.log("✅ Connecté :", loginResponse.data.nom_complet);

    // 2. Créer un fichier de test temporaire
    console.log("\n📄 2. Création fichier de test...");
    const testFilePath = path.join(__dirname, "test-file-debug.pdf");
    fs.writeFileSync(testFilePath, "Contenu de test pour debug PDF");

    // 3. Préparer FormData
    console.log("\n📤 3. Préparation FormData...");
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

    console.log("✅ Fichier ajouté");
    console.log("✅ projet_id ajouté: 22");
    console.log(
      '✅ localite ajoutée: {"type":"arrondissement","valeur":"Soa"}'
    );

    // 4. Vérifier les headers
    console.log("\n🔍 Headers FormData:");
    console.log(JSON.stringify(formData.getHeaders(), null, 2));

    // 5. Modifier temporairement le controller pour éviter l'appel Flask
    console.log("\n⚙️ 5. Modification temporaire du controller...");

    // On va d'abord regarder le controller actuel
    const controllerPath = "src/controllers/extraction.controller.ts";

    // 6. Faire l'upload
    console.log("\n🚀 6. Upload vers API...");

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
      }
    );

    console.log("✅ SUCCÈS:");
    console.log("Status:", uploadResponse.status);
    console.log("Data:", JSON.stringify(uploadResponse.data, null, 2));
  } catch (error) {
    console.log("❌ ERREUR:");
    console.log("Status:", error.response?.status);
    console.log("Data:", error.response?.data);

    if (error.code === "ETIMEDOUT" || error.message.includes("ETIMEDOUT")) {
      console.log("\n💡 SOLUTION: Le service Flask n'est pas accessible.");
      console.log(
        "Pour tester l'upload sans Flask, nous devons modifier temporairement le controller."
      );
    }
  } finally {
    // Nettoyer
    console.log("🧹 Fichier nettoyé");
    try {
      fs.unlinkSync(path.join(__dirname, "test-file-debug.pdf"));
    } catch (e) {
      // Ignore
    }
  }
}

// Fonction pour créer un mock du service Flask
async function createFlaskMock() {
  console.log("\n🔧 Création d'un mock temporaire du service Flask...");

  const mockServicePath = "src/services/extraction.service.mock.ts";
  const mockContent = `import { Logger } from 'pino';

export class MockExtractionService {
  constructor(private logger: Logger) {}

  async uploadExtractionToFlask(filePath: string, userId: number, metadata: any): Promise<any> {
    this.logger.info('[MOCK] Simulation extraction Flask');
    
    // Simuler un traitement
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      extractionId: 'mock-' + Date.now(),
      fileName: filePath.split('/').pop(),
      metadata,
      message: 'Extraction simulée avec succès (MOCK)'
    };
  }
}
`;

  return { mockServicePath, mockContent };
}

if (require.main === module) {
  testUploadSansFlask();
}

module.exports = { testUploadSansFlask, createFlaskMock };
