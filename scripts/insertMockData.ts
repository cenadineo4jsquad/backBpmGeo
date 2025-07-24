// Script d’insertion des données mock en TypeScript
import { Pool } from "pg";
import {
  MOCK_LOCALITES,
  MOCK_ROLES,
  MOCK_USERS,
  MOCK_PROJETS,
  MOCK_TITRES_FONCIERS,
  MOCK_ETAPES,
  MOCK_PERMISSIONS,
  MOCK_EXTRACTIONS,
  MOCK_AUDIT,
  MOCK_TACHES,
} from "../mockData";
// Insertion des extractions
async function insertExtractions() {
  for (const extraction of MOCK_EXTRACTIONS) {
    await pool.query(
      `INSERT INTO extractions (id, filename, proprietaire, coordonnees_gps, superficie, perimetre, localite, statut, etape_courante, assignee_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (id) DO NOTHING;`,
      [
        extraction.id,
        extraction.filename || null,
        extraction.proprietaire || null,
        JSON.stringify(extraction.coordonnees_gps),
        extraction.surface_m2 || null,
        extraction.perimetre_m || null,
        extraction.localite || null,
        extraction.statut || null,
        extraction.etape_courante || null,
        extraction.assignee_id || null,
        extraction.created_at || null,
        extraction.updated_at || null,
      ]
    );
  }
}

// Insertion des tâches
async function insertTaches() {
  for (const tache of MOCK_TACHES) {
    await pool.query(
      `INSERT INTO taches (id, titre, description, statut, assignee_id, etape_id, titre_foncier_id, commentaires, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (id) DO NOTHING;`,
      [
        tache.id,
        tache.titre,
        tache.description,
        tache.statut,
        tache.assignee ? tache.assignee.id : null,
        tache.etape ? tache.etape.id : null,
        tache.titre_foncier ? tache.titre_foncier.id : null,
        tache.commentaires || null,
        tache.created_at || null,
        tache.updated_at || null,
      ]
    );
  }
}

// Insertion de la table de liaison titres_extractions (liens fictifs pour démo)
async function insertTitresExtractions() {
  // On relie chaque titre foncier à la première extraction (si elle existe)
  for (const titre of MOCK_TITRES_FONCIERS) {
    if (MOCK_EXTRACTIONS[0]) {
      await pool.query(
        `INSERT INTO titres_extractions (titre_id, extraction_id) VALUES ($1, $2)
        ON CONFLICT (titre_id, extraction_id) DO NOTHING;`,
        [titre.id, MOCK_EXTRACTIONS[0].id]
      );
    }
  }
}
// Insertion des validations à partir des extractions
async function insertValidations() {
  let validationId = 1;
  for (const extraction of MOCK_EXTRACTIONS) {
    if (Array.isArray(extraction.validation_history)) {
      for (const v of extraction.validation_history) {
        // On tente de retrouver l'utilisateur par nom (sinon null)
        const user = MOCK_USERS.find(
          (u) =>
            u.nom === v.utilisateur_nom.split(" ")[1] ||
            u.nom === v.utilisateur_nom
        );
        await pool.query(
          `INSERT INTO validations (id, extraction_id, utilisateur_id, statut, commentaire, date_validation)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (id) DO NOTHING;`,
          [
            validationId++,
            extraction.id,
            user ? user.id : null,
            v.action,
            v.commentaire,
            v.created_at,
          ]
        );
      }
    }
  }
}

// Insertion des logs d'audit
async function insertAuditLogs() {
  let auditId = 1;
  for (const audit of MOCK_AUDIT) {
    const user = audit.utilisateur ? audit.utilisateur.id : null;
    // On tente de retrouver le projet par localite (optionnel)
    let projetId: string | null = null;
    if (audit.localite && audit.localite.nom) {
      const projet = MOCK_PROJETS.find(
        (p) => audit.localite.nom && p.nom.includes(audit.localite.nom)
      );
      if (projet) projetId = projet.id;
    }
    await pool.query(
      `INSERT INTO audit_logs (id, utilisateur_id, action, projet_id, details, date_action)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO NOTHING;`,
      [
        auditId++,
        user,
        audit.action,
        projetId,
        JSON.stringify({
          statut: audit.statut,
          commentaire: audit.commentaire,
        }),
        audit.created_at,
      ]
    );
  }
}
// Insertion des permissions (pour chaque rôle et chaque permission de ce rôle)
async function insertPermissions() {
  let permId = 1;
  for (const role of MOCK_ROLES) {
    for (const perm of role.permissions) {
      await pool.query(
        `INSERT INTO permissions (id, role_id, action) VALUES ($1, $2, $3)
        ON CONFLICT (id) DO NOTHING;`,
        [permId++, role.id, perm.code]
      );
    }
  }
}

