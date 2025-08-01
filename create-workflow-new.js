const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new PrismaClient();

async function createNewWorkflow() {
  try {
    console.log("🚀 Création d'un nouveau workflow complet...\n");

    // Stocker les mots de passe en clair pour l'affichage final
    const passwordStore = {};

    // 1. CRÉER UN NOUVEAU PROJET
    console.log("📁 1. Création du projet...");
    const newProject = await prisma.projets.create({
      data: {
        nom: "Système de Gestion Foncière Numérique v2",
        description:
          "Workflow numérique complet pour la gestion des titres fonciers et documents cadastraux",
        localite_id: 3, // Arrondissement existant
      },
    });

    console.log(`✅ Projet créé: ID ${newProject.id} - "${newProject.nom}"`);

    // 2. CRÉER LES ÉTAPES DU WORKFLOW
    console.log("\n📋 2. Création des étapes workflow...");
    const etapes = [
      {
        projet_id: newProject.id,
        nom: "Réception et Contrôle",
        ordre: 1,
        description: "Réception des demandes et contrôle initial des documents",
        type_validation: "initial_control",
      },
      {
        projet_id: newProject.id,
        nom: "Analyse Géotechnique",
        ordre: 2,
        description: "Analyse géotechnique et cartographique des parcelles",
        type_validation: "geotechnical_analysis",
      },
      {
        projet_id: newProject.id,
        nom: "Expertise Juridique",
        ordre: 3,
        description: "Expertise juridique et vérification des droits",
        type_validation: "legal_expertise",
      },
      {
        projet_id: newProject.id,
        nom: "Validation Directorial",
        ordre: 4,
        description: "Validation finale par la direction générale",
        type_validation: "directorial_validation",
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
    console.log("\n👥 3. Création des rôles spécialisés...");
    const roles = [
      {
        projet_id: newProject.id,
        nom: "receptionnaire_foncier",
        description: "Réceptionnaire et contrôleur de documents fonciers",
        niveau_hierarchique: 1,
      },
      {
        projet_id: newProject.id,
        nom: "expert_geotechnique",
        description: "Expert en géotechnique et cartographie",
        niveau_hierarchique: 2,
      },
      {
        projet_id: newProject.id,
        nom: "juriste_foncier",
        description: "Juriste spécialisé en droit foncier",
        niveau_hierarchique: 2,
      },
      {
        projet_id: newProject.id,
        nom: "directeur_general",
        description: "Directeur général pour validation finale",
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
    console.log("\n🔐 4. Création des permissions...");
    const permissions = [
      { role_id: createdRoles[0].id, action: "receive_documents" },
      { role_id: createdRoles[0].id, action: "initial_control" },
      { role_id: createdRoles[1].id, action: "geotechnical_analysis" },
      { role_id: createdRoles[1].id, action: "cartographic_expertise" },
      { role_id: createdRoles[2].id, action: "legal_expertise" },
      { role_id: createdRoles[2].id, action: "rights_verification" },
      { role_id: createdRoles[3].id, action: "final_validation" },
      { role_id: createdRoles[3].id, action: "strategic_decisions" },
    ];

    for (let permData of permissions) {
      await prisma.permissions.create({ data: permData });
      const role = createdRoles.find((r) => r.id === permData.role_id);
      console.log(`   ✅ Permission "${permData.action}" → Rôle: ${role?.nom}`);
    }

    // 5. CRÉER DE NOUVEAUX UTILISATEURS AVEC MOTS DE PASSE HASHÉS
    console.log("\n👤 5. Création des utilisateurs...");
    const usersData = [
      {
        email: "reception.foncier@workflow.cm",
        nom: "Belinga",
        prenom: "Claudine-Esperance",
        plainPassword: "reception2025",
        niveau_hierarchique: 1,
        localite_id: 3, // Arrondissement
      },
      {
        email: "expert.geo@workflow.cm",
        nom: "Owona",
        prenom: "Bertrand-Michel",
        plainPassword: "geotechnique2025",
        niveau_hierarchique: 2,
        localite_id: 4, // Département
      },
      {
        email: "juriste.expert@workflow.cm",
        nom: "Nkoa",
        prenom: "Beatrice-Solange",
        plainPassword: "juridique2025",
        niveau_hierarchique: 2,
        localite_id: 4, // Département
      },
      {
        email: "dg.foncier@workflow.cm",
        nom: "Mebara",
        prenom: "Charles-Antoine",
        plainPassword: "direction2025",
        niveau_hierarchique: 3,
        localite_id: 1,
      },
    ];

    const createdUsers = [];
    for (let userData of usersData) {
      // Hash du mot de passe
      const hashedPassword = await bcrypt.hash(userData.plainPassword, 12);

      // Stocker le mot de passe en clair pour l'affichage
      passwordStore[userData.email] = userData.plainPassword;

      const user = await prisma.utilisateurs.create({
        data: {
          email: userData.email,
          nom: userData.nom,
          prenom: userData.prenom,
          mot_de_passe: hashedPassword,
          niveau_hierarchique: userData.niveau_hierarchique,
          localite_id: userData.localite_id,
        },
      });

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
    console.log("🎯 NOUVEAU WORKFLOW CRÉÉ - IDENTIFIANTS DE CONNEXION");
    console.log("=".repeat(80));

    console.log("\n📁 PROJET:");
    console.log(`   🆔 ID: ${newProject.id}`);
    console.log(`   📝 Nom: ${newProject.nom}`);
    console.log(`   📍 Localité ID: ${newProject.localite_id}`);

    console.log("\n📋 ÉTAPES WORKFLOW:");
    createdEtapes.forEach((etape) => {
      console.log(
        `   🆔 ID: ${etape.id} | Ordre: ${etape.ordre} | Nom: "${etape.nom}"`
      );
      console.log(`      📄 Description: ${etape.description}`);
    });

    console.log("\n👥 RÔLES:");
    createdRoles.forEach((role) => {
      console.log(
        `   🆔 ID: ${role.id} | Nom: "${role.nom}" | Niveau: ${role.niveau_hierarchique}`
      );
      console.log(`      📄 Description: ${role.description}`);
    });

    console.log("\n👤 UTILISATEURS ET IDENTIFIANTS DE CONNEXION:");
    console.log("=".repeat(70));
    createdUsers.forEach((user, index) => {
      const role = createdRoles[index];
      const plainPassword = passwordStore[user.email];
      console.log(`\n${index + 1}. 👤 UTILISATEUR:`);
      console.log(`   🆔 ID: ${user.id}`);
      console.log(`   📧 EMAIL: ${user.email}`);
      console.log(`   🔑 MOT DE PASSE: ${plainPassword}`);
      console.log(`   👤 Nom: ${user.prenom} ${user.nom}`);
      console.log(`   📊 Niveau: ${user.niveau_hierarchique}`);
      console.log(`   📍 Localité ID: ${user.localite_id}`);
      console.log(`   👥 Rôle: ${role?.nom || "N/A"}`);
    });

    console.log("\n🔄 INSTANCES WORKFLOW ACTIVES:");
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
      const plainPassword = passwordStore[user.email];
      console.log(`${index + 1}. 📧 ${user.email} | 🔑 ${plainPassword}`);
    });

    console.log("\n✅ NOUVEAU WORKFLOW CRÉÉ AVEC SUCCÈS!");
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

    console.log(
      "\n🔐 TOUS LES MOTS DE PASSE SONT HASHÉS EN BCRYPT POUR LA SÉCURITÉ"
    );
    console.log("✅ PRÊT POUR LES TESTS D'AUTHENTIFICATION!");
  } catch (error) {
    console.error("❌ Erreur lors de la création:", error.message);
    console.error("Stack:", error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

createNewWorkflow();
