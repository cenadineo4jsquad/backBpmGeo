/**
 * Test de debug pour la liste vide des extractions
 */

const axios = require("axios");

async function debugListeExtractions() {
  console.log("🔍 DEBUG : POURQUOI LA LISTE EST VIDE ?");
  console.log("=".repeat(50));

  try {
    // 1. Connexion
    console.log("🔐 1. Connexion...");
    const loginResponse = await axios.post("http://localhost:3000/api/login", {
      email: "reception.foncier@workflow.cm",
      mot_de_passe: "reception2025",
    });

    const token = loginResponse.data.access_token;
    console.log(
      "✅ Connecté - Utilisateur:",
      loginResponse.data.user || "Info non disponible"
    );

    // 2. Test de la route des extractions avec debug détaillé
    console.log("\n📋 2. Test GET /api/extractions...");

    const response = await axios.get("http://localhost:3000/api/extractions", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      validateStatus: () => true, // Accepter tous les codes de statut
    });

    console.log("📊 Réponse reçue:");
    console.log("   Status:", response.status);
    console.log("   Headers:", response.headers["content-type"]);
    console.log("   Data:", JSON.stringify(response.data, null, 2));

    // 3. Vérifier s'il y a des extractions dans la base de données
    if (Array.isArray(response.data) && response.data.length === 0) {
      console.log("\n⚠️  Liste vide détectée !");
      console.log("   Causes possibles:");
      console.log("   1. Aucune extraction n'a été créée");
      console.log("   2. Problème de filtrage (localité, permissions)");
      console.log("   3. Problème de requête SQL");
      console.log("   4. Base de données vide");
    }

    // 4. Test avec différents filtres pour voir si le problème vient du filtrage
    console.log("\n🔍 3. Tests avec filtres...");

    console.log("   📁 Test avec projet_id=22:");
    const projetTest = await axios.get(
      "http://localhost:3000/api/extractions?projet_id=22",
      {
        headers: { Authorization: `Bearer ${token}` },
        validateStatus: () => true,
      }
    );
    console.log("      Résultat:", projetTest.data.length || 0, "extractions");

    console.log("   👤 Test avec utilisateur_id=44:");
    const userTest = await axios.get(
      "http://localhost:3000/api/extractions?utilisateur_id=44",
      {
        headers: { Authorization: `Bearer ${token}` },
        validateStatus: () => true,
      }
    );
    console.log("      Résultat:", userTest.data.length || 0, "extractions");

    // 5. Vérifier les informations de l'utilisateur connecté
    console.log("\n👤 4. Informations utilisateur connecté:");
    const meResponse = await axios.get("http://localhost:3000/api/me", {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log("   ID:", meResponse.data.id);
    console.log("   Niveau:", meResponse.data.niveau_hierarchique);
    console.log("   Localités:", meResponse.data.localites || "Non définies");

    if (meResponse.data.niveau_hierarchique <= 2) {
      console.log("\n⚠️  ATTENTION: Utilisateur niveau 1-2");
      console.log("   → Les extractions sont filtrées par localité");
      console.log(
        "   → Seules les extractions de la localité de l'utilisateur sont visibles"
      );

      if (!meResponse.data.localites) {
        console.log("   ❌ PROBLÈME: Utilisateur sans localité définie");
        console.log("   → Aucune extraction ne sera visible");
      }
    }
  } catch (error) {
    console.error("\n❌ Erreur:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
  }
}

async function testCreationExtraction() {
  console.log("\n" + "=".repeat(50));
  console.log("💡 SUGGESTION: CRÉER UNE EXTRACTION DE TEST");
  console.log("=".repeat(50));

  console.log("Si aucune extraction n'existe, voici comment en créer une:");
  console.log("");
  console.log("1. 🔧 Méthode via upload d'un fichier:");
  console.log("   POST /api/extraction/upload");
  console.log("   - Fichier: image ou PDF");
  console.log("   - projet_id: 22");
  console.log(
    '   - localite: { "type": "Arrondissement", "valeur": "Douala 1er" }'
  );
  console.log("");
  console.log("2. 🗃️  Méthode via insertion directe en base:");
  console.log("   Insérer directement dans la table 'extractions'");
  console.log("");
  console.log("3. 📊 Vérifier la base de données:");
  console.log("   SELECT COUNT(*) FROM extractions;");
  console.log("   SELECT * FROM extractions LIMIT 5;");
}

async function runDebug() {
  await debugListeExtractions();
  await testCreationExtraction();
}

if (require.main === module) {
  runDebug();
}

module.exports = { debugListeExtractions };
