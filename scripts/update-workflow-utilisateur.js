const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function updateWorkflowUtilisateur() {
  const titre_foncier_id = 2;
  const utilisateur_id = 15;

  try {
    // Mettre à jour le workflow avec titre_foncier_id = 2 pour ajouter utilisateur_id = 15
    const updatedWorkflow = await prisma.workflows.updateMany({
      where: {
        titre_foncier_id: titre_foncier_id,
      },
      data: {
        utilisateur_id: utilisateur_id,
      },
    });

    console.log(`Workflows mis à jour: ${updatedWorkflow.count}`);
  } catch (error) {
    console.error("Erreur lors de la mise à jour:", error);
  } finally {
    await prisma.$disconnect();
  }
}

updateWorkflowUtilisateur();
