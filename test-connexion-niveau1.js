const axios = require("axios");

async function testConnexionNiveau1() {
  try {
    console.log("🔐 Test de connexion avec l'utilisateur niveau 1...\n");

    // Données de l'utilisateur niveau 1
    const userLevel1 = {
      email: "validateur.cadastral.hashed@cadastre.cm",
      mot_de_passe: "cadastre2025",
    };

    console.log(`📧 Email: ${userLevel1.email}`);
    console.log(`🔑 Mot de passe: ${userLevel1.mot_de_passe}\n`);

    // URL de l'API de connexion
    const loginUrl = "http://localhost:3000/api/login";

    console.log(`🌐 Tentative de connexion sur: ${loginUrl}`);

    // Tentative de connexion
    const response = await axios.post(
      loginUrl,
      {
        email: userLevel1.email,
        mot_de_passe: userLevel1.mot_de_passe,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    console.log("\n✅ CONNEXION RÉUSSIE !");
    console.log("=".repeat(60));

    // Affichage des informations de réponse
    console.log("📋 Informations utilisateur:");
    console.log(`   🆔 ID: ${response.data.user?.id || "N/A"}`);
    console.log(
      `   👤 Nom: ${response.data.user?.prenom || ""} ${
        response.data.user?.nom || ""
      }`
    );
    console.log(`   📧 Email: ${response.data.user?.email || "N/A"}`);
    console.log(
      `   📊 Niveau: ${response.data.user?.niveau_hierarchique || "N/A"}`
    );
    console.log(
      `   📍 Localité ID: ${response.data.user?.localite_id || "N/A"}`
    );

    if (response.data.user?.roles) {
      console.log("\n👥 Rôles assignés:");
      response.data.user.roles.forEach((role) => {
        console.log(
          `   - ${role.nom} (ID: ${role.id}) - Niveau: ${role.niveau_hierarchique}`
        );
      });
    }

    if (response.data.token) {
      console.log("\n🔑 Token d'authentification reçu:");
      console.log(`   Token: ${response.data.token.substring(0, 50)}...`);

      // Test d'une requête authentifiée
      console.log("\n🧪 Test d'accès aux données avec le token...");

      try {
        const protectedResponse = await axios.get(
          "http://localhost:3000/api/projets",
          {
            headers: {
              Authorization: `Bearer ${response.data.token}`,
              "Content-Type": "application/json",
            },
            timeout: 5000,
          }
        );

        console.log("✅ Accès autorisé aux projets !");
        console.log(
          `   📊 Nombre de projets accessibles: ${
            protectedResponse.data?.length || 0
          }`
        );

        if (protectedResponse.data && protectedResponse.data.length > 0) {
          console.log("   📁 Projets accessibles:");
          protectedResponse.data.slice(0, 3).forEach((projet) => {
            console.log(`      - ID: ${projet.id} | Nom: ${projet.nom}`);
          });
        }
      } catch (protectedError) {
        console.log("⚠️ Erreur lors de l'accès aux données protégées:");
        console.log(`   Status: ${protectedError.response?.status || "N/A"}`);
        console.log(
          `   Message: ${
            protectedError.response?.data?.message || protectedError.message
          }`
        );
      }
    }
  } catch (error) {
    console.error("\n❌ ERREUR DE CONNEXION");
    console.error("=".repeat(60));

    if (error.response) {
      console.error(`📊 Status HTTP: ${error.response.status}`);
      console.error(
        `📄 Message: ${
          error.response.data?.message || error.response.statusText
        }`
      );
      console.error(
        `🔍 Détails: ${JSON.stringify(error.response.data, null, 2)}`
      );
    } else if (error.request) {
      console.error("🌐 Erreur de réseau - serveur non accessible");
      console.error(
        "   Vérifiez que le backend est démarré sur http://localhost:3000"
      );
    } else {
      console.error(`🐛 Erreur: ${error.message}`);
    }

    console.error("\n🔍 DIAGNOSTIC:");
    console.error("1. Vérifiez que le serveur backend est démarré");
    console.error("2. Vérifiez que l'utilisateur existe en base");
    console.error("3. Vérifiez que le mot de passe est correct");
    console.error("4. Vérifiez la route d'authentification");
  }
}

testConnexionNiveau1();
