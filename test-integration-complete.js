/**
 * Test intégration complète : Middleware + Upload + Flask
 */

const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

async function testCompleteIntegration() {
  console.log("🧪 TEST INTÉGRATION COMPLÈTE");
  console.log("============================\n");

  try {
    console.log("🔐 1. Connexion utilisateur 44...");
    const loginResponse = await axios.post(
      "http://localhost:3000/api/auth/login",
      {
        email: "user44@example.com",
        password: "password123",
      }
    );

    const token = loginResponse.data.token;
    console.log("✅ Connexion réussie !");

    console.log("\n📄 2. Création d'un fichier PDF de test...");
    const testPdfPath = path.join(__dirname, "test-integration.pdf");

    // Créer un contenu PDF simple mais valide
    const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Test Document) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000010 00000 n 
0000000053 00000 n 
0000000103 00000 n 
0000000189 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
284
%%EOF`;

    fs.writeFileSync(testPdfPath, pdfContent);
    console.log("✅ Fichier PDF créé !");

    console.log("\n📤 3. Préparation upload avec FormData...");
    const formData = new FormData();
    formData.append("file", fs.createReadStream(testPdfPath), {
      filename: "test-integration.pdf",
      contentType: "application/pdf",
    });
    formData.append("projet_id", "22");
    formData.append(
      "localite",
      JSON.stringify({
        type: "departement",
        valeur: "Dakar",
      })
    );

    console.log(
      "🚀 4. Upload vers backend (avec middleware restrictToFirstUser)..."
    );
    const uploadResponse = await axios.post(
      "http://localhost:3000/api/extractions/upload",
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${token}`,
        },
        timeout: 45000, // 45 secondes pour laisser le temps
      }
    );

    console.log("✅ SUCCÈS COMPLET !");
    console.log("Response:", JSON.stringify(uploadResponse.data, null, 2));

    // Nettoyage
    fs.unlinkSync(testPdfPath);
  } catch (error) {
    console.log("❌ ERREUR:");

    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log("Data:", error.response.data);

      if (error.response.status === 403) {
        console.log("\n💡 Erreur 403: Middleware restrictToFirstUser a bloqué");
        console.log(
          "Vérifiez que l'utilisateur 44 est bien assigné au projet 22 étape 1"
        );
      } else if (error.response.status === 400) {
        console.log("\n💡 Erreur 400: Problème de format de données");
      } else if (error.response.status === 500) {
        console.log(
          "\n💡 Erreur 500: Erreur serveur (Flask ou base de données)"
        );
      }
    } else if (error.code === "ETIMEDOUT") {
      console.log("❌ Timeout - Problème de communication Flask");
    } else {
      console.log("Erreur:", error.message);
    }

    // Nettoyage en cas d'erreur
    try {
      const testPdfPath = path.join(__dirname, "test-integration.pdf");
      if (fs.existsSync(testPdfPath)) {
        fs.unlinkSync(testPdfPath);
      }
    } catch (e) {
      // Ignore
    }
  }
}

// Test rapide du serveur
async function testServerReady() {
  console.log("🏥 Vérification serveur backend...");
  try {
    await axios.get("http://localhost:3000/health", { timeout: 5000 });
    console.log("✅ Serveur backend OK !\n");
    return true;
  } catch (error) {
    console.log("❌ Serveur backend non disponible sur localhost:3000");
    console.log("💡 Démarrez le serveur avec: npm run dev\n");
    return false;
  }
}

async function runFullTest() {
  if (await testServerReady()) {
    await testCompleteIntegration();
  }
}

if (require.main === module) {
  runFullTest();
}

module.exports = { testCompleteIntegration };
