// Script pour lister les utilisateurs existants
const axios = require("axios");

const API_BASE = "http://localhost:3000";

async function listUsers() {
  console.log("👥 Tentative de connexion avec différents utilisateurs...");

  const testUsers = [
    { email: "admin@test.com", password: "admin123", desc: "Admin principal" },
    { email: "admin@bpm.com", password: "admin123", desc: "Admin BPM" },
    {
      email: "extracteur@test.com",
      password: "password123",
      desc: "Extracteur test",
    },
    { email: "user@test.com", password: "password", desc: "User générique" },
  ];

  for (const user of testUsers) {
    try {
      console.log(`\n🔐 Test connexion: ${user.desc} (${user.email})`);
      const response = await axios.post(`${API_BASE}/api/login`, {
        email: user.email,
        mot_de_passe: user.password,
      });

      console.log("✅ Connexion réussie !");
      console.log("   - Token présent:", !!response.data.access_token);
      console.log("   - User ID:", response.data.user?.id);
      console.log("   - Niveau:", response.data.user?.niveau_hierarchique);
      console.log("   - Localité:", response.data.user?.localite);
    } catch (error) {
      console.log("❌ Échec de connexion");
      if (error.response) {
        console.log("   - Status:", error.response.status);
        console.log("   - Message:", error.response.data?.error);
      }
    }
  }
}

// Exécuter la liste
listUsers();
