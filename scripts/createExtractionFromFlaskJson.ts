// script/createExtractionFromFlaskJson.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Exemple de JSON Flask
const flaskJson = {
  filename: "20250723_200750_pdfscanner.jpg",
  results: {
    Coordonnees: [
      [788691.711, 441647.318],
      [788708.993, 441639.375],
      [788701.81, 441623.747],
      [788687.254, 441630.437],
      [788685.781, 441634.416]
    ],
    area_value: 323.0,
    arrondissement_name: "Soa",
    database_saved: true,
    department_name: "Mefou et Afamba",
    owner_name: "OKENE AHANDA MAMA PIE HERV",
    partial_only: false,
    polygon: {
      area: 2.6240213701101162e-08,
      bounds: [11.599722156106091, 3.991316788467999, 11.599931184680232, 3.9915300998418504],
      centroid: [11.599822364065165, 3.991423862116124],
      geometry: {
        coordinates: [
          [
            [11.599775887849335, 3.9915300998418504],
            [11.599931184680232, 3.991457821318175],
            [11.599866099504329, 3.991316788467999],
            [11.599735298636295, 3.9913776651149115],
            [11.599722156106091, 3.991413667401851],
            [11.599775887849335, 3.9915300998418504]
          ]
        ],
        type: "Polygon"
      },
      perimeter: 0.0006374518023342832,
      type: "polygon"
    },
    processing_status: "complete",
    status: "success",
    successful_rectangles: [3]
  },
  success: true
};

// Exemple d'utilisateur
const user = {
  id: 14,
  email: "steeve@gmail.com",
  nom: "Thomas",
  prenom: "jean",
  niveau_hierarchique: 1,
  projet_id: 4,
  localite_id: 69,
  localite: { id: 69, type: "arrondissement", valeur: "Soa" },
  role: { id: 11, nom: "1", niveau_hierarchique: 1, description: "Utilisateur" },
  etape_courante: { nom: "etape 1", ordre: 1 },
  niveau_etape: 1
};

async function main() {
  const donnees_extraites = {
    ...flaskJson.results,
    localite: user.localite,
  };
  const extraction = await prisma.extractions.create({
    data: {
      projet_id: user.projet_id,
      utilisateur_id: user.id,
      fichier: flaskJson.filename,
      donnees_extraites,
      seuil_confiance: 90.0,
      statut: flaskJson.results.status || 'Extrait',
      date_extraction: new Date(),
    }
  });
  console.log('Extraction créée :', extraction);
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  prisma.$disconnect();
});
