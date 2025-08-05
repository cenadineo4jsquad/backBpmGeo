// Test pour vérifier la création automatique de titre foncier au niveau 2
const axios = require("axios");

const API_BASE = "http://localhost:3000";

async function testWorkflowTitreNiveau2() {
  console.log("🧪 Test: Création automatique de titre foncier au niveau 2");
  console.log("=".repeat(60));

  try {
    // 1. Connexion utilisateur niveau 1 (Réceptionnaire Foncier)
    console.log(
      "\n1️⃣ Connexion utilisateur niveau 1 (Réceptionnaire Foncier)..."
    );
    const loginResponse = await axios.post(`${API_BASE}/api/login`, {
      email: "reception.foncier@workflow.cm",
      mot_de_passe: "reception2025",
    });

    const token = loginResponse.data.access_token;
    const headers = { Authorization: `Bearer ${token}` };

    console.log("✅ Connexion réussie pour Réceptionnaire Foncier");

    // 2. Créer une extraction avec données géographiques (Projet ID 22)
    console.log("\n2️⃣ Création d'une extraction avec données géographiques...");
    const extractionData = {
      nom_fichier: "test-titre-niveau2.",
      donnees_extraites: {
        proprietaire: "Jean Martin Dupont",
        superficie: 5000,
        perimetre: 300,
        coordonnees_gps: [
          [11.5167, 3.8667],
          [11.52, 3.87],
          [11.515, 3.875],
          [11.512, 3.868],
          [11.5167, 3.8667],
        ],
        localite: {
          type: "commune",
          valeur: "Yaoundé 3ème",
        },
        surface_m2: 5000,
        type_titre: "Titre foncier",
      },
      projet_id: 22,
      status: "en_attente_validation",
      niveau_validation: 1,
    };

    const extractionResponse = await axios.post(
      `${API_BASE}/api/extractions`,
      extractionData,
      { headers }
    );
    const extractionId = extractionResponse.data.id;
    console.log("✅ Extraction créée avec ID:", extractionId);

    // 3. Vérifier qu'aucun titre foncier n'existe encore
    console.log("\n3️⃣ Vérification: aucun titre foncier avant soumission...");
    const titresAvant = await axios.get(`${API_BASE}/titres-fonciers`, {
      headers,
    });
    const titresAvantCount = titresAvant.data.length;
    console.log("📊 Nombre de titres fonciers avant:", titresAvantCount);

    // 4. Soumettre l'extraction au niveau suivant (niveau 2)
    console.log("\n4️⃣ Soumission de l'extraction au niveau 2...");
    const submitResponse = await axios.post(
      `${API_BASE}/extractions/${extractionId}/submit`,
      {},
      { headers }
    );

    console.log("✅ Soumission réussie:", submitResponse.data.message);

    // 5. Vérifier que l'extraction est maintenant au niveau 2
    console.log("\n5️⃣ Vérification du niveau de validation...");
    const extractionApres = await axios.get(
      `${API_BASE}/extractions/${extractionId}`,
      { headers }
    );
    console.log(
      "📊 Niveau validation après soumission:",
      extractionApres.data.niveau_validation
    );

    // 6. Vérifier qu'un titre foncier a été créé automatiquement
    console.log(
      "\n6️⃣ Vérification de la création automatique du titre foncier..."
    );
    const titresApres = await axios.get(`${API_BASE}/titres-fonciers`, {
      headers,
    });
    const titresApresCount = titresApres.data.length;

    console.log("📊 Nombre de titres fonciers après:", titresApresCount);

    if (titresApresCount > titresAvantCount) {
      console.log("🎉 SUCCESS: Titre foncier créé automatiquement !");

      // Trouver le nouveau titre foncier
      const nouveauTitre = titresApres.data[titresApres.data.length - 1];
      console.log("📋 Détails du nouveau titre foncier:");
      console.log("   - ID:", nouveauTitre.id);
      console.log("   - Propriétaire:", nouveauTitre.proprietaire);
      console.log("   - Superficie:", nouveauTitre.superficie, "m²");
      console.log("   - Périmètre:", nouveauTitre.perimetre, "m");
      console.log("   - Localité:", nouveauTitre.localite);

      // Vérifier la liaison extraction-titre
      console.log("\n7️⃣ Vérification de la liaison extraction-titre...");
      try {
        const liaisonResponse = await axios.get(
          `${API_BASE}/titres-extractions`,
          { headers }
        );
        const liaisons = liaisonResponse.data;
        const liaisonTrouvee = liaisons.find(
          (l) =>
            l.extraction_id === extractionId && l.titre_id === nouveauTitre.id
        );

        if (liaisonTrouvee) {
          console.log("✅ Liaison extraction-titre créée correctement");
        } else {
          console.log("❌ Liaison extraction-titre non trouvée");
        }
      } catch (error) {
        console.log(
          "⚠️ Impossible de vérifier les liaisons (route peut-être non disponible)"
        );
      }
    } else {
      console.log("❌ ERREUR: Aucun titre foncier créé automatiquement");
    }

    console.log("\n" + "=".repeat(60));
    console.log("🏁 Test terminé");
  } catch (error) {
    console.error("❌ Erreur durant le test:");
    console.error("Message:", error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    }
  }
}

// Exécuter le test
testWorkflowTitreNiveau2();
