const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function findExtracteurUsers() {
  try {
    console.log("🔍 Recherche des utilisateurs avec le rôle extracteur...\n");

    // Chercher le rôle extracteur
    const extracteurRole = await prisma.roles.findFirst({
      where: {
        OR: [
          { nom: { contains: "extracteur", mode: "insensitive" } },
          { nom: { contains: "Extracteur", mode: "insensitive" } },
        ],
      },
    });

    if (!extracteurRole) {
      console.log("❌ Rôle extracteur non trouvé");
      console.log("\n📋 Rôles disponibles:");
      const roles = await prisma.roles.findMany({
        select: { id: true, nom: true, description: true },
      });
      roles.forEach((r) => {
        console.log(
          `  - ID: ${r.id} | Nom: "${r.nom}" | Description: ${
            r.description || "N/A"
          }`
        );
      });
      return;
    }

    console.log(
      `✅ Rôle trouvé: "${extracteurRole.nom}" (ID: ${extracteurRole.id})`
    );

    // Chercher les utilisateurs avec ce rôle
    const usersWithRole = await prisma.utilisateur_roles.findMany({
      where: { role_id: extracteurRole.id },
      include: {
        utilisateurs: {
          select: {
            id: true,
            email: true,
            nom: true,
            prenom: true,
            niveau_hierarchique: true,
            localites: true,
            date_creation: true,
          },
        },
      },
    });

    console.log(
      `\n👥 Utilisateurs avec le rôle extracteur (${usersWithRole.length} trouvé(s)):`
    );
    console.log("=".repeat(70));

    if (usersWithRole.length === 0) {
      console.log("❌ Aucun utilisateur trouvé avec le rôle extracteur");
    } else {
      usersWithRole.forEach((userRole, index) => {
        const user = userRole.utilisateurs;
        console.log(`\n${index + 1}. 👤 UTILISATEUR EXTRACTEUR:`);
        console.log(`   🆔 ID: ${user.id}`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   👤 Nom: ${user.nom || "N/A"} ${user.prenom || ""}`);
        console.log(`   📊 Niveau: ${user.niveau_hierarchique}`);
        console.log(
          `   📍 Localités: ${
            user.localites ? JSON.stringify(user.localites) : "N/A"
          }`
        );
        console.log(
          `   📅 Créé: ${
            user.date_creation
              ? user.date_creation.toISOString().split("T")[0]
              : "N/A"
          }`
        );
      });
    }

    // Afficher aussi tous les utilisateurs pour contexte
    console.log("\n\n📋 CONTEXTE - Tous les utilisateurs:");
    console.log("=".repeat(50));

    const allUsers = await prisma.utilisateurs.findMany({
      include: {
        utilisateur_roles: {
          include: {
            roles: {
              select: { nom: true },
            },
          },
        },
      },
    });

    allUsers.forEach((user, index) => {
      const roles =
        user.utilisateur_roles.map((ur) => ur.roles.nom).join(", ") ||
        "Aucun rôle";
      console.log(
        `${index + 1}. ID: ${user.id} | Email: ${user.email} | Rôles: ${roles}`
      );
    });
  } catch (error) {
    console.error("❌ Erreur lors de la recherche:", error.message);
    console.error("Stack:", error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

findExtracteurUsers();
