/**
 * Test pour vérifier et créer des titres fonciers de test
 */

const axios = require("axios");

async function testTitresFonciers() {
  console.log("🏠 TEST DES TITRES FONCIERS");
  console.log("=".repeat(50));

  try {
    // 1. Test avec utilisateur niveau 2 (Mefou et Afamba)
    console.log("🔐 1. Connexion utilisateur niveau 2...");
    const loginNiveau2 = await axios.post("http://localhost:3000/api/login", {
      email: "expert.geo@workflow.cm",
      mot_de_passe: "geotechnique2025",
    });

    const tokenNiveau2 = loginNiveau2.data.access_token;
    const userNiveau2 = loginNiveau2.data.user;
    console.log("✅ Connecté niveau 2:");
    console.log("   ID:", userNiveau2.id);
    console.log("   Localité:", userNiveau2.localite);

    // 2. Test de la liste actuelle
    console.log("\n📋 2. Liste actuelle des titres fonciers...");
    const listResponse = await axios.get(
      "http://localhost:3000/api/titres_fonciers",
      {
        headers: { Authorization: `Bearer ${tokenNiveau2}` },
      }
    );

    console.log("📊 Réponse:");
    console.log("   Nombre de titres:", listResponse.data.titres.length);
    console.log("   Access info:", listResponse.data.access_info);

    // 3. Créer des titres fonciers de test si la liste est vide
    if (listResponse.data.titres.length === 0) {
      console.log("\n➕ 3. Création de titres fonciers de test...");

      // Créer un titre pour la localité "Mefou et Afamba"
      const titreTest1 = {
        projet_id: 22,
        proprietaire: "NDJOMO Paul Expert",
        surface_m2: 450.0,
        perimetre_m: 85.5,
        coordonnees_gps: [
          [11.6001, 3.992],
          [11.6002, 3.9921],
          [11.6003, 3.992],
          [11.6001, 3.992],
        ],
        localite: {
          type: "departement",
          valeur: "Mefou et Afamba",
        },
      };

      // Créer un titre pour "Soa" (niveau 1)
      const titreTest2 = {
        projet_id: 22,
        proprietaire: "OKENE AHANDA Test",
        surface_m2: 323.0,
        perimetre_m: 637.45,
        coordonnees_gps: [
          [11.599775887849335, 3.9915300998418504],
          [11.599931184680232, 3.991457821318175],
          [11.599866099504329, 3.991316788467999],
          [11.599735298636295, 3.9913776651149115],
          [11.599722156106091, 3.991413667401851],
          [11.599775887849335, 3.9915300998418504],
        ],
        localite: {
          type: "arrondissement",
          valeur: "Soa",
        },
      };

      try {
        console.log("   📄 Création titre 1 (Mefou et Afamba)...");
        const createResponse1 = await axios.post(
          "http://localhost:3000/api/titres_fonciers",
          titreTest1,
          {
            headers: {
              Authorization: `Bearer ${tokenNiveau2}`,
              "Content-Type": "application/json",
            },
            validateStatus: () => true,
          }
        );

        if (createResponse1.status === 201) {
          console.log("   ✅ Titre 1 créé avec ID:", createResponse1.data.id);
        } else {
          console.log(
            "   ❌ Erreur création titre 1:",
            createResponse1.status,
            createResponse1.data
          );
        }

        console.log("   📄 Création titre 2 (Soa)...");
        const createResponse2 = await axios.post(
          "http://localhost:3000/api/titres_fonciers",
          titreTest2,
          {
            headers: {
              Authorization: `Bearer ${tokenNiveau2}`,
              "Content-Type": "application/json",
            },
            validateStatus: () => true,
          }
        );

        if (createResponse2.status === 201) {
          console.log("   ✅ Titre 2 créé avec ID:", createResponse2.data.id);
        } else {
          console.log(
            "   ❌ Erreur création titre 2:",
            createResponse2.status,
            createResponse2.data
          );
        }
      } catch (createError) {
        console.log(
          "   ❌ Erreur lors de la création:",
          createError.response?.data || createError.message
        );
      }

      // 4. Re-tester la liste après création
      console.log("\n🔄 4. Nouvelle vérification de la liste...");
      const newListResponse = await axios.get(
        "http://localhost:3000/api/titres_fonciers",
        {
          headers: { Authorization: `Bearer ${tokenNiveau2}` },
        }
      );

      console.log("📊 Nouvelle réponse:");
      console.log("   Nombre de titres:", newListResponse.data.titres.length);

      if (newListResponse.data.titres.length > 0) {
        console.log("   📄 Titres trouvés:");
        newListResponse.data.titres.forEach((titre, index) => {
          console.log(
            `      ${index + 1}. ID ${titre.id} - ${titre.proprietaire}`
          );
          console.log(
            `         Localité: ${titre.localite.type} - ${titre.localite.valeur}`
          );
          console.log(`         Surface: ${titre.surface_m2} m²`);
        });
      }
    } else {
      console.log("   ✅ Des titres fonciers existent déjà");
    }

    // 5. Test avec un utilisateur niveau 4 pour voir tous les titres
    console.log("\n🔐 5. Test avec utilisateur niveau 4...");
    try {
      const loginAdmin = await axios.post("http://localhost:3000/api/login", {
        email: "admin@gov.cm",
        mot_de_passe: "motdepassefort",
      });

      const tokenAdmin = loginAdmin.data.access_token;

      const adminListResponse = await axios.get(
        "http://localhost:3000/api/titres_fonciers",
        {
          headers: { Authorization: `Bearer ${tokenAdmin}` },
        }
      );

      console.log("📊 Vue administrateur:");
      console.log(
        "   Nombre total de titres:",
        adminListResponse.data.titres.length
      );
      console.log("   Access info:", adminListResponse.data.access_info);

      // 6. Afficher toutes les localités pour diagnostic
      console.log("\n🔍 6. Diagnostic des localités existantes:");
      if (adminListResponse.data.titres.length > 0) {
        adminListResponse.data.titres.forEach((titre, index) => {
          console.log(
            `   ${index + 1}. ID ${titre.id} - ${titre.proprietaire}`
          );
          console.log(`      Localité: ${JSON.stringify(titre.localite)}`);
        });
      } else {
        console.log("   Aucun titre trouvé");
      }

      // 7. Créer des titres fonciers avec l'admin pour "Mefou et Afamba"
      console.log("\n➕ 7. Création de titres avec admin pour test...");

      const titreTestAdmin = {
        projet_id: 22,
        proprietaire: "TEST ADMIN - NDJOMO Paul",
        surface_m2: 500.0,
        perimetre_m: 90.0,
        coordonnees_gps: [
          [11.6001, 3.992],
          [11.6002, 3.9921],
          [11.6003, 3.992],
          [11.6001, 3.992],
        ],
        localite: {
          type: "departement",
          valeur: "Mefou et Afamba",
        },
      };

      try {
        const createAdminResponse = await axios.post(
          "http://localhost:3000/api/titres_fonciers",
          titreTestAdmin,
          {
            headers: {
              Authorization: `Bearer ${tokenAdmin}`,
              "Content-Type": "application/json",
            },
            validateStatus: () => true,
          }
        );

        if (createAdminResponse.status === 201) {
          console.log(
            "   ✅ Titre créé par admin avec ID:",
            createAdminResponse.data.id
          );

          // 8. Re-tester avec utilisateur niveau 2 après création admin
          console.log("\n🔄 8. Test niveau 2 après création admin...");
          const finalTestResponse = await axios.get(
            "http://localhost:3000/api/titres_fonciers",
            {
              headers: { Authorization: `Bearer ${tokenNiveau2}` },
            }
          );

          console.log("📊 Résultat final niveau 2:");
          console.log(
            "   Nombre de titres:",
            finalTestResponse.data.titres.length
          );
          console.log("   Access info:", finalTestResponse.data.access_info);

          if (finalTestResponse.data.titres.length > 0) {
            console.log("   🎉 Titres maintenant visibles pour niveau 2:");
            finalTestResponse.data.titres.forEach((titre, index) => {
              console.log(
                `      ${index + 1}. ID ${titre.id} - ${titre.proprietaire}`
              );
              console.log(
                `         Localité: ${titre.localite.type} - ${titre.localite.valeur}`
              );
            });
          }
        } else {
          console.log(
            "   ❌ Erreur création admin:",
            createAdminResponse.status,
            createAdminResponse.data
          );
        }
      } catch (createAdminError) {
        console.log(
          "   ❌ Erreur création admin:",
          createAdminError.response?.data || createAdminError.message
        );
      }
    } catch (adminError) {
      console.log("   ⚠️  Pas d'accès admin ou admin non configuré");
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
  testTitresFonciers();
}

module.exports = { testTitresFonciers };
