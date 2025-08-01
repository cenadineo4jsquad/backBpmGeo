const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function debugUserLocalite() {
  try {
    console.log("🔍 Analyse détaillée de la localité utilisateur...\n");

    const user = await prisma.utilisateurs.findUnique({
      where: { id: 44 },
      include: {
        localites: true,
      },
    });

    if (!user) {
      console.log("❌ Utilisateur non trouvé");
      return;
    }

    console.log("👤 Données utilisateur:");
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   localite_id: ${user.localite_id}`);
    console.log(`   niveau_hierarchique: ${user.niveau_hierarchique}`);

    console.log("\n📍 Localité associée:");
    if (user.localites) {
      console.log(`   ID: ${user.localites.id}`);
      console.log(`   Type: "${user.localites.type}"`);
      console.log(`   Valeur: "${user.localites.valeur}"`);
      console.log(
        `   JSON complet: ${JSON.stringify({
          type: user.localites.type,
          valeur: user.localites.valeur,
        })}`
      );
    } else {
      console.log("   ❌ Aucune localité trouvée");
    }

    // Vérifier toutes les localités "Soa"
    console.log('\n🔍 Recherche de toutes les localités "Soa":');
    const localitesSoa = await prisma.localites.findMany({
      where: {
        valeur: { contains: "Soa" },
      },
    });

    localitesSoa.forEach((loc) => {
      console.log(
        `   ID: ${loc.id}, Type: "${loc.type}", Valeur: "${loc.valeur}"`
      );
    });

    // Test de correspondance exacte
    console.log("\n✅ Test de correspondance:");
    const testLocalite = {
      type: "arrondissement",
      valeur: "Soa",
    };

    console.log(`Test localité: ${JSON.stringify(testLocalite)}`);
    if (user.localites) {
      const match =
        user.localites.type === testLocalite.type &&
        user.localites.valeur === testLocalite.valeur;
      console.log(`Correspondance: ${match ? "✅ OUI" : "❌ NON"}`);
      console.log(
        `   Type match: ${
          user.localites.type === testLocalite.type ? "✅" : "❌"
        } ("${user.localites.type}" vs "${testLocalite.type}")`
      );
      console.log(
        `   Valeur match: ${
          user.localites.valeur === testLocalite.valeur ? "✅" : "❌"
        } ("${user.localites.valeur}" vs "${testLocalite.valeur}")`
      );
    }
  } catch (error) {
    console.error("❌ Erreur:", error);
  } finally {
    await prisma.$disconnect();
  }
}

debugUserLocalite();
