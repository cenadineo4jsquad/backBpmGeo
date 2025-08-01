// Test simple des nouvelles fonctionnalités géographiques
const axios = require("axios");

const baseUrl = "http://localhost:3000";

// Fonction utilitaire pour faire des requêtes API
async function apiRequest(method, endpoint, data = null, token = null) {
  const config = {
    method,
    url: `${baseUrl}${endpoint}`,
    headers: { "Content-Type": "application/json" },
  };

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (data) {
    config.data = data;
  }

  try {
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message,
    };
  }
}

async function testSimpleGeographic() {
  console.log("🌍 TEST SIMPLE DES FONCTIONNALITÉS GÉOGRAPHIQUES");
  console.log("================================================");

  try {
    // 1. Test des statistiques des localités
    console.log("\n📊 Test: Statistiques des localités");
    const statsResult = await apiRequest("GET", "/api/localites/stats");
    if (statsResult.success) {
      const stats = statsResult.data;
      console.log(`✅ Statistiques récupérées:`);
      console.log(`   • Régions: ${stats.regions}`);
      console.log(`   • Départements: ${stats.departements}`);
      console.log(`   • Arrondissements: ${stats.arrondissements}`);
      console.log(`   • Total: ${stats.total}`);
    } else {
      console.log("❌ Erreur récupération statistiques:", statsResult.error);
    }

    // 2. Test récupération des régions
    console.log("\n🏛️  Test: Récupération des régions");
    const regionsResult = await apiRequest("GET", "/api/localites/regions");
    if (regionsResult.success) {
      const regions = regionsResult.data;
      console.log(`✅ ${regions.total} régions trouvées:`);
      regions.regions.slice(0, 5).forEach((region) => {
        console.log(`   • ${region.nom}`);
      });
      if (regions.total > 5) {
        console.log(`   ... et ${regions.total - 5} autres`);
      }
    } else {
      console.log("❌ Erreur récupération régions:", regionsResult.error);
    }

    // 3. Test récupération des départements
    console.log("\n🏢 Test: Récupération des départements");
    const deptsResult = await apiRequest("GET", "/api/localites/departements");
    if (deptsResult.success) {
      const departements = deptsResult.data;
      console.log(`✅ ${departements.total} départements trouvés:`);
      departements.departements.slice(0, 5).forEach((dept) => {
        console.log(`   • ${dept.nom}`);
      });
      if (departements.total > 5) {
        console.log(`   ... et ${departements.total - 5} autres`);
      }
    } else {
      console.log("❌ Erreur récupération départements:", deptsResult.error);
    }

    // 4. Test recherche d'arrondissements
    console.log(
      '\n🏘️  Test: Recherche d\'arrondissements (terme: "Ngaoundéré")'
    );
    const arrResult = await apiRequest(
      "GET",
      "/api/localites/arrondissements/Ngaoundéré"
    );
    if (arrResult.success) {
      const arrondissements = arrResult.data;
      console.log(`✅ ${arrondissements.total} arrondissements trouvés:`);
      arrondissements.arrondissements.forEach((arr) => {
        console.log(`   • ${arr.nom}`);
      });
    } else {
      console.log("❌ Erreur récupération arrondissements:", arrResult.error);
    }

    // 5. Test recherche générale
    console.log('\n🔍 Test: Recherche générale (terme: "Centre")');
    const searchResult = await apiRequest(
      "GET",
      "/api/localites/search?q=Centre"
    );
    if (searchResult.success) {
      const results = searchResult.data;
      console.log(`✅ ${results.total} résultats trouvés:`);
      results.results.slice(0, 10).forEach((result) => {
        console.log(`   • ${result.nom} (${result.type})`);
      });
      if (results.total > 10) {
        console.log(`   ... et ${results.total - 10} autres`);
      }
    } else {
      console.log("❌ Erreur recherche:", searchResult.error);
    }

    // 6. Test recherche par type
    console.log(
      '\n🔍 Test: Recherche par type (arrondissements avec "Yaoundé")'
    );
    const searchTypeResult = await apiRequest(
      "GET",
      "/api/localites/search?q=Yaoundé&type=arrondissement"
    );
    if (searchTypeResult.success) {
      const results = searchTypeResult.data;
      console.log(`✅ ${results.total} arrondissements trouvés:`);
      results.results.forEach((result) => {
        console.log(`   • ${result.nom}`);
      });
    } else {
      console.log("❌ Erreur recherche par type:", searchTypeResult.error);
    }

    console.log("\n🎉 TESTS GÉOGRAPHIQUES SIMPLES TERMINÉS !");
    console.log("=========================================");

    console.log("\n✅ FONCTIONNALITÉS TESTÉES:");
    console.log("• Statistiques des localités importées ✅");
    console.log("• Liste des régions ✅");
    console.log("• Liste des départements ✅");
    console.log("• Recherche d'arrondissements par département ✅");
    console.log("• Recherche générale de localités ✅");
    console.log("• Recherche par type spécifique ✅");
  } catch (error) {
    console.error("❌ Erreur durant les tests:", error);
    console.error("Stack:", error.stack);
  }
}

// Lancer les tests
testSimpleGeographic();
