const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkExistingUsers() {
  try {
    console.log(
      "🔍 Vérification des utilisateurs existants dans la base de données...\n"
    );

    // Récupérer tous les utilisateurs
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

    console.log(`👥 UTILISATEURS TROUVÉS (${allUsers.length} total):`);
    console.log("=".repeat(80));

    if (allUsers.length === 0) {
      console.log("❌ Aucun utilisateur trouvé dans la base de données!");
      return;
    }

    allUsers.forEach((user, index) => {
      const roles =
        user.utilisateur_roles.map((ur) => ur.roles.nom).join(", ") ||
        "Aucun rôle";

      console.log(`\n${index + 1}. 👤 UTILISATEUR:`);
      console.log(`   🆔 ID: ${user.id}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🔑 Mot de passe: ${user.mot_de_passe}`);
      console.log(`   👤 Nom: ${user.prenom || "N/A"} ${user.nom || "N/A"}`);
      console.log(`   📊 Niveau: ${user.niveau_hierarchique}`);
      console.log(`   📍 Localité ID: ${user.localite_id || "N/A"}`);
      console.log(`   👥 Rôles: ${roles}`);
      console.log(
        `   📅 Créé: ${
          user.date_creation
            ? user.date_creation.toISOString().split("T")[0]
            : "N/A"
        }`
      );
    });

    // Chercher des utilisateurs spécifiques créés récemment
    console.log("\n\n🔍 UTILISATEURS RÉCENTS (créés aujourd'hui):");
    console.log("=".repeat(50));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const recentUsers = allUsers.filter(
      (user) => user.date_creation && new Date(user.date_creation) >= today
    );

    if (recentUsers.length === 0) {
      console.log("❌ Aucun utilisateur créé aujourd'hui");
    } else {
      recentUsers.forEach((user, index) => {
        console.log(`${index + 1}. 📧 ${user.email} | 🔑 ${user.mot_de_passe}`);
      });
    }

    // Proposer de créer un utilisateur de test simple
    console.log("\n\n🚀 CRÉATION D'UN UTILISATEUR DE TEST:");
    console.log("=".repeat(50));

    const testUser = await prisma.utilisateurs.create({
      data: {
        email: "test.workflow@bpm.cm",
        nom: "Test",
        prenom: "User",
        mot_de_passe: "test123",
        niveau_hierarchique: 1,
        localite_id: 1,
      },
    });

    console.log("✅ Utilisateur de test créé:");
    console.log(`   📧 Email: ${testUser.email}`);
    console.log(`   🔑 Mot de passe: test123`);
    console.log(`   🆔 ID: ${testUser.id}`);

    // Vérifier le rôle extracteur
    console.log("\n\n🔍 VÉRIFICATION RÔLE EXTRACTEUR:");
    console.log("=".repeat(50));

    const extracteurRole = await prisma.roles.findFirst({
      where: {
        nom: { contains: "extracteur", mode: "insensitive" },
      },
    });

    if (extracteurRole) {
      console.log(`✅ Rôle extracteur trouvé: ID ${extracteurRole.id}`);

      // Assigner le rôle extracteur à l'utilisateur de test
      await prisma.utilisateur_roles.create({
        data: {
          utilisateur_id: testUser.id,
          role_id: extracteurRole.id,
        },
      });

      console.log(`✅ Rôle extracteur assigné à ${testUser.email}`);
    } else {
      console.log("❌ Rôle extracteur non trouvé");
    }
  } catch (error) {
    console.error("❌ Erreur:", error.message);
    if (error.code === "P2002") {
      console.log("💡 L'utilisateur test.workflow@bpm.cm existe déjà");

      // Récupérer l'utilisateur existant
      const existingUser = await prisma.utilisateurs.findUnique({
        where: { email: "test.workflow@bpm.cm" },
      });

      if (existingUser) {
        console.log(`📧 Email: ${existingUser.email}`);
        console.log(`🔑 Mot de passe: ${existingUser.mot_de_passe}`);
        console.log(`🆔 ID: ${existingUser.id}`);
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkExistingUsers();