// Insertion de la table de liaison utilisateur_roles (rôle principal uniquement)
async function insertUtilisateurRoles() {
  let count = 0;
  for (const user of MOCK_USERS) {
    await pool.query(
      `INSERT INTO utilisateur_roles (utilisateur_id, role_id) VALUES ($1, $2)
      ON CONFLICT (utilisateur_id, role_id) DO NOTHING;`,
      [user.id, user.role.id]
    );
    count++;
  }
  console.log(`Utilisateur_roles insérés : ${count}`);
}
async function insertEtapes() {
  for (const etape of MOCK_ETAPES) {
    await pool.query(
      `INSERT INTO etapes_workflow (id, nom, ordre, description, type, projet_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO NOTHING;`,
      [
        etape.id,
        etape.nom,
        etape.ordre,
        etape.description,
        etape.type,
        etape.projet_id,
      ]
    );
  }
}

const pool = new Pool({
  user: process.env.DB_USER || "Cenadi-Squad",
  host: "localhost",
  database: process.env.DB_NAME || "geobpm",
  password: process.env.DB_PASSWORD || "password",
  port: 5432,
});

async function insertLocalites() {
  for (const [i, loc] of MOCK_LOCALITES.entries()) {
    await pool.query(
      `INSERT INTO localites (id, type, valeur) VALUES ($1, $2, $3)
      ON CONFLICT (id) DO NOTHING;`,
      [i + 1, loc.type, loc.valeur]
    );
  }
}

async function insertRoles() {
  for (const role of MOCK_ROLES) {
    await pool.query(
      `INSERT INTO roles (id, nom) VALUES ($1, $2)
      ON CONFLICT (id) DO NOTHING;`,
      [role.id, role.nom]
    );
  }
}

async function insertUsers() {
  for (const user of MOCK_USERS) {
    await pool.query(
      `INSERT INTO utilisateurs (id, nom, prenom, email, niveau_hierarchique, localite_id, role_id) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO NOTHING;`,
      [
        user.id,
        user.nom,
        user.prenom,
        user.email,
        user.niveau_hierarchique,
        user.localite.id,
        user.role.id,
      ]
    );
  }
}

async function insertProjets() {
  for (const projet of MOCK_PROJETS) {
    await pool.query(
      `INSERT INTO projets (id, nom, description, created_at) VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) DO NOTHING;`,
      [
        projet.id,
        projet.nom,
        projet.description,
        projet.created_at || new Date(),
      ]
    );
  }
}

async function insertTitresFoncier() {
  for (const titre of MOCK_TITRES_FONCIERS) {
    await pool.query(
      `INSERT INTO titres_fonciers (id, proprietaire, coordonnees_gps, superficie, perimetre, localite, statut, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (id) DO NOTHING;`,
      [
        titre.id,
        titre.proprietaire,
        JSON.stringify(titre.coordonnees_gps),
        titre.surface_m2,
        titre.perimetre_m,
        JSON.stringify(titre.localite),
        titre.statut,
        titre.created_at,
        titre.updated_at,
      ]
    );
  }
}

async function main() {
  try {
    await insertLocalites();
    console.log("Localites insérées");
    await insertRoles();
    console.log("Roles insérés");
    await insertUsers();
    console.log("Utilisateurs insérés");
    await insertUtilisateurRoles();
    await insertProjets();
    console.log("Projets insérés");
    await insertEtapes();
    console.log("Etapes insérées");
    await insertTitresFoncier();
    console.log("Titres fonciers insérés");
    await insertPermissions();
    console.log("Permissions insérées");
    await insertValidations();
    console.log("Validations insérées");
    await insertAuditLogs();
    console.log("Audit logs insérés");
    await insertExtractions();
    console.log("Extractions insérées");
    await insertTaches();
    console.log("Tâches insérées");
    await insertTitresExtractions();
    console.log("Titres_extractions insérés");
    console.log("Mock data insérée avec succès !");
  } catch (err) {
    console.error("Erreur lors de l’insertion des données mock :", err);
  } finally {
    await pool.end();
  }
}

main();
