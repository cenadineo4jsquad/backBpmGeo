/**
 * Test pour créer une extraction et vérifier le filtrage
 */

const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

async function testCreateAndList() {
  console.log("🧪 TEST : CRÉER UNE EXTRACTION ET VÉRIFIER LE FILTRAGE");
  console.log("=".repeat(60));

  try {
    // 1. Connexion
    console.log("🔐 1. Connexion...");
    const loginResponse = await axios.post("http://localhost:3000/api/login", {
      email: "reception.foncier@workflow.cm",
      mot_de_passe: "reception2025",
    });

    const token = loginResponse.data.access_token;
    const user = loginResponse.data.user;
    console.log("✅ Connecté");
    console.log("   Utilisateur ID:", user.id);
    console.log("   Niveau:", user.niveau_hierarchique);
    console.log("   Localité:", user.localite);

    // 2. Créer un fichier de test temporaire
    console.log("\n📄 2. Création d'un fichier de test...");
    const testFilePath = path.join(__dirname, "test-image.jpg");

    // Vérifier si le fichier existe déjà
    if (!fs.existsSync(testFilePath)) {
      console.log("   Creating test file...");
      // Créer un fichier image simple (1x1 pixel JPEG)
      const jpegHeader = Buffer.from([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
        0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
        0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
        0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20,
        0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29,
        0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32,
        0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x00, 0x01,
        0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
        0xff, 0xc4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x08, 0xff, 0xc4,
        0x00, 0x14, 0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff, 0xda, 0x00, 0x0c,
        0x03, 0x01, 0x00, 0x02, 0x11, 0x03, 0x11, 0x00, 0x3f, 0x00, 0x00, 0xff,
        0xd9,
      ]);
      fs.writeFileSync(testFilePath, jpegHeader);
    }
    console.log("   ✅ Fichier de test prêt:", testFilePath);

    // 3. Préparer l'upload avec la localité exacte de l'utilisateur
    console.log("\n📤 3. Upload d'une extraction de test...");

    const formData = new FormData();
    formData.append("file", fs.createReadStream(testFilePath));
    formData.append("projet_id", "22");
    // Utiliser exactement la même localité que l'utilisateur
    formData.append(
      "localite",
      JSON.stringify({
        type: "arrondissement",
        valeur: "Soa",
      })
    );

    console.log("   📋 Données de l'upload:");
    console.log("      Projet ID: 22");
    console.log("      Localité: arrondissement - Soa");

    const uploadResponse = await axios.post(
      "http://localhost:3000/api/extraction/upload",
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${token}`,
        },
        timeout: 60000, // 1 minute timeout
        validateStatus: () => true,
      }
    );

    console.log("   📊 Réponse upload:");
    console.log("      Status:", uploadResponse.status);
    if (uploadResponse.status === 201) {
      console.log("      ✅ Upload réussi!");
      console.log("      ID:", uploadResponse.data.id);
      console.log("      Fichier:", uploadResponse.data.fichier);
      console.log(
        "      Données extraites:",
        uploadResponse.data.donnees_extraites
      );
    } else {
      console.log("      ❌ Échec upload:", uploadResponse.data);
    }

    // 4. Maintenant, tester la liste des extractions
    console.log("\n📋 4. Test de la liste après création...");

    const listResponse = await axios.get(
      "http://localhost:3000/api/extractions",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log("   📊 Résultat de la liste:");
    console.log("      Status:", listResponse.status);
    console.log("      Nombre:", listResponse.data.length);

    if (listResponse.data.length > 0) {
      console.log("      ✅ Extractions trouvées:");
      listResponse.data.forEach((extraction, index) => {
        console.log(`         ${index + 1}. ID ${extraction.id}`);
        console.log(`            Projet: ${extraction.projet_id}`);
        console.log(`            Utilisateur: ${extraction.utilisateur_id}`);
        console.log(`            Statut: ${extraction.statut}`);
        console.log(
          `            Localité: ${extraction.donnees_extraites?.localite?.type} - ${extraction.donnees_extraites?.localite?.valeur}`
        );
      });
    } else {
      console.log("      ⚠️  Liste encore vide après création");
    }

    // 5. Nettoyer le fichier de test
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
      console.log("\n🧹 Fichier de test supprimé");
    }
  } catch (error) {
    console.error("\n❌ Erreur:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
  }
}

if (require.main === module) {
  testCreateAndList();
}

module.exports = { testCreateAndList };
