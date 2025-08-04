// Test simple de connexion
const axios = require("axios");

async function testSimpleConnection() {
  console.log("🔍 Test de connexion simple...");

  try {
    // Test 1: Vérifier que le serveur répond
    console.log("1. Test ping serveur...");
    const pingResponse = await axios.get("http://localhost:3000", {
      timeout: 3000,
      validateStatus: () => true,
    });
    console.log(`   Serveur répond: ${pingResponse.status}`);

    // Test 2: Tester la route de login avec un utilisateur simple
    console.log("2. Test login avec utilisateur simple...");
    const loginResponse = await axios.post(
      "http://localhost:3000/api/login",
      {
        email: "admin@example.com", // Utilisateur simple
        mot_de_passe: "admin123",
      },
      {
        timeout: 5000,
        validateStatus: () => true,
      }
    );

    console.log(`   Login response status: ${loginResponse.status}`);
    console.log(`   Login response data:`, loginResponse.data);

    // Test 3: Tester avec l'utilisateur spécifique
    console.log("3. Test login avec utilisateur spécifique...");
    const specificLoginResponse = await axios.post(
      "http://localhost:3000/api/login",
      {
        email: "reception.foncier@workflow.cm",
        mot_de_passe: "reception2025",
      },
      {
        timeout: 5000,
        validateStatus: () => true,
      }
    );

    console.log(`   Specific login status: ${specificLoginResponse.status}`);
    console.log(`   Specific login data:`, specificLoginResponse.data);
  } catch (error) {
    console.error("❌ Erreur:", {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      data: error.response?.data,
    });
  }
}

testSimpleConnection();
