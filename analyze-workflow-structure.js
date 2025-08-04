const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function analyzeWorkflowTables() {
  try {
    console.log("🔍 Analyse de la structure des tables workflows...\n");

    // 1. Vérifier la structure de la table workflows
    console.log("📋 Structure de la table workflows:");
    const workflows = await prisma.workflows.findMany({
      where: { projet_id: 22 },
      take: 3,
    });

    if (workflows.length > 0) {
      console.log("Colonnes disponibles dans workflows:");
      console.log(Object.keys(workflows[0]));
      console.log("\nPremier workflow:", JSON.stringify(workflows[0], null, 2));
    } else {
      console.log("❌ Aucun workflow trouvé pour le projet 22");
    }

    // 2. Vérifier la structure de la table etapes_workflow
    console.log("\n📋 Structure de la table etapes_workflow:");
    const etapes = await prisma.etapes_workflow.findMany({
      where: { projet_id: 22 },
      take: 3,
    });

    if (etapes.length > 0) {
      console.log("Colonnes disponibles dans etapes_workflow:");
      console.log(Object.keys(etapes[0]));
      console.log("\nPremière étape:", JSON.stringify(etapes[0], null, 2));
    } else {
      console.log("❌ Aucune étape trouvée pour le projet 22");
    }

    // 3. Trouver l'utilisateur de l'étape 1 pour le projet 22
    console.log(
      "\n🔍 Recherche de l'utilisateur de l'étape 1 pour le projet 22:"
    );

    // Essayer différentes approches selon la structure
    try {
      // Approche 1: Via etapes_workflow directement
      const etape1 = await prisma.etapes_workflow.findFirst({
        where: {
          projet_id: 22,
          ordre: 1,
        },
      });

      if (etape1) {
        console.log("✅ Étape 1 trouvée:", JSON.stringify(etape1, null, 2));

        // Chercher le workflow correspondant
        const workflow = await prisma.workflows.findFirst({
          where: {
            projet_id: 22,
            etape_nom: etape1.nom,
          },
        });

        if (workflow) {
          console.log(
            "✅ Workflow correspondant:",
            JSON.stringify(workflow, null, 2)
          );
        }
      }
    } catch (error) {
      console.log("❌ Erreur approche 1:", error.message);
    }

    // 4. Afficher tous les workflows du projet 22
    console.log("\n📊 Tous les workflows du projet 22:");
    const allWorkflows = await prisma.workflows.findMany({
      where: { projet_id: 22 },
    });

    allWorkflows.forEach((w, index) => {
      console.log(`Workflow ${index + 1}:`, JSON.stringify(w, null, 2));
    });
  } catch (error) {
    console.error("❌ Erreur:", error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeWorkflowTables();
