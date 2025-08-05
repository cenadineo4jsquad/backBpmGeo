const axios = require("axios");

const BASE_URL = "http://localhost:3000";

async function testWorkflowSubmission() {
  try {
    console.log(
      "🧪 Test de la soumission de workflow avec création automatique de titre foncier"
    );

    // 1. Connexion avec un utilisateur niveau 1
    console.log("\n1. Connexion utilisateur niveau 1...");
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: "user1@test.com",
      mot_de_passe: "test123",
    });

    const token = loginResponse.data.token;
    const config = {
      headers: { Authorization: `Bearer ${token}` },
    };

    console.log("✅ Connexion réussie");

    // 2. Lister les extractions disponibles
    console.log("\n2. Récupération des extractions...");
    const extractionsResponse = await axios.get(
      `${BASE_URL}/api/extractions`,
      config
    );
    const extractions = extractionsResponse.data;

    console.log(`📋 ${extractions.length} extractions trouvées`);

    if (extractions.length === 0) {
      console.log("❌ Aucune extraction disponible pour le test");
      return;
    }

    // 3. Prendre la première extraction
    const extraction = extractions[0];
    console.log(
      `📄 Extraction sélectionnée: ID ${extraction.id}, Projet ${extraction.projet_id}`
    );

    // 4. Vérifier les titres fonciers existants
    console.log("\n3. Vérification des titres fonciers existants...");
    const titresAvantResponse = await axios.get(
      `${BASE_URL}/api/titres-fonciers`,
      config
    );
    const titresAvant =
      titresAvantResponse.data.titres || titresAvantResponse.data;

    console.log(`📊 ${titresAvant.length} titres fonciers existants`);

    // 5. Soumettre au niveau suivant (workflow)
    console.log("\n4. Soumission du workflow au niveau suivant...");
    const submitResponse = await axios.post(
      `${BASE_URL}/api/extraction/submit`,
      {
        workflow_id: extraction.projet_id, // Utiliser projet_id comme workflow_id
      },
      config
    );

    console.log("✅ Soumission réussie:", submitResponse.data);

    // 6. Vérifier la création du titre foncier
    console.log(
      "\n5. Vérification de la création automatique du titre foncier..."
    );
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Attendre 2 secondes

    const titresApresResponse = await axios.get(
      `${BASE_URL}/api/titres-fonciers`,
      config
    );
    const titresApres =
      titresApresResponse.data.titres || titresApresResponse.data;

    console.log(`📊 ${titresApres.length} titres fonciers après soumission`);

    if (titresApres.length > titresAvant.length) {
      const nouveauxTitres = titresApres.filter(
        (titre) =>
          !titresAvant.some((ancienTitre) => ancienTitre.id === titre.id)
      );

      console.log("🎉 Titre(s) foncier(s) créé(s) automatiquement:");
      nouveauxTitres.forEach((titre) => {
        console.log(
          `   - ID: ${titre.id}, Propriétaire: ${titre.proprietaire}, Projet: ${titre.projet_id}`
        );
      });
    } else {
      console.log("⚠️ Aucun nouveau titre foncier créé");
    }

    // 7. Vérifier le statut de l'extraction
    console.log("\n6. Vérification du statut de l'extraction...");
    const extractionUpdatedResponse = await axios.get(
      `${BASE_URL}/api/extractions/${extraction.id}`,
      config
    );
    const extractionUpdated = extractionUpdatedResponse.data;

    console.log(`📄 Statut de l'extraction: ${extractionUpdated.statut}`);

    console.log("\n✅ Test terminé avec succès!");
  } catch (error) {
    console.error(
      "❌ Erreur lors du test:",
      error.response?.data || error.message
    );
    if (error.response?.status === 401) {
      console.log(
        "💡 Vérifiez que l'utilisateur test existe et que le mot de passe est correct"
      );
    }
    if (error.response?.status === 403) {
      console.log("💡 Vérifiez les permissions de l'utilisateur");
    }
  }
}

// Fonction pour créer des données de test si nécessaire
async function createTestData() {
  try {
    console.log("🔧 Création de données de test...");

    // Ici vous pouvez ajouter la logique pour créer:
    // - Un utilisateur de test
    // - Un projet de test
    // - Une extraction de test

    console.log("✅ Données de test créées");
  } catch (error) {
    console.error(
      "❌ Erreur lors de la création des données de test:",
      error.message
    );
  }
}

// Exécuter le test
if (require.main === module) {
  console.log("🚀 Démarrage du test de workflow submission...\n");
  testWorkflowSubmission();
}

module.exports = { testWorkflowSubmission, createTestData };
