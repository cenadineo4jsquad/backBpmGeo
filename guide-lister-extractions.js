/**
 * GUIDE : Comment lister les extractions déjà faites
 */

const axios = require("axios");

async function demonstrationListeExtractions() {
  console.log("📋 GUIDE : LISTER LES EXTRACTIONS DÉJÀ FAITES");
  console.log("=".repeat(60));

  try {
    // 1. Connexion obligatoire
    console.log("🔐 1. Connexion (obligatoire pour toutes les routes)");
    const loginResponse = await axios.post("http://localhost:3000/api/login", {
      email: "reception.foncier@workflow.cm",
      mot_de_passe: "reception2025",
    });

    const token = loginResponse.data.access_token;
    console.log("✅ Token récupéré");

    // 2. Liste TOUTES les extractions
    console.log("\n📋 2. GET /api/extractions - Liste toutes les extractions");
    console.log("   🔗 URL: http://localhost:3000/api/extractions");

    const allExtractions = await axios.get(
      "http://localhost:3000/api/extractions",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log(`   ✅ ${allExtractions.data.length} extractions trouvées`);

    if (allExtractions.data.length > 0) {
      console.log("   📊 Exemple d'extraction:");
      const exemple = allExtractions.data[0];
      console.log("   {");
      console.log(`     "id": ${exemple.id},`);
      console.log(`     "projet_id": ${exemple.projet_id},`);
      console.log(`     "utilisateur_id": ${exemple.utilisateur_id},`);
      console.log(`     "fichier": "${exemple.fichier}",`);
      console.log(`     "statut": "${exemple.statut}",`);
      console.log(`     "date_extraction": "${exemple.date_extraction}",`);
      console.log(`     "seuil_confiance": ${exemple.seuil_confiance}`);
      console.log("   }");
    }

    // 3. Filtres disponibles
    console.log("\n🔍 3. Filtres disponibles (paramètres query):");

    // Filtre par projet
    console.log("\n   📁 Filtrer par projet:");
    console.log("   🔗 GET /api/extractions?projet_id=22");
    const projetFilter = await axios.get(
      "http://localhost:3000/api/extractions?projet_id=22",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    console.log(
      `   ✅ ${projetFilter.data.length} extractions pour le projet 22`
    );

    // Filtre par statut
    console.log("\n   📊 Filtrer par statut:");
    console.log("   🔗 GET /api/extractions?statut=Extrait");
    const statutFilter = await axios.get(
      "http://localhost:3000/api/extractions?statut=Extrait",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    console.log(
      `   ✅ ${statutFilter.data.length} extractions avec statut 'Extrait'`
    );

    // Filtre par utilisateur
    console.log("\n   👤 Filtrer par utilisateur:");
    console.log("   🔗 GET /api/extractions?utilisateur_id=44");
    const userFilter = await axios.get(
      "http://localhost:3000/api/extractions?utilisateur_id=44",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    console.log(
      `   ✅ ${userFilter.data.length} extractions pour l'utilisateur 44`
    );

    // Combinaison de filtres
    console.log("\n   🎯 Combinaison de filtres:");
    console.log(
      "   🔗 GET /api/extractions?projet_id=22&statut=Extrait&utilisateur_id=44"
    );
    const combined = await axios.get(
      "http://localhost:3000/api/extractions?projet_id=22&statut=Extrait&utilisateur_id=44",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    console.log(
      `   ✅ ${combined.data.length} extractions avec tous les filtres`
    );

    // 4. Détail d'une extraction
    if (allExtractions.data.length > 0) {
      const firstId = allExtractions.data[0].id;
      console.log("\n🔍 4. Détail d'une extraction spécifique:");
      console.log(`   🔗 GET /api/extractions/${firstId}`);

      const detail = await axios.get(
        `http://localhost:3000/api/extractions/${firstId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("   ✅ Détail récupéré:");
      console.log("   📄 Données extraites:");
      if (detail.data.donnees_extraites) {
        console.log(JSON.stringify(detail.data.donnees_extraites, null, 6));
      } else {
        console.log("      Aucune donnée extraite");
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

function afficherDocumentationAPI() {
  console.log("\n" + "=".repeat(60));
  console.log("📚 DOCUMENTATION COMPLÈTE DES ROUTES D'EXTRACTION");
  console.log("=".repeat(60));

  console.log("\n🔗 1. LISTER TOUTES LES EXTRACTIONS");
  console.log("   Méthode: GET");
  console.log("   URL: http://localhost:3000/api/extractions");
  console.log("   Headers: Authorization: Bearer {token}");
  console.log("   Filtres optionnels:");
  console.log("     - ?projet_id=22          # Filtrer par projet");
  console.log("     - ?statut=Extrait        # Filtrer par statut");
  console.log("     - ?utilisateur_id=44     # Filtrer par utilisateur");
  console.log("     - Combinaisons possibles");

  console.log("\n🔍 2. DÉTAIL D'UNE EXTRACTION");
  console.log("   Méthode: GET");
  console.log("   URL: http://localhost:3000/api/extractions/{id}");
  console.log("   Headers: Authorization: Bearer {token}");

  console.log("\n📊 3. STATUTS POSSIBLES");
  console.log("   - 'Extrait'    # Extraction terminée");
  console.log("   - 'En cours'   # En cours de traitement");
  console.log("   - 'Corrigé'    # Corrigée manuellement");
  console.log("   - 'Validé'     # Validée");
  console.log("   - 'Rejeté'     # Rejetée");

  console.log("\n🔐 4. PERMISSIONS");
  console.log(
    "   - Niveau 1-2: Voient uniquement les extractions de leur localité"
  );
  console.log("   - Niveau 3-4: Voient toutes les extractions");
  console.log("   - Pour le détail: Seul le créateur ou niveau 3-4 peut voir");

  console.log("\n📝 5. FORMAT DE RÉPONSE");
  console.log("   {");
  console.log('     "id": 123,');
  console.log('     "projet_id": 22,');
  console.log('     "utilisateur_id": 44,');
  console.log('     "fichier": "document.pdf",');
  console.log('     "donnees_extraites": { ... },');
  console.log('     "seuil_confiance": 90.5,');
  console.log('     "statut": "Extrait",');
  console.log('     "date_extraction": "2025-08-04T10:30:00.000Z"');
  console.log("   }");

  console.log("\n💡 6. EXEMPLES CURL");
  console.log("   # Liste toutes");
  console.log('   curl -H "Authorization: Bearer {token}" \\');
  console.log("        http://localhost:3000/api/extractions");
  console.log("");
  console.log("   # Filtre par projet");
  console.log('   curl -H "Authorization: Bearer {token}" \\');
  console.log('        "http://localhost:3000/api/extractions?projet_id=22"');
  console.log("");
  console.log("   # Détail d'une extraction");
  console.log('   curl -H "Authorization: Bearer {token}" \\');
  console.log("        http://localhost:3000/api/extractions/123");
}

async function runDemo() {
  await demonstrationListeExtractions();
  afficherDocumentationAPI();
}

if (require.main === module) {
  runDemo();
}

module.exports = { demonstrationListeExtractions, afficherDocumentationAPI };
