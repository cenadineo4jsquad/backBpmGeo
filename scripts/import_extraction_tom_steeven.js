// Script d'import d'une extraction pour l'utilisateur tom steeven (ID 10)
// Placez ce fichier dans le dossier scripts/

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  await prisma.extractions.create({
    data: {
      utilisateur_id: 10, // ID de tom steeven
      projet_id: 12, // ID du projet Cadastre Test
      workflow_id: null, // à renseigner si tu as l'ID du workflow, sinon null
      fichier: "20250723_200750_pdfscanner.jpg",
      donnees_extraites: {
        polygon: {
          area: 2.6240213701101162e-08,
          bounds: [
            11.599722156106091,
            3.991316788467999,
            11.599931184680232,
            3.9915300998418504
          ],
          centroid: [
            11.599822364065165,
            3.991423862116124
          ],
          geometry: {
            coordinates: [
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
            type: "Polygon"
          },
          perimeter: 0.0006374518023342832,
          type: "polygon"
        },
        processing_status: "complete",
        status: "success",
        successful_rectangles: [3],
        database_saved: true
      },
      area_value: 323.0,
      arrondissement_name: "Soa",
      department_name: "Mefou et Afamba",
      owner_name: "OKENE AHANDA MAMA PIE HERV",
      coordonnees: [
        [788691.711, 441647.318],
        [788708.993, 441639.375],
        [788701.81, 441623.747],
        [788687.254, 441630.437],
        [788685.781, 441634.416]
      ],
      partial_only: false,
      statut: "success"
    }
  });
  console.log("Extraction importée avec succès pour l'utilisateur tom steeven.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
