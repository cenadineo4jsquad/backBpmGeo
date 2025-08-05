// Script pour créer un utilisateur test niveau 1
const axios = require("axios");

const API_BASE = "http://localhost:3000";

async function createTestUser() {
  console.log("🔧 Création d'un utilisateur test niveau 1...");

  try {
    // D'abord, vérifier si l'utilisateur existe déjà
    console.log("1️⃣ Vérification de l'existence de l'utilisateur...");

    try {
      const loginTest = await axios.post(`${API_BASE}/api/login`, {
        email: "extracteur@test.com",
        mot_de_passe: "password123",
      });
      console.log("✅ Utilisateur test existe déjà");
      return;
    } catch (error) {
      if (error.response?.status === 401) {
        console.log("🆕 Utilisateur n'existe pas, création en cours...");
      } else {
        throw error;
      }
    }

    // Si on arrive ici, l'utilisateur n'existe pas, on le crée
    // Il faut d'abord se connecter en tant qu'admin
    console.log("2️⃣ Connexion administrateur...");

    // Essayons de créer un admin d'abord si nécessaire
    const adminData = {
      nom: "Admin",
      prenom: "System",
      email: "admin@test.com",
      mot_de_passe: "admin123",
      niveau_hierarchique: 4,
      localite: {
        type: "region",
        valeur: "Centre",
      },
    };

    try {
      const adminResponse = await axios.post(
        `${API_BASE}/api/utilisateurs`,
        adminData
      );
      console.log("✅ Administrateur créé");
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log("⚠️ Impossible de créer l'admin directement");
        console.log(
          "💡 Vérifiez qu'un admin existe déjà ou utilisez le script createAdmin.ts"
        );
        return;
      }
    }

    // Connexion admin
    const adminLogin = await axios.post(`${API_BASE}/api/login`, {
      email: "admin@test.com",
      mot_de_passe: "admin123",
    });

    const adminHeaders = {
      Authorization: `Bearer ${adminLogin.data.access_token}`,
    };

    // Création de l'utilisateur extracteur niveau 1
    console.log("3️⃣ Création de l'utilisateur extracteur niveau 1...");
    const userData = {
      nom: "Extracteur",
      prenom: "Test",
      email: "extracteur@test.com",
      mot_de_passe: "password123",
      niveau_hierarchique: 1,
      localite: {
        type: "commune",
        valeur: "Yaoundé 3ème",
      },
    };

    const userResponse = await axios.post(
      `${API_BASE}/api/utilisateurs`,
      userData,
      { headers: adminHeaders }
    );
    console.log(
      "✅ Utilisateur extracteur créé avec ID:",
      userResponse.data.id
    );
  } catch (error) {
    console.error("❌ Erreur lors de la création de l'utilisateur test:");
    console.error("Message:", error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    }
  }
}

// Exécuter la création
createTestUser();
