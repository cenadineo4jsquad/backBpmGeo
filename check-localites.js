const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkLocalites() {
  try {
    const localites = await prisma.localites.findMany();
    console.log("🗺️ Localités disponibles:");
    localites.forEach((loc) => {
      console.log(`   - ID: ${loc.id} | Nom: ${loc.nom} | Type: ${loc.type}`);
    });
  } catch (error) {
    console.error("Erreur:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkLocalites();
