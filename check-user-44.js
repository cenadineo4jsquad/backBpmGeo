// Script pour vérifier l'utilisateur ID 44
const { PrismaClient } = require("@prisma/client");

async function checkUser() {
  const prisma = new PrismaClient();

  try {
    console.log("🔍 Recherche utilisateur ID 44...\n");

    const user = await prisma.utilisateurs.findUnique({
      where: { id: 44 },
      include: {
        localites: true,
        utilisateur_roles: {
          include: {
            roles: true,
          },
        },
      },
    });

    if (user) {
      console.log("✅ Utilisateur trouvé:");
      console.log(`   ID: ${user.id}`);
      console.log(`   Nom: ${user.nom}`);
      console.log(`   Prénom: ${user.prenom}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Niveau: ${user.niveau_hierarchique}`);
      console.log(
        `   Localité: ${user.localites ? user.localites.valeur : "Aucune"}`
      );
      console.log(
        `   Rôles: ${user.utilisateur_roles
          .map((ur) => ur.roles.nom_role)
          .join(", ")}`
      );
    } else {
      console.log("❌ Utilisateur ID 44 non trouvé");
    }
  } catch (error) {
    console.error("❌ Erreur:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
