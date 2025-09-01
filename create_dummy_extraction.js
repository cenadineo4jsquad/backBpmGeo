const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createDummyExtraction() {
    const userId = 2; // From user's provided data
    const projectId = 11; // From user's provided data
    const filename = "20250723_200750_pdfscanner.jpg";

    const flaskResults = {
        "filename": "20250723_200750_pdfscanner.jpg",
        "results": {
            "Coordonnees": [
                [
                    788691.711,
                    441647.318
                ],
                [
                    788708.993,
                    441639.375
                ],
                [
                    788701.81,
                    441623.747
                ],
                [
                    788687.254,
                    441630.437
                ],
                [
                    788685.781,
                    441634.416
                ]
            ],
            "area_value": 323.0,
            "arrondissement_name": "Soa",
            "database_saved": true,
            "department_name": "Mefou et Afamba",
            "owner_name": "OKENE AHANDA MAMA PIE HERV",
            "partial_only": false,
            "polygon": {
                "area": 2.6240213701101162e-08,
                "bounds": [
                    11.599722156106091,
                    3.991316788467999,
                    11.599931184680232,
                    3.9915300998418504
                ],
                "centroid": [
                    11.599822364065165,
                    3.991423862116124
                ],
                "geometry": {
                    "coordinates": [
                        [
                            [
                                11.599775887849335,
                                3.9915300998418504
                            ],
                            [
                                11.599931184680232,
                                3.991457821318175
                            ],
                            [
                                11.599866099504329,
                                3.991316788467999
                            ],
                            [
                                11.599735298636295,
                                3.9913776651149115
                            ],
                            [
                                11.599722156106091,
                                3.991413667401851
                            ],
                            [
                                11.599775887849335,
                                3.9915300998418504
                            ]
                        ]
                    ],
                    "type": "Polygon"
                },
                "perimeter": 0.0006374518023342832,
                "type": "polygon"
            },
            "processing_status": "complete",
            "status": "success",
            "successful_rectangles": [
                3
            ]
        },
        "success": true
    };

    const localiteObject = {
        "id": 57,
        "type": "arrondissement",
        "valeur": "Soa"
    };

    const donneesExtraites = {
        ...flaskResults.results, // Use the 'results' part of the Flask response
        localite: localiteObject
    };

    try {
        const extraction = await prisma.extractions.create({
            data: {
                projet_id: projectId,
                utilisateur_id: userId,
                fichier: filename,
                donnees_extraites: donneesExtraites,
                seuil_confiance: 90.0, // Default value
                statut: "Extrait",
                date_extraction: new Date(), // Current date
            }
        });
        console.log("Extraction created successfully:", extraction);

    } catch (error) {
        console.error("Error creating extraction:", error);
    } finally {
        await prisma.$disconnect();
    }
}

createDummyExtraction();
