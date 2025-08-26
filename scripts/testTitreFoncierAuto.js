// Connexion PostgreSQL native
const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT ? parseInt(process.env.PGPORT) : 5432,
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'steeve10',
  database: process.env.PGDATABASE || 'geobpm',
});

async function testCreationTitreFoncierAuto() {
  // ...l'utilisateur existe déjà, on ne l'insère plus

  // 1. Insérer une extraction factice pour cet utilisateur avec les données fournies
  const extractionData = {
    proprietaire: "OKENE AHANDA MAMA PIE HERV",
    coordonnees_gps: [
      [11.599775887849335, 3.9915300998418504],
      [11.599931184680232, 3.991457821318175],
      [11.599866099504329, 3.991316788467999],
      [11.599735298636295, 3.9913776651149115],
      [11.599722156106091, 3.991413667401851],
      [11.599775887849335, 3.9915300998418504]
    ],
    superficie: 323.0,
    perimetre: 0.0006374518023342832,
    localite: { id: 57, type: "arrondissement", valeur: "Soa" },
    departement: "Mefou et Afamba",
    centroid: [11.599822364065165, 3.991423862116124],
    status: "success",
    processing_status: "complete",
    successful_rectangles: [3],
    partial_only: false,
    database_saved: true
  };
  const extractionInsert = await pool.query(
    `INSERT INTO extractions (projet_id, utilisateur_id, fichier, donnees_extraites, seuil_confiance, statut, date_extraction)
     VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *;`,
    [
      12,
      10,
      "20250723_200750_pdfscanner.jpg",
      JSON.stringify(extractionData),
      90,
      "Extrait"
    ]
  );
  const extraction = extractionInsert.rows[0];

  // 2. Simuler la création du titre foncier (normalement automatique dans le backend)
  const titreInsert = await pool.query(
    `INSERT INTO titres_fonciers (projet_id, proprietaire, coordonnees_gps, superficie, perimetre, localite)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;`,
    [
      extraction.projet_id,
      "OKENE AHANDA MAMA PIE HERV",
      JSON.stringify([
        [11.599775887849335, 3.9915300998418504],
        [11.599931184680232, 3.991457821318175],
        [11.599866099504329, 3.991316788467999],
        [11.599735298636295, 3.9913776651149115],
        [11.599722156106091, 3.991413667401851],
        [11.599775887849335, 3.9915300998418504]
      ]),
      323.0,
      0.0006374518023342832,
      JSON.stringify({ id: 57, type: "arrondissement", valeur: "Soa" })
    ]
  );
  const titre = titreInsert.rows[0];

  // 3. Créer la liaison extraction-titre
  await pool.query(
    `INSERT INTO titres_extractions (extraction_id, titre_id) VALUES ($1, $2);`,
    [extraction.id, titre.id]
  );

  // 4. Vérifier la création du titre foncier
  const titres = await pool.query(
    "SELECT * FROM titres_fonciers WHERE proprietaire = $1",
    ["OKENE AHANDA MAMA PIE HERV"]
  );
  if (titres.rows.length > 0) {
    console.log("✅ Titre foncier créé automatiquement :", titres.rows[0]);
  } else {
    console.error("❌ Aucun titre foncier créé !");
  }

  // 5. Vérifier la liaison extraction-titre
  const liaison = await pool.query(
    "SELECT * FROM titres_extractions WHERE extraction_id = $1",
    [extraction.id]
  );
  if (liaison.rows.length > 0) {
    console.log("✅ Liaison extraction-titre foncier OK :", liaison.rows[0]);
  } else {
    console.error("❌ Liaison extraction-titre foncier manquante !");
  }

  await pool.end();
}

testCreationTitreFoncierAuto().catch(console.error);
