// Script pour créer des utilisateurs et les assigner à leurs étapes et rôles
// Usage : node scripts/create-users-etapes-demo.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Utilisateur Extraction (ordre 1)
  const bcrypt = require("bcrypt");
  const hash = await bcrypt.hash("Test1234!", 10);
  // Extraction (ordre 1)
  let user1 = await prisma.utilisateurs.findUnique({
    where: { email: "steeve@gov.cm" },
  });
  if (!user1) {
    user1 = await prisma.utilisateurs.create({
      data: {
        nom: "cooper",
        prenom: "steeve",
        email: "steeve@gov.cm",
        mot_de_passe: hash,
        niveau_hierarchique: 1,
        localite_id: 5, // Nkolafamba
      },
    });
    await prisma.utilisateur_roles.create({
      data: {
        utilisateur_id: user1.id,
        role_id: 50,
      },
    });
    await prisma.workflows.create({
      data: {
        projet_id: 32,
        ordre: 1,
        utilisateur_id: user1.id,
        etape_nom: "Extraction",
        date_debut: new Date(),
      },
    });
    console.log("Utilisateur Extraction créé :", user1.email);
  } else {
    console.log("Utilisateur Extraction déjà existant :", user1.email);
  }

  // Utilisateur Validation (ordre 2)
  // Validation (ordre 2)
  let user2 = await prisma.utilisateurs.findUnique({
    where: { email: "joel@gov.cm" },
  });
  if (!user2) {
    user2 = await prisma.utilisateurs.create({
      data: {
        nom: "cooper",
        prenom: "joel",
        email: "joel@gov.cm",
        mot_de_passe: hash,
        niveau_hierarchique: 2,
        localite_id: 4, // Mefou et Afamba
      },
    });
    await prisma.utilisateur_roles.create({
      data: {
        utilisateur_id: user2.id,
        role_id: 51,
      },
    });
    await prisma.workflows.create({
      data: {
        projet_id: 32,
        ordre: 2,
        utilisateur_id: user2.id,
        etape_nom: "Validation",
        date_debut: new Date(),
      },
    });
    console.log("Utilisateur Validation créé :", user2.email);
  } else {
    console.log("Utilisateur Validation déjà existant :", user2.email);
  }

  // Utilisateur Approbation MINCAF (ordre 3)
  // Approbation MINCAF (ordre 3)
  let user3 = await prisma.utilisateurs.findUnique({
    where: { email: "mincaf@gov.cm" },
  });
  if (!user3) {
    user3 = await prisma.utilisateurs.create({
      data: {
        nom: "cooper",
        prenom: "mincaf",
        email: "mincaf@gov.cm",
        mot_de_passe: hash,
        niveau_hierarchique: 3,
        localite_id: 1, // MINCAF
      },
    });
    await prisma.utilisateur_roles.create({
      data: {
        utilisateur_id: user3.id,
        role_id: 52,
      },
    });
    await prisma.workflows.create({
      data: {
        projet_id: 32,
        ordre: 3,
        utilisateur_id: user3.id,
        etape_nom: "Approbation",
        date_debut: new Date(),
      },
    });
    console.log("Utilisateur Approbation créé :", user3.email);
  } else {
    console.log("Utilisateur Approbation déjà existant :", user3.email);
  }

  console.log("Utilisateurs et workflows créés pour chaque étape.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
