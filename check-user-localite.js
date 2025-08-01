const axios = require("axios");

async function checkUserLocalite() {
  try {
    console.log("🔍 Vérification des informations utilisateur...\n");

    // Connexion pour obtenir les informations complètes
    const loginResponse = await axios.post("http://localhost:3000/api/login", {
      email: "reception.foncier@workflow.cm",
      mot_de_passe: "reception2025",
    });

    const user = loginResponse.data.user;

    console.log("👤 INFORMATIONS UTILISATEUR COMPLÈTES:");
    console.log("=".repeat(60));
    console.log(`🆔 ID: ${user.id}`);
    console.log(`📧 Email: ${user.email}`);
    console.log(`👤 Nom: ${user.prenom} ${user.nom}`);
    console.log(`📊 Niveau hiérarchique: ${user.niveau_hierarchique}`);
    console.log(`📁 Projet ID: ${user.projet_id}`);
    console.log(`📍 Localité ID: ${user.localite_id}`);
    console.log(`🗺️ Localité:`, JSON.stringify(user.localite, null, 2));

    console.log("\n👥 RÔLE:");
    console.log(`   🆔 ID: ${user.role.id}`);
    console.log(`   📝 Nom: ${user.role.nom}`);
    console.log(`   📊 Niveau: ${user.role.niveau_hierarchique}`);
    console.log(`   📄 Description: ${user.role.description}`);

    if (user.etape_courante) {
      console.log("\n🔄 WORKFLOW:");
      console.log(`   📝 Étape courante: ${user.etape_courante.nom}`);
      console.log(`   📊 Ordre: ${user.etape_courante.ordre}`);
      console.log(`   📊 Niveau étape: ${user.niveau_etape}`);
    }

    return user;
  } catch (error) {
    console.error("❌ Erreur:", error.response?.data || error.message);
    throw error;
  }
}

checkUserLocalite();
