// Test complet : Workflow submission → Création automatique de titre foncier
const axios = require("axios");

const API_BASE = "http://localhost:3000";

// Identifiants des utilisateurs créés
const USERS = {
  receptionnaire: {
    email: "reception.foncier@workflow.cm",
    password: "reception2025",
    niveau: 1,
  },
  expert_geo: {
    email: "expert.geo@workflow.cm",
    password: "geotechnique2025",
    niveau: 2,
  },
  juriste: {
    email: "juriste.expert@workflow.cm",
    password: "juridique2025",
    niveau: 2,
  },
};

const PROJET_ID = 22;

async function testWorkflowTitreFoncier() {
  console.log(
    "🚀 Test : Workflow submission → Création automatique titre foncier"
  );
  console.log("=".repeat(70));

  try {
    // Étape 1 : Connexion réceptionnaire (niveau 1)
    console.log("\n1️⃣ Connexion réceptionnaire niveau 1...");
    const receptionLogin = await axios.post(`${API_BASE}/api/login`, {
      email: USERS.receptionnaire.email,
      mot_de_passe: USERS.receptionnaire.password,
    });

    const receptionHeaders = {
      Authorization: `Bearer ${receptionLogin.data.access_token}`,
      "Content-Type": "application/json",
    };

    console.log("✅ Connexion réceptionnaire réussie");

    // Étape 2 : Créer une extraction de test
    console.log("\n2️⃣ Création d'une extraction de test...");
    const extractionData = {
      projet_id: PROJET_ID,
      nom_fichier: "test-titre-foncier-document.pdf",
      taille_fichier: 1024000,
      donnees_extraites: {
        proprietaire: "Jean Claude MVONDO",
        superficie: 2500.75,
        perimetre: 210.5,
        coordonnees_gps: [
          [11.5167, 3.8667],
          [11.52, 3.87],
          [11.518, 3.872],
          [11.515, 3.869],
          [11.5167, 3.8667],
        ],
        localite: {
          type: "commune",
          valeur: "Yaoundé 6ème",
        },
        date_document: "2025-08-05",
        type_document: "plan_cadastral",
      },
    };

    const extractionResponse = await axios.post(
      `${API_BASE}/api/extractions`,
      extractionData,
      {
        headers: receptionHeaders,
      }
    );

    const extractionId = extractionResponse.data.id;
    console.log(`✅ Extraction créée avec ID: ${extractionId}`);

    // Étape 3 : Vérifier qu'aucun titre foncier n'existe encore
    console.log("\n3️⃣ Vérification : Aucun titre foncier avant soumission...");
    const titresAvant = await axios.get(`${API_BASE}/api/titres-fonciers`, {
      headers: receptionHeaders,
    });

    const titresAvantCount = titresAvant.data.filter((t) =>
      t.titres_extractions?.some((te) => te.extraction_id === extractionId)
    ).length;

    console.log(
      `📊 Titres fonciers liés avant soumission: ${titresAvantCount}`
    );

    // Étape 4 : Connexion expert géotechnique (niveau 2)
    console.log("\n4️⃣ Connexion expert géotechnique niveau 2...");
    const expertLogin = await axios.post(`${API_BASE}/api/login`, {
      email: USERS.expert_geo.email,
      mot_de_passe: USERS.expert_geo.password,
    });

    const expertHeaders = {
      Authorization: `Bearer ${expertLogin.data.access_token}`,
      "Content-Type": "application/json",
    };

    console.log("✅ Connexion expert géotechnique réussie");

    // Étape 5 : Soumission au niveau suivant (niveau 2)
    console.log(
      "\n5️⃣ 🎯 SOUMISSION AU NIVEAU 2 (Trigger création titre foncier)..."
    );

    // D'abord, récupérons les workflows actifs pour ce projet
    const workflowsResponse = await axios.get(`${API_BASE}/api/workflows`, {
      headers: receptionHeaders,
      params: { projet_id: PROJET_ID },
    });

    console.log("📋 Workflows trouvés:", workflowsResponse.data.length);

    if (workflowsResponse.data.length === 0) {
      console.log(
        "⚠️ Aucun workflow trouvé pour le projet, création d'un workflow..."
      );
      // Créer un workflow si nécessaire
      const newWorkflow = await axios.post(
        `${API_BASE}/api/workflows`,
        {
          projet_id: PROJET_ID,
          extraction_id: extractionId,
          statut: "en_cours",
        },
        { headers: receptionHeaders }
      );
      console.log("✅ Workflow créé:", newWorkflow.data.id);
    }

    // Utiliser la route de soumission existante avec workflow_id
    const workflow = workflowsResponse.data[0] || { id: 1 }; // Fallback si pas de workflow

    const submissionResponse = await axios.post(
      `${API_BASE}/api/extraction/submit`,
      {
        workflow_id: workflow.id,
        commentaire: "Documents validés - Passage au niveau géotechnique",
      },
      { headers: receptionHeaders }
    );

    console.log("✅ Soumission effectuée");
    console.log("📋 Réponse:", submissionResponse.data);

    // Étape 6 : Attendre un peu pour le traitement asynchrone
    console.log("\n6️⃣ Attente du traitement...");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Étape 7 : Vérifier la création automatique du titre foncier
    console.log("\n7️⃣ 🔍 VÉRIFICATION : Titre foncier créé automatiquement...");
    const titresApres = await axios.get(`${API_BASE}/api/titres-fonciers`, {
      headers: expertHeaders,
    });

    const titresLies = titresApres.data.filter((t) =>
      t.titres_extractions?.some((te) => te.extraction_id === extractionId)
    );

    console.log(
      `📊 Titres fonciers liés après soumission: ${titresLies.length}`
    );

    if (titresLies.length > 0) {
      const titre = titresLies[0];
      console.log("🎉 SUCCESS! Titre foncier créé automatiquement:");
      console.log(`   📄 ID: ${titre.id}`);
      console.log(`   👤 Propriétaire: ${titre.proprietaire}`);
      console.log(`   📐 Superficie: ${titre.superficie} m²`);
      console.log(`   📏 Périmètre: ${titre.perimetre} m`);
      console.log(`   📍 Localité: ${titre.localite}`);
      console.log(`   🗓️ Date création: ${titre.date_ajout}`);
    } else {
      console.log("❌ ÉCHEC: Aucun titre foncier créé automatiquement");
    }

    // Étape 8 : Vérifier l'état de l'extraction
    console.log("\n8️⃣ Vérification état de l'extraction...");
    const extractionState = await axios.get(
      `${API_BASE}/api/extractions/${extractionId}`,
      {
        headers: expertHeaders,
      }
    );

    console.log("📋 État extraction:");
    console.log(`   🔢 Niveau actuel: ${extractionState.data.niveau_actuel}`);
    console.log(`   📊 Statut: ${extractionState.data.statut}`);
    console.log(
      `   👤 Utilisateur actuel: ${extractionState.data.utilisateur_actuel_id}`
    );

    console.log("\n🏁 Test terminé!");
    console.log("=".repeat(70));
  } catch (error) {
    console.error("\n❌ Erreur durant le test:");
    console.error("Message:", error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", JSON.stringify(error.response.data, null, 2));
    }
    console.error("Stack:", error.stack);
  }
}

// Exécuter le test
testWorkflowTitreFoncier();
