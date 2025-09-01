import { ExtractionService } from './src/services/extraction.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testExtractionAndWorkflowCreation() {
    console.log("--- Début du test de la création d'extraction et de workflow ---");
    const extractionService = new ExtractionService();

    const userData = {"user":{"id":10,"email":"user1 @example.com","nom":"user ","prenom":"1","niveau_hierarchique":1,"projet_id":2,"localite_id":498,"localite":{"id":498,"type":"arrondissement","valeur":"Soa"},"role":{"id":6,"nom":"role 1","niveau_hierarchique":1,"description":"Utilisateur "},"etape_courante":{"nom":"etape 1","ordre":1},"niveau_etape":1},"access_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsImVtYWlsIjoidXNlcjFAZXhhbXBsZS5jb20iLCJyb2xlIjoicm9sZSAxIiwibml2ZWF1X2hpZXJhcmNoaXF1ZSI6MSwiaWF0IjoxNzU2NDgzMTU5LCJleHAiOjE3NTY0ODY3NTl9.CoRB1R3v5iXLTH_Z1eBdlBFmmvqPxhO1F5PwW1SQ81Q","refresh_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEwLCJlbWFpbCI6InVzZXIxQGV4YW1wbGUuY29tIiwiaWF0IjoxNzU2NDgzMTU5LCJleHAiOjE3NTcwODc5NTl9.GVWNKg9qKlKOaat-j9hhN-m45pq8jSX16vKvNzyUBCU"};
    const flaskResponseFixed = {
      "filename": "20250723_200750_pdfscanner.jpg",
      "results": {
        "owner_name": "OKENE AHANDA MAMA PIE HERV",
        "area_value": 323.0,
        "arrondissement_name": "Soa",
        "polygon": { "perimeter": 0.00063745, "centroid": { "x": 11.5998, "y": 3.9914 } },
        "Coordonnees": [ [ 788691.711, 441647.318 ] ]
      },
      "success": true
    };


    const extractionData = {
        projet_id: userData.user.projet_id,
        utilisateur_id: userData.user.id,
        fichier: flaskResponseFixed.filename,
        donnees_extraites: { ...flaskResponseFixed.results, localite: userData.user.localite },
        seuil_confiance: 90.0,
        statut: "Extrait",
    };

    try {
        const extraction = await extractionService.createExtraction(extractionData);
        console.log("\n[ETAPE 1: EXTRACTION] Extraction créée avec succès dans la base de données.");
        console.log(extraction);

        console.log("\n--- Vérification de la création du workflow ---");

        const workflow = await prisma.workflows.findFirst({
            where: {
                projet_id: extraction.projet_id,
            },
            orderBy: {
                id: 'desc'
            },
        });

        if (workflow) {
            console.log("\n[ETAPE 2: WORKFLOW] Un workflow a bien été créé automatiquement !");
            console.log(workflow);
            console.log("\n--------------------------------------------------");
            console.log("POUR TESTER LA SOUMISSION, UTILISEZ L'ID DE WORKFLOW CI-DESSUS.");
            console.log(`Exemple: workflow_id: ${workflow.id}`);
            console.log("--------------------------------------------------");
        } else {
            console.error("\n[ERREUR DE VÉRIFICATION] Aucun workflow n'a été trouvé pour cette extraction.");
        }

    } catch (error) {
        console.error("\n[ERREUR] Le test a échoué:", error);
    } finally {
        await prisma.$disconnect();
    }
}

testExtractionAndWorkflowCreation();
