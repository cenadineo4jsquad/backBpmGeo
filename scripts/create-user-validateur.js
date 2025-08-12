// scripts/activate-workflow.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const workflowId = 42; // ID du workflow à activer
  const now = new Date();

  const updated = await prisma.workflows.update({
    where: { id: workflowId },
    data: { date_debut: now },
  });

  console.log("Workflow activé :", updated);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
