// Script de seed pour Prisma à partir des mocks
import { PrismaClient } from "@prisma/client";
import {
  MOCK_PERMISSIONS,
  MOCK_LOCALITES,
  MOCK_ROLES,
  MOCK_USERS,
  MOCK_PROJETS,
  MOCK_ETAPES,
  MOCK_TITRES_FONCIERS,
  MOCK_TACHES,
  MOCK_AUDIT,
  MOCK_UTILISATEUR_ROLES,
} from "./mockData";

const prisma = new PrismaClient();

async function main() {
  // Nettoyage des tables (ordre important pour respecter les contraintes de clés étrangères)
  await prisma.utilisateur_roles.deleteMany();
  await prisma.permissions.deleteMany();
  await prisma.utilisateurs.deleteMany();
  await prisma.roles.deleteMany();
  await prisma.etapes_workflow.deleteMany();
  await prisma.titres_fonciers.deleteMany();
  await prisma.projets.deleteMany();
  await prisma.localites.deleteMany();
  await prisma.audit_logs.deleteMany();
  // 1. Insertion Localités (mapping string->number)
  const localiteIdMap = new Map();
  for (const loc of MOCK_LOCALITES) {
    const created = await prisma.localites.create({
      data: {
        type: loc.type,
        valeur: loc.valeur,
      },
    });
    localiteIdMap.set(loc.id, created.id);
  }

  // 2. Insertion Rôles (mapping string->number)
  const roleIdMap = new Map();
  for (const role of MOCK_ROLES) {
    const created = await prisma.roles.create({
      data: {
        nom: role.nom,
        description: role.description ?? null,
      },
    });
    roleIdMap.set(role.id, created.id);
  }

  // 3. Insertion Utilisateurs (mapping string->number)
  const userIdMap = new Map();
  for (const user of MOCK_USERS) {
    const created = await prisma.utilisateurs.create({
      data: {
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        mot_de_passe: user.mot_de_passe ?? "password",
        niveau_hierarchique: user.niveau_hierarchique,
        localite_id: user.localite ? localiteIdMap.get(user.localite.id) : null,
      },
    });
    userIdMap.set(user.id, created.id);
  }

  // 4. Insertion Permissions (mapping string->number, relation role_id)
  for (const perm of MOCK_PERMISSIONS) {
    await prisma.permissions.create({
      data: {
        action: perm.code || perm.action || perm.nom,
        role_id: perm.role_id ? roleIdMap.get(perm.role_id) : null,
      },
    });
  }

  // 5. Table de liaison utilisateur_roles (mapping string->number)
  for (const ur of MOCK_UTILISATEUR_ROLES) {
    const utilisateur_id = userIdMap.get(ur.utilisateur_id);
    const role_id = roleIdMap.get(ur.role_id);
    if (!utilisateur_id || !role_id) {
      console.warn(
        `Impossible de trouver l'id numérique pour user ${ur.utilisateur_id} ou role ${ur.role_id}`
      );
      continue;
    }
    await prisma.utilisateur_roles.create({
      data: {
        utilisateur_id,
        role_id,
      },
    });
  }

  // 6. Insertion Projets (mapping string->number)
  const projetIdMap = new Map();
  for (const projet of MOCK_PROJETS) {
    const created = await prisma.projets.create({
      data: {
        nom: projet.nom,
        description: projet.description ?? null,
        date_creation: projet.date_creation
          ? new Date(projet.date_creation)
          : undefined,
      },
    });
    projetIdMap.set(projet.id, created.id);
  }

  // 7. Insertion Étapes de workflow (mapping string->number, projet_id)
  const etapeIdMap = new Map();
  for (const etape of MOCK_ETAPES) {
    const created = await prisma.etapes_workflow.create({
      data: {
        nom: etape.nom,
        ordre: etape.ordre,
        description: etape.description ?? null,
        type_validation: etape.type_validation ?? etape.type ?? null,
        projet_id: etape.projet_id ? projetIdMap.get(etape.projet_id) : null,
      },
    });
    etapeIdMap.set(etape.id, created.id);
  }

  // 8. Insertion Titres fonciers (mapping string->number, projet_id)
  const titreIdMap = new Map();
  for (const titre of MOCK_TITRES_FONCIERS) {
    const created = await prisma.titres_fonciers.create({
      data: {
        proprietaire: titre.proprietaire ?? null,
        superficie: titre.superficie ?? titre.surface_m2 ?? null,
        perimetre: titre.perimetre ?? titre.perimetre_m ?? null,
        coordonnees_gps: titre.coordonnees_gps ?? null,
        centroide: titre.centroide ?? null,
        date_ajout: titre.date_ajout
          ? new Date(titre.date_ajout)
          : titre.created_at
          ? new Date(titre.created_at)
          : undefined,
        projet_id: titre.projet_id ? projetIdMap.get(titre.projet_id) : null,
      },
    });
    titreIdMap.set(titre.id, created.id);
  }

  // 9. Insertion Audit logs (mapping string->number, utilisateur_id, projet_id)
  for (const audit of MOCK_AUDIT) {
    await prisma.audit_logs.create({
      data: {
        action: audit.action,
        utilisateur_id: audit.utilisateur
          ? userIdMap.get(audit.utilisateur.id)
          : audit.utilisateur_id
          ? userIdMap.get(audit.utilisateur_id)
          : null,
        projet_id: audit.projet_id ? projetIdMap.get(audit.projet_id) : null,
        details: audit.details ?? null,
        date_action: audit.date_action
          ? new Date(audit.date_action)
          : audit.created_at
          ? new Date(audit.created_at)
          : undefined,
      },
    });
  }

  console.log("Mock data insérée avec succès (Prisma) !");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

// NB :
// - Adaptez les noms de modèles et champs selon votre schéma Prisma réel.
// - Pour les relations n-n (ex : permissions <-> rôles), ajoutez la logique correspondante.
// - Exécutez avec : npx ts-node src/data/seedMockData.ts
