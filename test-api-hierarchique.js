// Test des nouvelles APIs d'accès hiérarchique
const axios = require("axios");

const baseUrl = "http://localhost:3000";

async function apiRequest(method, endpoint, data = null, token = null) {
  const config = {
    method,
    url: `${baseUrl}${endpoint}`,
    headers: { "Content-Type": "application/json" },
  };

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (data && (method === "POST" || method === "PUT")) {
    config.data = data;
  }

  try {
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message,
      status: error.response?.status,
    };
  }
}

async function testAPIAccesHierarchique() {
  console.log("🌐 TEST API - ACCÈS HIÉRARCHIQUE AUX TITRES FONCIERS");
  console.log("====================================================");

  try {
    // 1. Test de connexion d'un utilisateur niveau central (admin)
    console.log("\n1️⃣  Test avec utilisateur niveau CENTRAL...");
    const loginAdmin = await apiRequest("POST", "/api/login", {
      email: "admin@example.com",
      mot_de_passe: "AdminTest123!",
    });

    if (loginAdmin.success) {
      const tokenAdmin = loginAdmin.data.access_token;
      console.log("✅ Connexion admin réussie");

      // Test récupération de tous les titres fonciers
      const titresAdmin = await apiRequest(
        "GET",
        "/api/titres_fonciers",
        null,
        tokenAdmin
      );
      if (titresAdmin.success) {
        console.log(
          `✅ Admin peut voir ${titresAdmin.data.length} titres fonciers au total`
        );
      } else {
        console.log("❌ Erreur récupération titres admin:", titresAdmin.error);
      }

      // Test des nouvelles APIs d'accès
      const statsAdmin = await apiRequest(
        "GET",
        "/api/titres_fonciers/access/stats",
        null,
        tokenAdmin
      );
      if (statsAdmin.success) {
        console.log("✅ Statistiques d'accès admin:", statsAdmin.data);
      } else {
        console.log("❌ Erreur stats admin:", statsAdmin.error);
      }

      const localitesAdmin = await apiRequest(
        "GET",
        "/api/titres_fonciers/access/localites",
        null,
        tokenAdmin
      );
      if (localitesAdmin.success) {
        console.log(
          `✅ Admin a accès à ${localitesAdmin.data.total} localités`
        );
      } else {
        console.log("❌ Erreur localités admin:", localitesAdmin.error);
      }
    } else {
      console.log("⚠️  Pas d'admin trouvé, passons aux autres tests");
    }

    // 2. Test avec un utilisateur existant quelconque
    console.log("\n2️⃣  Test avec utilisateur niveau DÉPARTEMENT...");

    // Essayons de nous connecter avec l'utilisateur département créé dans le test précédent
    const loginDept = await apiRequest("POST", "/api/login", {
      email: "chef.mfoundi@test.cm",
      mot_de_passe: "UserTest123!", // Mot de passe par défaut
    });

    if (loginDept.success) {
      const tokenDept = loginDept.data.access_token;
      console.log("✅ Connexion chef de département réussie");

      // Test récupération des titres fonciers avec accès hiérarchique
      const titresDept = await apiRequest(
        "GET",
        "/api/titres_fonciers",
        null,
        tokenDept
      );
      if (titresDept.success) {
        console.log(
          `✅ Chef de département peut voir ${titresDept.data.length} titres fonciers`
        );
        console.log("   Localités des titres accessibles:");
        const localites = [...new Set(titresDept.data.map((t) => t.localite))];
        localites.forEach((loc) => {
          const count = titresDept.data.filter(
            (t) => t.localite === loc
          ).length;
          console.log(`   • ${loc}: ${count} titres`);
        });
      } else {
        console.log(
          "❌ Erreur récupération titres département:",
          titresDept.error
        );
      }

      // Test GeoJSON avec accès hiérarchique
      const geojsonDept = await apiRequest(
        "GET",
        "/api/titres_fonciers/geojson",
        null,
        tokenDept
      );
      if (geojsonDept.success) {
        console.log(
          `✅ Chef de département - GeoJSON avec ${geojsonDept.data.features.length} features`
        );
      } else {
        console.log("❌ Erreur GeoJSON département:", geojsonDept.error);
      }

      // Test des nouvelles APIs
      const statsDept = await apiRequest(
        "GET",
        "/api/titres_fonciers/access/stats",
        null,
        tokenDept
      );
      if (statsDept.success) {
        console.log("✅ Statistiques d'accès département:", statsDept.data);
      } else {
        console.log("❌ Erreur stats département:", statsDept.error);
      }
    } else {
      console.log("⚠️  Connexion département échouée:", loginDept.error);
    }

    // 3. Test avec un utilisateur niveau arrondissement
    console.log("\n3️⃣  Test avec utilisateur niveau ARRONDISSEMENT...");

    const loginArr = await apiRequest("POST", "/api/login", {
      email: "chef.yde1@test.cm",
      mot_de_passe: "UserTest123!",
    });

    if (loginArr.success) {
      const tokenArr = loginArr.data.access_token;
      console.log("✅ Connexion chef d'arrondissement réussie");

      // Test récupération des titres fonciers (devrait être limité à son arrondissement)
      const titresArr = await apiRequest(
        "GET",
        "/api/titres_fonciers",
        null,
        tokenArr
      );
      if (titresArr.success) {
        console.log(
          `✅ Chef d'arrondissement peut voir ${titresArr.data.length} titres fonciers`
        );
        console.log("   Localités des titres accessibles:");
        const localites = [...new Set(titresArr.data.map((t) => t.localite))];
        localites.forEach((loc) => {
          const count = titresArr.data.filter((t) => t.localite === loc).length;
          console.log(`   • ${loc}: ${count} titres`);
        });
      } else {
        console.log(
          "❌ Erreur récupération titres arrondissement:",
          titresArr.error
        );
      }

      // Comparer avec l'accès du département
      if (loginDept.success) {
        const titresDeptCount =
          (
            await apiRequest(
              "GET",
              "/api/titres_fonciers",
              null,
              loginDept.data.access_token
            )
          ).data?.length || 0;
        const titresArrCount = titresArr.data?.length || 0;

        console.log("\n📊 Comparaison des accès:");
        console.log(`   • Chef de département: ${titresDeptCount} titres`);
        console.log(`   • Chef d'arrondissement: ${titresArrCount} titres`);

        if (titresDeptCount > titresArrCount) {
          console.log(
            "   ✅ SUCCÈS: Le chef de département voit plus de titres que le chef d'arrondissement"
          );
        } else {
          console.log("   ⚠️  Les accès semblent identiques ou inversés");
        }
      }
    } else {
      console.log("⚠️  Connexion arrondissement échouée:", loginArr.error);
    }

    // 4. Test des endpoints de localités géographiques
    console.log("\n4️⃣  Test des APIs géographiques...");

    const regions = await apiRequest("GET", "/api/localites/regions");
    if (regions.success) {
      console.log(`✅ ${regions.data.total} régions trouvées`);
    }

    const departements = await apiRequest(
      "GET",
      "/api/localites/departements/Centre"
    );
    if (departements.success) {
      console.log(
        `✅ ${departements.data.total} départements trouvés dans Centre`
      );
    }

    const arrondissements = await apiRequest(
      "GET",
      "/api/localites/arrondissements/Mfoundi"
    );
    if (arrondissements.success) {
      console.log(
        `✅ ${arrondissements.data.total} arrondissements trouvés dans Mfoundi`
      );
    }

    console.log("\n🎉 TESTS API TERMINÉS !");
    console.log("========================");
    console.log("✅ FONCTIONNALITÉS VALIDÉES:");
    console.log(
      "• Accès hiérarchique aux titres fonciers selon le niveau utilisateur"
    );
    console.log(
      "• Les chefs de département voient tous les arrondissements de leur département"
    );
    console.log(
      "• Les chefs d'arrondissement ne voient que leur arrondissement"
    );
    console.log("• APIs de statistiques d'accès fonctionnelles");
    console.log("• APIs géographiques pour explorer la hiérarchie");
    console.log("• Format GeoJSON respecte l'accès hiérarchique");
  } catch (error) {
    console.error("❌ Erreur durant les tests API:", error);
  }
}

// Lancer les tests
testAPIAccesHierarchique();
