/**
 * Test pour diagnostiquer le format exact attendu par Flask
 */

const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

const FLASK_URL = "http://10.100.213.195:5000/api/process";

async function testFlaskFormats() {
  console.log("🔍 Test des formats de données pour Flask\n");

  // Test 1: Fichier PDF simple
  console.log("📄 1. Test avec fichier PDF...");
  await testWithFormat(
    "pdf",
    "application/pdf",
    Buffer.from("%PDF-1.4 Test PDF content")
  );

  // Test 2: Fichier JPEG simple
  console.log("\n🖼️  2. Test avec fichier JPEG...");
  const jpegHeader = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46,
  ]);
  await testWithFormat("jpg", "image/jpeg", jpegHeader);

  // Test 3: Fichier PNG
  console.log("\n🖼️  3. Test avec fichier PNG...");
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);
  await testWithFormat("png", "image/png", pngHeader);

  // Test 4: Vérifier les champs attendus
  console.log("\n📋 4. Test avec différents champs...");
  await testWithDifferentFields();
}

async function testWithFormat(extension, mimetype, content) {
  const filename = `test.${extension}`;
  const filepath = path.join(__dirname, filename);

  try {
    fs.writeFileSync(filepath, content);

    const formData = new FormData();
    formData.append("file", fs.createReadStream(filepath), {
      filename: filename,
      contentType: mimetype,
    });

    const response = await axios.post(FLASK_URL, formData, {
      headers: formData.getHeaders(),
      timeout: 8000,
      validateStatus: () => true,
    });

    console.log(`   ${filename} → Status: ${response.status}`);
    if (response.status === 200) {
      console.log(`   ✅ SUCCÈS! Flask accepte ce format`);
      console.log(`   Réponse:`, response.data);
    } else {
      console.log(`   ❌ Rejeté: ${response.data?.error || "Erreur inconnue"}`);
    }
  } catch (error) {
    console.log(`   ❌ Erreur: ${error.message}`);
  } finally {
    try {
      fs.unlinkSync(filepath);
    } catch (e) {}
  }
}

async function testWithDifferentFields() {
  const testFile = path.join(__dirname, "test-fields.jpg");
  const jpegContent = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
  fs.writeFileSync(testFile, jpegContent);

  // Test avec différentes combinaisons de champs
  const fieldTests = [
    {
      name: "Champ 'file' seulement",
      fields: { file: "test-fields.jpg" },
    },
    {
      name: "Avec champ 'document'",
      fields: { document: "test-fields.jpg" },
    },
    {
      name: "Avec projet_id",
      fields: { file: "test-fields.jpg", projet_id: "22" },
    },
    {
      name: "Avec localite",
      fields: {
        file: "test-fields.jpg",
        localite: JSON.stringify({ type: "arrondissement", valeur: "Soa" }),
      },
    },
  ];

  for (const test of fieldTests) {
    try {
      console.log(`\n   🧪 ${test.name}:`);

      const formData = new FormData();

      for (const [key, value] of Object.entries(test.fields)) {
        if (key === "file" || key === "document") {
          formData.append(key, fs.createReadStream(testFile), {
            filename: value,
            contentType: "image/jpeg",
          });
        } else {
          formData.append(key, value);
        }
      }

      const response = await axios.post(FLASK_URL, formData, {
        headers: formData.getHeaders(),
        timeout: 5000,
        validateStatus: () => true,
      });

      console.log(`      Status: ${response.status}`);
      if (response.status === 200) {
        console.log(`      ✅ SUCCÈS! Cette combinaison fonctionne`);
        console.log(`      Réponse:`, response.data);
      } else {
        console.log(`      ❌ ${response.data?.error || "Erreur"}`);
      }
    } catch (error) {
      console.log(`      ❌ Erreur: ${error.message}`);
    }
  }

  try {
    fs.unlinkSync(testFile);
  } catch (e) {}
}

// Test pour voir la vraie structure que Flask attend
async function testFlaskExpectations() {
  console.log("\n🎯 Test des attentes exactes de Flask...\n");

  // Test avec des données minimales qui pourraient fonctionner
  console.log("📋 Essai avec structure minimale...");

  const testFile = path.join(__dirname, "minimal-test.pdf");
  fs.writeFileSync(testFile, Buffer.from("%PDF-1.4\nTest minimal"));

  try {
    const formData = new FormData();
    formData.append("file", fs.createReadStream(testFile), {
      filename: "document.pdf",
      contentType: "application/pdf",
    });

    console.log("🚀 Envoi structure minimale...");
    const response = await axios.post(FLASK_URL, formData, {
      headers: {
        ...formData.getHeaders(),
        Accept: "application/json",
      },
      timeout: 10000,
      validateStatus: () => true,
    });

    console.log(`Status: ${response.status}`);
    console.log(`Headers:`, response.headers);
    console.log(`Réponse:`, response.data);

    if (response.status === 200) {
      console.log("🎉 SUCCÈS! Flask accepte cette structure minimale");
    }
  } catch (error) {
    console.log(`❌ Erreur: ${error.message}`);
    if (error.response) {
      console.log(`Response status: ${error.response.status}`);
      console.log(`Response data:`, error.response.data);
    }
  } finally {
    try {
      fs.unlinkSync(testFile);
    } catch (e) {}
  }
}

async function runFormatTests() {
  console.log("🧪 DIAGNOSTIC DES FORMATS FLASK");
  console.log("=".repeat(40));

  await testFlaskFormats();
  await testFlaskExpectations();

  console.log("\n" + "=".repeat(40));
  console.log("📋 OBJECTIF:");
  console.log("Identifier le format exact que Flask attend");
  console.log("pour corriger le service backend");
}

if (require.main === module) {
  runFormatTests();
}

module.exports = { testFlaskFormats, testFlaskExpectations };
