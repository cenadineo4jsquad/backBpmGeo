const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function createUserWithHashedPassword() {
  try {
    console.log(
      "🔐 Création d'un utilisateur niveau 1 avec mot de passe hashé...\n"
    );

    // Hash du mot de passe
    const plainPassword = "cadastre2025";
    const hashedPassword = await bcrypt.hash(plainPassword, 12);

    console.log(`📧 Email: validateur.cadastral.hashed@cadastre.cm`);
    console.log(`🔑 Mot de passe (plain): ${plainPassword}`);
    console.log(
      `🔒 Mot de passe (hashed): ${hashedPassword.substring(0, 30)}...\n`
    );

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.utilisateurs.findUnique({
      where: { email: "validateur.cadastral.hashed@cadastre.cm" },
    });

    if (existingUser) {
      console.log("⚠️ Utilisateur déjà existant, mise à jour...");

      // Mise à jour du mot de passe
      const updatedUser = await prisma.utilisateurs.update({
        where: { email: "validateur.cadastral.hashed@cadastre.cm" },
        data: { mot_de_passe: hashedPassword },
      });

      console.log(
        `✅ Mot de passe mis à jour pour l'utilisateur ID: ${updatedUser.id}`
      );
    } else {
      // Créer le nouvel utilisateur
      const newUser = await prisma.utilisateurs.create({
        data: {
          email: "validateur.cadastral.hashed@cadastre.cm",
          nom: "Nguema",
          prenom: "Alain-Patrick",
          mot_de_passe: hashedPassword,
          niveau_hierarchique: 1,
          localite_id: 3, // Soa
        },
      });

      console.log(
        `✅ Utilisateur créé: ID ${newUser.id} - ${newUser.prenom} ${newUser.nom}`
      );

      // Assigner le rôle cadastral_validator
      const role = await prisma.roles.findFirst({
        where: { nom: "cadastral_validator" },
      });

      if (role) {
        await prisma.utilisateur_roles.create({
          data: {
            utilisateur_id: newUser.id,
            role_id: role.id,
          },
        });
        console.log(`✅ Rôle "${role.nom}" assigné à l'utilisateur`);
      }
    }

    // Vérification de la création/mise à jour
    console.log("\n🔍 Vérification des données utilisateur...");
    const user = await prisma.utilisateurs.findUnique({
      where: { email: "validateur.cadastral.hashed@cadastre.cm" },
      include: {
        localite: true,
        utilisateur_roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (user) {
      console.log("📋 Informations utilisateur:");
      console.log(`   🆔 ID: ${user.id}`);
      console.log(`   👤 Nom: ${user.prenom} ${user.nom}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   📊 Niveau: ${user.niveau_hierarchique}`);
      console.log(
        `   📍 Localité: ${user.localite?.nom || "N/A"} (ID: ${
          user.localite_id
        })`
      );
      console.log(
        `   🔒 Mot de passe hashé: ${user.mot_de_passe ? "Oui" : "Non"}`
      );

      if (user.utilisateur_roles.length > 0) {
        console.log("   👥 Rôles:");
        user.utilisateur_roles.forEach((ur) => {
          console.log(
            `      - ${ur.role.nom} (ID: ${ur.role.id}) - Niveau: ${ur.role.niveau_hierarchique}`
          );
        });
      }

      // Test de vérification du mot de passe
      const isPasswordValid = await bcrypt.compare(
        plainPassword,
        user.mot_de_passe
      );
      console.log(
        `   ✅ Vérification mot de passe: ${
          isPasswordValid ? "VALIDE" : "INVALIDE"
        }`
      );
    }

    console.log("\n🎯 IDENTIFIANTS DE CONNEXION:");
    console.log(`📧 Email: validateur.cadastral.hashed@cadastre.cm`);
    console.log(`🔑 Mot de passe: ${plainPassword}`);
  } catch (error) {
    console.error("❌ Erreur:", error.message);
    console.error("Stack:", error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

createUserWithHashedPassword();
