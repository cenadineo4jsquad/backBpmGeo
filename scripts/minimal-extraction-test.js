const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function minimalExtractionTest() {
    const userId = 80;
    const projectId = 38;

    const localiteObject = {
        "id": 57,
        "type": "arrondissement",
        "valeur": "Soa"
    };

    const donneesExtraites = {
        localite: localiteObject
    };

    try {
        const extraction = await prisma.extractions.create({
            data: {
                projet_id: projectId,
                utilisateur_id: userId,
                fichier: "minimal_test_with_localite.jpg",
                donnees_extraites: donneesExtraites,
                statut: "Extrait",
            }
        });
        console.log("Minimal extraction created successfully:", extraction);

    } catch (error) {
        console.error("Error creating minimal extraction:", error);
    } finally {
        await prisma.$disconnect();
    }
}

minimalExtractionTest();
