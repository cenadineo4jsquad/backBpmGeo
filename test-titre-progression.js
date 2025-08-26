const axios = require('axios');

// --- Configuration à modifier ---
const API_BASE_URL = 'http://localhost:3000'; // Remplacez par l'URL de votre API
const USER_CREDENTIALS = {
  email: 'admin@example.com',       // Remplacez par un email admin valide
  mot_de_passe: 'password'       // Remplacez par le mot de passe valide
};
// --------------------------------

let authToken = '';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercepteur pour ajouter le token d'authentification à chaque requête
api.interceptors.request.use(config => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

async function login() {
  console.log('1. Connexion pour obtenir le token...');
  try {
    const response = await api.post('/api/login', USER_CREDENTIALS);
    authToken = response.data.token;
    console.log('   \x1b[32m%s\x1b[0m', 'Connexion réussie.');
  } catch (error) {
    console.error('   \x1b[31m%s\x1b[0m', 'Erreur de connexion:');
    console.error(error.response ? error.response.data : error.message);
    process.exit(1); // Arrête le script si la connexion échoue
  }
}

async function createTestProject() {
  console.log('\n2. Création d\'un projet de test...');
  try {
    const projet = {
      nom: `Projet de test ${Date.now()}`,
      description: 'Un projet pour tester la progression du workflow'
    };
    const response = await api.post('/api/projets', projet);
    console.log('   \x1b[32m%s\x1b[0m', `Projet créé avec l\'ID: ${response.data.id}`);
    return response.data;
  } catch (error) {
    console.error('   \x1b[31m%s\x1b[0m', 'Erreur lors de la création du projet:');
    console.error(error.response ? error.response.data : error.message);
    return null;
  }
}

async function createTitreFoncier(projet_id) {
  console.log('\n3. Création d\'un titre foncier de test...');
  try {
    const titre = {
      projet_id: projet_id,
      proprietaire: 'Test Propriétaire',
      superficie: 100.5
    };
    const response = await api.post('/api/titres-fonciers', titre);
    console.log('   \x1b[32m%s\x1b[0m', `Titre foncier créé avec l\'ID: ${response.data.id}`);
    return response.data;
  } catch (error) {
    console.error('   \x1b[31m%s\x1b[0m', 'Erreur lors de la création du titre foncier:');
    console.error(error.response ? error.response.data : error.message);
    return null;
  }
}

async function createWorkflow(projet_id, titre_foncier_id) {
  console.log('\n4. Création d\'un workflow initial...');
  try {
    const workflow = {
      projet_id: projet_id,
      titre_foncier_id: titre_foncier_id
    };
    const response = await api.post('/api/workflows', workflow);
    console.log('   \x1b[32m%s\x1b[0m', `Workflow créé avec l\'ID: ${response.data.id}`);
    return response.data;
  } catch (error) {
    console.error('   \x1b[31m%s\x1b[0m', 'Erreur lors de la création du workflow:');
    console.error(error.response ? error.response.data : error.message);
    return null;
  }
}

async function submitWorkflow(workflow_id) {
  console.log(`\n5. Soumission du workflow (ID: ${workflow_id}) à l\'étape suivante...`);
  try {
    const response = await api.post('/api/workflows/submit', { workflow_id });
    console.log('   \x1b[32m%s\x1b[0m', 'Workflow soumis avec succès.');
    return response.data;
  } catch (error) {
    console.error('   \x1b[31m%s\x1b[0m', 'Erreur lors de la soumission du workflow:');
    console.error(error.response ? error.response.data : error.message);
    return null;
  }
}

async function verifyProgression(titre_foncier_id) {
  console.log(`\n6. Vérification de la progression pour le titre foncier (ID: ${titre_foncier_id})...`);
  try {
    const response = await api.get(`/api/workflows?titre_foncier_id=${titre_foncier_id}`);
    const workflows = response.data;
    
    if (!workflows || workflows.length === 0) {
      console.log('   \x1b[31m%s\x1b[0m', 'Aucun workflow trouvé pour ce titre foncier.');
      return;
    }

    const currentWorkflow = workflows.find(wf => wf.date_fin === null);
    const initialWorkflow = workflows.find(wf => wf.ordre === 1);

    console.log(`   - Workflow initial (ordre 1): ${initialWorkflow ? 'Trouvé' : 'Non trouvé'}`);
    console.log(`   - Workflow actuel (non terminé): ${currentWorkflow ? 'Ordre ' + currentWorkflow.ordre : 'Non trouvé'}`);

    if (currentWorkflow && currentWorkflow.ordre > 1) {
      console.log('   \x1b[32m%s\x1b[0m', 'Vérification réussie: Le workflow a progressé à une étape supérieure.');
    } else {
      console.log('   \x1b[31m%s\x1b[0m', 'Échec de la vérification: Le workflow n\'a pas progressé.');
    }

  } catch (error) {
    console.error('   \x1b[31m%s\x1b[0m', 'Erreur lors de la vérification:');
    console.error(error.response ? error.response.data : error.message);
  }
}


async function runTest() {
  await login();
  
  const projet = await createTestProject();
  if (!projet) return;

  const titre = await createTitreFoncier(projet.id);
  if (!titre) return;

  const workflow = await createWorkflow(projet.id, titre.id);
  if (!workflow) return;

  const submissionResult = await submitWorkflow(workflow.id);
  if (!submissionResult) return;

  await verifyProgression(titre.id);

  console.log('\nTest terminé.');
}

runTest();
