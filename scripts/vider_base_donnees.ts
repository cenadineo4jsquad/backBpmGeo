import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function viderBaseDeDonnees() {
  try {
    console.log('Début de la suppression des données...');

    // Désactiver temporairement les contraintes de clés étrangères
    await prisma.$executeRaw`SET session_replication_role = 'replica';`;

    // Sauvegarder l'utilisateur admin
    const adminUser = await prisma.utilisateurs.findUnique({
      where: { email: 'admin@gov.cm' }
    });

    // Supprimer les données dans l'ordre inverse des dépendances
    await prisma.validations.deleteMany();
    console.log('✓ Table validations vidée');

    await prisma.titres_extractions.deleteMany();
    console.log('✓ Table titres_extractions vidée');

    await prisma.utilisateur_roles.deleteMany();
    console.log('✓ Table utilisateur_roles vidée');

    await prisma.permissions.deleteMany();
    console.log('✓ Table permissions vidée');

    await prisma.workflows.deleteMany();
    console.log('✓ Table workflows vidée');

    await prisma.etapes_workflow.deleteMany();
    console.log('✓ Table etapes_workflow vidée');

    await prisma.extractions.deleteMany();
    console.log('✓ Table extractions vidée');

    await prisma.titres_fonciers.deleteMany();
    console.log('✓ Table titres_fonciers vidée');

    await prisma.audit_logs.deleteMany();
    console.log('✓ Table audit_logs vidée');

    await prisma.roles.deleteMany();
    console.log('✓ Table roles vidée');

    await prisma.projets.deleteMany();
    console.log('✓ Table projets vidée');

    // Supprimer tous les utilisateurs (y compris l'admin)
    await prisma.utilisateurs.deleteMany();
    console.log('✓ Table utilisateurs vidée');

    await prisma.localites.deleteMany();
    console.log('✓ Table localites vidée');

    // Réactiver les contraintes de clés étrangères
    await prisma.$executeRaw`SET session_replication_role = 'origin';`;

    console.log('✅ Base de données vidée avec succès !');
    console.log(`✅ Utilisateur admin@gov.cm conservé`);
  } catch (error) {
    console.error('❌ Erreur lors de la suppression des données:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter la fonction
viderBaseDeDonnees();
