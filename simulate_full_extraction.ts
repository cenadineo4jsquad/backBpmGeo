
import { PrismaClient } from '@prisma/client';
import { titreFoncierExtractionService } from './src/features/extraction/services/titreFoncier.service';
import { createWorkflow } from './src/services/workflow.service';

const prisma = new PrismaClient();

async function runRealSimulation() {
    console.log("--- Starting Real Extraction Simulation ---");

    // 1. Define User and Flask data from the prompt
    const user = { 
        id: 80, 
        projet_id: 38, 
        localite: { id: 926, type: "arrondissement", valeur: "Soa" } 
    };

    const flaskResult = {
      filename: "20250723_200750_pdfscanner.jpg",
      results: {
        Coordonnees: [
          [788691.711, 441647.318], [788708.993, 441639.375],
          [788701.81, 441623.747], [788687.254, 441630.437],
          [788685.781, 441634.416]
        ],
        area_value: 323.0,
        arrondissement_name: "Soa",
        department_name: "Mefou et Afamba",
        owner_name: "OKENE AHANDA MAMA PIE HERV",
      },
    };
    
    // Replicate the data preparation from the controller
    const donneesAvecLocalite = {
        ...flaskResult.results,
        localite: user.localite,
    };

    try {
        // --- Step 1: Create the Extraction record ---
        const extraction = await prisma.extractions.create({
            data: {
                projet_id: user.projet_id,
                utilisateur_id: user.id,
                fichier: flaskResult.filename,
                donnees_extraites: donneesAvecLocalite,
                seuil_confiance: 90.0,
                statut: "Extrait",
                date_extraction: new Date(),
            },
        });
        console.log(`[1/3] SUCCESS: Extraction created with ID: ${extraction.id}`);

        // --- Step 2: Create the Titre Foncier from the extraction ---
        // This logic is imported from your actual application code
        const titreFoncierCree = await titreFoncierExtractionService.createTitreFromExtraction(
            extraction,
            user.id
        );

        if (!titreFoncierCree || !titreFoncierCree.id) {
            throw new Error("Titre Foncier creation returned an invalid result.");
        }
        console.log(`[2/3] SUCCESS: Titre Foncier created with ID: ${titreFoncierCree.id}`);

        // --- Step 3: Create the initial Workflow for the new Titre Foncier ---
        // This logic is also imported from your actual application code
        if (extraction.projet_id) {
            await createWorkflow(
                extraction.projet_id,
                titreFoncierCree.id,
                user.id
            );
            console.log(`[3/3] SUCCESS: Initial workflow created for Titre Foncier ID ${titreFoncierCree.id}`);
        } else {
            throw new Error("Extraction created without a projet_id, cannot create workflow.");
        }
        
        console.log("\n--- Simulation Complete ---");
        console.log(`View the results for Extraction ID: ${extraction.id}`);

    } catch (error) {
        console.error("\n--- SIMULATION FAILED ---");
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

runRealSimulation();
