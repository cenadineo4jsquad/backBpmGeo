// Script pour lister tous les utilisateurs
const { PrismaClient } = require("@prisma/client");

async function listUsers() {
  const prisma = new PrismaClient();

  try {
    console.log("👥 Liste de tous les utilisateurs:\n");

    const users = await prisma.utilisateurs.findMany({
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        niveau_hierarchique: true,
        localites: {
          select: {
            valeur: true,
          },
        },
      },
      orderBy: { id: "asc" },
    });

    users.forEach((user) => {
      console.log(
        `ID: ${user.id.toString().padStart(3)} | Email: ${user.email.padEnd(
          30
        )} | ${user.prenom} ${user.nom} | Niveau: ${
          user.niveau_hierarchique
        } | Localité: ${user.localites?.valeur || "Aucune"}`
      );
    });

    console.log(`\n📊 Total: ${users.length} utilisateurs`);
  } catch (error) {
    console.error("❌ Erreur:", error);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();
