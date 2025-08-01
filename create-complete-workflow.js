const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new PrismaClient();

async function createCompleteWorkflow() {
  try {
    console.log(
      "🚀 Création d'un workflow complet avec projet, étapes, rôles et utilisateurs...\n"
    );

    // 1. CRÉER UN NOUVEAU PROJET
    console.log("📁 1. Création du projet...");
    const newProject = await prisma.projets.create({
      data: {
        nom: "Projet Gestion Foncière Numérique",
        description:
          "Système complet de gestion des titres fonciers avec workflow numérique",
        localite_id: 2, // Yaoundé 2ème
      },
    });

    console.log(`✅ Projet créé: ID ${newProject.id} - "${newProject.nom}"`);

    // 2. CRÉER LES ÉTAPES DU WORKFLOW
    console.log("\n� 2. Création des étapes workflow...");
    const etapes = [
      {
        projet_id: newProject.id,
        nom: "Validation Géographique Initiale",
        ordre: 1,
        description:
          "Vérification des droits d'accès géographique du demandeur",
        type_validation: "geographic_validation",
      },
      {
        projet_id: newProject.id,
        nom: "Analyse Technique",
        ordre: 2,
        description: "Analyse technique des documents cadastraux",
        type_validation: "technical_analysis",
      },
      {
        projet_id: newProject.id,
        nom: "Validation Juridique",
        ordre: 3,
        description: "Validation juridique des titres fonciers",
        type_validation: "legal_validation",
      },
      {
        projet_id: newProject.id,
        nom: "Approbation Finale",
        ordre: 4,
        description: "Approbation finale par le superviseur régional",
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

    // 3. CRÉER DE NOUVEAUX RÔLES SPÉCIALISÉS
    console.log("\n� 3. Création des rôles spécialisés...");
    const roles = [
      {
        projet_id: newProject.id,
        nom: "document_controller",
        description: "Contrôleur de documents fonciers",
        niveau_hierarchique: 1,
      },
      {
        projet_id: newProject.id,
        nom: "geo_analyst",
        description: "Analyste géospatial expert",
        niveau_hierarchique: 2,
      },
      {
        projet_id: newProject.id,
        nom: "legal_expert",
        description: "Expert juridique en droit foncier",
        niveau_hierarchique: 2,
      },
      {
        projet_id: newProject.id,
        nom: "director",
        description: "Directeur pour approbation finale",
        niveau_hierarchique: 3,
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

    // 4. CRÉER DES PERMISSIONS POUR LES RÔLES
    console.log("\n� 4. Création des permissions...");
    const permissions = [
      { role_id: createdRoles[0].id, action: "verify_documents" },
      { role_id: createdRoles[0].id, action: "validate_initial_request" },
      { role_id: createdRoles[1].id, action: "geospatial_analysis" },
      { role_id: createdRoles[1].id, action: "cartographic_validation" },
      { role_id: createdRoles[2].id, action: "legal_review" },
      { role_id: createdRoles[2].id, action: "regulatory_compliance" },
      { role_id: createdRoles[3].id, action: "final_approval" },
      { role_id: createdRoles[3].id, action: "workflow_management" },
    ];

    for (let permData of permissions) {
      await prisma.permissions.create({ data: permData });
      const role = createdRoles.find((r) => r.id === permData.role_id);
      console.log(`   ✅ Permission "${permData.action}" → Rôle: ${role.nom}`);
    }

    // 5. CRÉER DE NOUVEAUX UTILISATEURS
    console.log("\n👤 5. Création des utilisateurs...");
    const users = [
      {
        email: "controleur.documents@foncier.cm",
        nom: "Ateba",
        prenom: "Francine-Laure",
        mot_de_passe: "documents2025",
        niveau_hierarchique: 1,
        localite_id: 2, // Yaoundé 2ème
      },
      {
        email: "analyste.geo@foncier.cm",
        nom: "Essomba",
        prenom: "Jean-Claude",
        mot_de_passe: "geospatial2025",
        niveau_hierarchique: 2,
        localite_id: 5, // Mfoundi
      },
      {
        email: "expert.juridique@foncier.cm",
        nom: "Mvondo",
        prenom: "Solange-Marie",
        mot_de_passe: "juridique2025",
        niveau_hierarchique: 2,
        localite_id: 5, // Mfoundi
      },
      {
        email: "directeur.foncier@foncier.cm",
        nom: "Ndjomo",
        prenom: "Auguste-Emmanuel",
        mot_de_passe: "direction2025",
        niveau_hierarchique: 3,
        localite_id: 1, // Administration centrale
      },
    ];

    const createdUsers = [];
    for (let userData of users) {
      // Hash du mot de passe
      const hashedPassword = await bcrypt.hash(userData.mot_de_passe, 12);

      const user = await prisma.utilisateurs.create({
        data: {
          ...userData,
          mot_de_passe: hashedPassword,
        },
      });

      // Conserver le mot de passe original pour l'affichage
      user.plainPassword = userData.mot_de_passe;
      createdUsers.push(user);
      console.log(
        `   ✅ Utilisateur: ${user.prenom} ${user.nom} (ID: ${user.id}) - ${user.email}`
      );
    }

    // 6. ASSIGNER LES RÔLES AUX UTILISATEURS
    console.log("\n🔗 6. Attribution des rôles aux utilisateurs...");
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

    // 7. CRÉER DES INSTANCES DE WORKFLOW ACTIVES
    console.log("\n� 7. Création des workflows actifs...");
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
    console.log("🎯 WORKFLOW COMPLET CRÉÉ - IDENTIFIANTS ET ACCÈS");
    console.log("=".repeat(80));

    console.log("\n📁 PROJET:");
    console.log(`   🆔 ID: ${newProject.id}`);
    console.log(`   📝 Nom: ${newProject.nom}`);
    console.log(`   📍 Localité ID: ${newProject.localite_id}`);
    console.log(
      `   � Créé: ${
        newProject.date_creation
          ? newProject.date_creation.toISOString().split("T")[0]
          : "Aujourd'hui"
      }`
    );

    console.log("\n� ÉTAPES WORKFLOW:");
    createdEtapes.forEach((etape) => {
      console.log(
        `   🆔 ID: ${etape.id} | Ordre: ${etape.ordre} | Nom: "${etape.nom}"`
      );
      console.log(`      � Description: ${etape.description}`);
      console.log(`      � Type: ${etape.type_validation}`);
    });

    console.log("\n� RÔLES:");
    createdRoles.forEach((role) => {
      console.log(
        `   🆔 ID: ${role.id} | Nom: "${role.nom}" | Niveau: ${role.niveau_hierarchique}`
      );
      console.log(`      📄 Description: ${role.description}`);
    });

    console.log("\n� UTILISATEURS ET IDENTIFIANTS DE CONNEXION:");
    console.log("=".repeat(60));
    createdUsers.forEach((user, index) => {
      const role = createdRoles[index];
      console.log(`\n${index + 1}. 👤 UTILISATEUR:`);
      console.log(`   🆔 ID: ${user.id}`);
      console.log(`   📧 EMAIL: ${user.email}`);
      console.log(`   🔑 MOT DE PASSE: ${user.plainPassword || "N/A"}`);
      console.log(`   👤 Nom: ${user.prenom} ${user.nom}`);
      console.log(`   📊 Niveau: ${user.niveau_hierarchique}`);
      console.log(`   📍 Localité ID: ${user.localite_id}`);
      console.log(`   👥 Rôle: ${role?.nom || "N/A"}`);
    });

    console.log("\n� INSTANCES WORKFLOW ACTIVES:");
    createdWorkflows.forEach((wf) => {
      const user = createdUsers.find((u) => u.id === wf.utilisateur_id);
      console.log(
        `   🆔 ID: ${wf.id} | Étape: "${wf.etape_nom}" | Ordre: ${wf.ordre}`
      );
      console.log(
        `      👤 Assigné à: ${user?.prenom} ${user?.nom} (${user?.email})`
      );
    });

    console.log("\n" + "=".repeat(80));
    console.log("🎯 RÉCAPITULATIF DES IDENTIFIANTS DE CONNEXION");
    console.log("=".repeat(80));

    createdUsers.forEach((user, index) => {
      console.log(
        `${index + 1}. 📧 ${user.email} | 🔑 ${
          user.plainPassword || "Voir liste complète ci-dessus"
        }`
      );
    });

    console.log("\n✅ WORKFLOW COMPLET CRÉÉ AVEC SUCCÈS!");
    console.log("🎯 IDENTIFIANTS PRINCIPAUX:");
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
