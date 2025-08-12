// Script pour réinitialiser le workflow à l'étape 1 pour l'utilisateur Alice (id: 62) sur le projet 29
// Place ce fichier dans scripts/reset-workflow-etape1.js et exécute : node scripts/reset-workflow-etape1.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function resetWorkflowToStep1() {
  const utilisateur_id = 62; // Alice
  const projet_id = 29;
  const ordre_etape_1 = 1;
  const now = new Date();

  // 1. Clôturer tous les workflows actifs pour ce user/projet
  await prisma.workflows.updateMany({
    where: {
      utilisateur_id,
      projet_id,
      date_fin: null,
    },
    data: { date_fin: now },
  });

  // 2. Réactiver le workflow de l'étape 1
  const step1 = await prisma.workflows.findFirst({
    where: {
      utilisateur_id,
      projet_id,
      ordre: ordre_etape_1,
    },
  });

  if (step1) {
    await prisma.workflows.update({
      where: { id: step1.id },
      data: {
        date_debut: now,
        date_fin: null,
      },
    });
    console.log("Workflow réinitialisé à l’étape 1 :", step1.id);
  } else {
    console.log("Aucun workflow étape 1 trouvé.");
  }
}

resetWorkflowToStep1()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
