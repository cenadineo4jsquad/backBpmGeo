const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function createCompleteWorkflow() {
  try {
    console.log("� Création d'un workflow complet...\n");

    // 1. Vérifier les localités disponibles
    const localites = await prisma.localites.findMany({ take: 5 });
    console.log("📍 Localités disponibles:");
    localites.forEach((l) => {
      console.log(`   ID: ${l.id} | Type: ${l.type} | Valeur: ${l.valeur}`);
    });

    // 2. Créer un nouveau projet
    console.log("\n📁 1. Création du projet...");
    const newProject = await prisma.projets.create({
      data: {
        nom: "Projet Test Workflow Géographique",
        description:
          "Projet de démonstration pour workflow avec accès géographique restrictif",
        localite_id: localites[0]?.id || 1, // Utiliser la première localité disponible
      },
    });
    console.log(`✅ Projet créé: ID ${newProject.id} - "${newProject.nom}"`);

    // 3. Créer des étapes de workflow pour le projet
    console.log("\n� 2. Création des étapes workflow...");
    const etapes = [
      {
        projet_id: newProject.id,
        nom: "Validation Géographique",
        ordre: 1,
        description: "Vérification des droits d'accès géographique",
        type_validation: "geographic_access",
      },
      {
        projet_id: newProject.id,
        nom: "Révision Technique",
        ordre: 2,
        description: "Révision technique des données par un expert",
        type_validation: "technical_review",
      },
      {
        projet_id: newProject.id,
        nom: "Approbation Finale",
        ordre: 3,
        description: "Approbation finale par le superviseur",
        type_validation: "final_approval",
      },
    ];

    const createdEtapes = [];
    for (let etapeData of etapes) {
      const etape = await prisma.etapes_workflow.create({ data: etapeData });
      createdEtapes.push(etape);
      console.log(
        `   ✅ Étape ${etape.ordre}: "${etape.nom}" (ID: ${etape.id})`
      );
    }

    // 4. Créer des rôles spécialisés pour le workflow
    console.log("\n👥 3. Création des rôles...");
    const roles = [
      {
        projet_id: newProject.id,
        nom: "workflow_validateur_geo",
        niveau_hierarchique: 1,
        description: "Validateur géographique pour workflow",
      },
      {
        projet_id: newProject.id,
        nom: "workflow_technicien",
        niveau_hierarchique: 2,
        description: "Technicien expert pour révision",
      },
      {
        projet_id: newProject.id,
        nom: "workflow_superviseur",
        niveau_hierarchique: 3,
        description: "Superviseur pour approbation finale",
      },
    ];

    const createdRoles = [];
    for (let roleData of roles) {
      const role = await prisma.roles.create({ data: roleData });
      createdRoles.push(role);
      console.log(
        `   ✅ Rôle: "${role.nom}" (ID: ${role.id}) - Niveau ${role.niveau_hierarchique}`
      );
    }

    // 5. Créer des permissions pour les rôles
    console.log("\n� 4. Création des permissions...");
    const permissions = [
      { role_id: createdRoles[0].id, action: "validate_geographic_access" },
      { role_id: createdRoles[0].id, action: "read_local_data" },
      { role_id: createdRoles[1].id, action: "technical_review" },
      { role_id: createdRoles[1].id, action: "edit_technical_data" },
      { role_id: createdRoles[2].id, action: "final_approval" },
      { role_id: createdRoles[2].id, action: "manage_workflow" },
    ];

    for (let permData of permissions) {
      await prisma.permissions.create({ data: permData });
      const role = createdRoles.find((r) => r.id === permData.role_id);
      console.log(`   ✅ Permission "${permData.action}" → Rôle: ${role.nom}`);
    }

    // 6. Créer des utilisateurs pour le workflow
    console.log("\n👤 5. Création des utilisateurs...");
    const users = [
      {
        nom: "Manga",
        prenom: "Jean-Claude",
        email: "validateur.geo.workflow@bpm.cm",
        mot_de_passe: "password123",
        niveau_hierarchique: 1,
        localite_id: localites[0]?.id || 1,
      },
      {
        nom: "Bella",
        prenom: "Marie-France",
        email: "technicien.workflow@bpm.cm",
        mot_de_passe: "password123",
        niveau_hierarchique: 2,
        localite_id: localites[1]?.id || 1,
      },
      {
        nom: "Talla",
        prenom: "Paul-Armand",
        email: "superviseur.workflow@bpm.cm",
        mot_de_passe: "password123",
        niveau_hierarchique: 3,
        localite_id: localites[2]?.id || 1,
      },
    ];

    const createdUsers = [];
    for (let userData of users) {
      const user = await prisma.utilisateurs.create({ data: userData });
      createdUsers.push(user);
      console.log(
        `   ✅ Utilisateur: ${user.prenom} ${user.nom} (ID: ${user.id}) - ${user.email}`
      );
    }

    // 7. Assigner les rôles aux utilisateurs
    console.log("\n🔗 6. Attribution des rôles...");
    for (let i = 0; i < createdUsers.length && i < createdRoles.length; i++) {
      await prisma.utilisateur_roles.create({
        data: {
          utilisateur_id: createdUsers[i].id,
          role_id: createdRoles[i].id,
        },
      });
      console.log(
        `   ✅ ${createdUsers[i].prenom} ${createdUsers[i].nom} → Rôle: ${createdRoles[i].nom}`
      );
    }

    // 8. Créer des workflows en cours
    console.log("\n🔄 7. Création des workflows actifs...");
    const workflowInstances = [
      {
        projet_id: newProject.id,
        etape_nom: createdEtapes[0].nom,
        ordre: 1,
        utilisateur_id: createdUsers[0].id,
      },
      {
        projet_id: newProject.id,
        etape_nom: createdEtapes[1].nom,
        ordre: 2,
        utilisateur_id: createdUsers[1].id,
      },
    ];

    const createdWorkflows = [];
    for (let workflowData of workflowInstances) {
      const workflow = await prisma.workflows.create({ data: workflowData });
      createdWorkflows.push(workflow);
      console.log(
        `   ✅ Workflow: Étape "${workflow.etape_nom}" assignée à utilisateur ID ${workflow.utilisateur_id}`
      );
    }

    // AFFICHAGE FINAL DES IDENTIFIANTS
    console.log("\n" + "=".repeat(80));
    console.log("🎯 WORKFLOW COMPLET CRÉÉ - TOUS LES IDENTIFIANTS");
    console.log("=".repeat(80));

    console.log("\n📁 PROJET:");
    console.log(`   🆔 ID: ${newProject.id}`);
    console.log(`   📝 Nom: ${newProject.nom}`);
    console.log(`   📍 Localité ID: ${newProject.localite_id}`);
    console.log(
      `   � Créé: ${
        newProject.date_creation
          ? newProject.date_creation.toISOString().split("T")[0]
          : "N/A"
      }`
    );

    console.log("\n📋 ÉTAPES WORKFLOW:");
    createdEtapes.forEach((etape) => {
      console.log(
        `   🆔 ID: ${etape.id} | Ordre: ${etape.ordre} | Nom: "${etape.nom}"`
      );
      console.log(`      📄 Description: ${etape.description}`);
      console.log(`      🔧 Type: ${etape.type_validation}`);
    });

    console.log("\n👥 RÔLES:");
    createdRoles.forEach((role) => {
      console.log(
        `   🆔 ID: ${role.id} | Nom: "${role.nom}" | Niveau: ${role.niveau_hierarchique}`
      );
      console.log(`      📄 Description: ${role.description}`);
    });

    console.log("\n👤 UTILISATEURS:");
    createdUsers.forEach((user, index) => {
      const role = createdRoles[index];
      console.log(`   🆔 ID: ${user.id} | Email: ${user.email}`);
      console.log(
        `      👤 Nom: ${user.prenom} ${user.nom} | Niveau: ${user.niveau_hierarchique}`
      );
      console.log(
        `      📍 Localité ID: ${user.localite_id} | Rôle: ${
          role?.nom || "N/A"
        }`
      );
    });

    console.log("\n🔄 INSTANCES WORKFLOW ACTIVES:");
    createdWorkflows.forEach((wf) => {
      const user = createdUsers.find((u) => u.id === wf.utilisateur_id);
      console.log(
        `   🆔 ID: ${wf.id} | Étape: "${wf.etape_nom}" | Ordre: ${wf.ordre}`
      );
      console.log(
        `      👤 Assigné à: ${user?.prenom} ${user?.nom} (ID: ${wf.utilisateur_id})`
      );
    });

    console.log("\n✅ WORKFLOW COMPLET CRÉÉ AVEC SUCCÈS!");
    console.log("\n🎯 IDENTIFIANTS PRINCIPAUX À RETENIR:");
    console.log(`📁 Projet ID: ${newProject.id}`);
    console.log(
      `👤 Utilisateurs ID: [${createdUsers.map((u) => u.id).join(", ")}]`
    );
    console.log(`👥 Rôles ID: [${createdRoles.map((r) => r.id).join(", ")}]`);
    console.log(`📋 Étapes ID: [${createdEtapes.map((e) => e.id).join(", ")}]`);
    console.log(
      `🔄 Workflows ID: [${createdWorkflows.map((w) => w.id).join(", ")}]`
    );
  } catch (error) {
    console.error("❌ Erreur lors de la création:", error.message);
    console.error("Stack:", error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

createCompleteWorkflow();
