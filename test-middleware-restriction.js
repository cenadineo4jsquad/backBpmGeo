const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

async function testRestrictToFirstUserMiddleware() {
  try {
    console.log('🧪 Test du middleware restrictToFirstUser...\n');

    // 1. Se connecter avec l'utilisateur de l'étape 1
    console.log('🔐 1. Connexion utilisateur étape 1...');
    const loginResponse = await axios.post('http://localhost:3000/api/login', {
      email: 'reception.foncier@workflow.cm',
      mot_de_passe: 'reception2025'
    });

    const token1 = loginResponse.data.access_token;
    const user1 = loginResponse.data.user;
    console.log(`✅ Connecté: ${user1.prenom} ${user1.nom} (Niveau ${user1.niveau_hierarchique})`);

    // 2. Se connecter avec l'utilisateur de l'étape 2 (devrait être refusé)
    console.log('\n🔐 2. Connexion utilisateur étape 2...');
    const loginResponse2 = await axios.post('http://localhost:3000/api/login', {
      email: 'technicien.workflow@bpm.cm',
      mot_de_passe: 'password123'
    });

    const token2 = loginResponse2.data.access_token;
    const user2 = loginResponse2.data.user;
    console.log(`✅ Connecté: ${user2.prenom} ${user2.nom} (Niveau ${user2.niveau_hierarchique})`);

    // 3. Créer un fichier de test
    console.log('\n📄 3. Création fichier de test...');
    const testImageContent = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );
    const testFilePath = './test-middleware.png';
    fs.writeFileSync(testFilePath, testImageContent);
    console.log('✅ Fichier créé');

    // 4. Préparer FormData
    const createFormData = (projetId) => {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(testFilePath), {
        filename: 'test-middleware.png',
        contentType: 'image/png'
      });
      formData.append('projet_id', projetId);
      formData.append('localite', JSON.stringify({
        type: 'arrondissement',
        valeur: 'Soa'
      }));
      return formData;
    };

    // 5. Test avec utilisateur étape 1 (devrait réussir)
    console.log('\n✅ 4. Test upload avec utilisateur étape 1...');
    try {
      const formData1 = createFormData(user1.projet_id || '22');
      const response1 = await axios.post(
        `http://localhost:3000/api/extraction/upload?projet_id=${user1.projet_id || '22'}`,
        formData1,
        {
          headers: {
            'Authorization': `Bearer ${token1}`,
            ...formData1.getHeaders()
          }
        }
      );
      console.log(`✅ SUCCESS - Utilisateur étape 1 autorisé (HTTP ${response1.status})`);
      console.log(`   Extraction créée: ID ${response1.data.id}`);
    } catch (error) {
      console.log(`❌ ÉCHEC - Utilisateur étape 1 refusé: ${error.response?.status} - ${error.response?.data?.error}`);
    }

    // 6. Test avec utilisateur étape 2 (devrait échouer)
    console.log('\n❌ 5. Test upload avec utilisateur étape 2...');
    try {
      const formData2 = createFormData(user2.projet_id || '22');
      const response2 = await axios.post(
        `http://localhost:3000/api/extraction/upload?projet_id=${user2.projet_id || '22'}`,
        formData2,
        {
          headers: {
            'Authorization': `Bearer ${token2}`,
            ...formData2.getHeaders()
          }
        }
      );
      console.log(`❌ PROBLÈME - Utilisateur étape 2 autorisé alors qu'il devrait être refusé (HTTP ${response2.status})`);
    } catch (error) {
      if (error.response?.status === 403) {
        console.log(`✅ SUCCESS - Utilisateur étape 2 correctement refusé (HTTP 403)`);
        console.log(`   Message: ${error.response.data.error}`);
      } else {
        console.log(`⚠️  INATTENDU - Échec pour une autre raison: ${error.response?.status} - ${error.response?.data?.error || error.message}`);
      }
    }

    // 7. Test avec header X-Projet-Id au lieu de paramètre URL
    console.log('\n🔧 6. Test avec header X-Projet-Id...');
    try {
      const formData3 = createFormData(user1.projet_id || '22');
      const response3 = await axios.post(
        'http://localhost:3000/api/extraction/upload',
        formData3,
        {
          headers: {
            'Authorization': `Bearer ${token1}`,
            'X-Projet-Id': (user1.projet_id || '22').toString(),
            ...formData3.getHeaders()
          }
        }
      );
      console.log(`✅ SUCCESS - Header X-Projet-Id fonctionne (HTTP ${response3.status})`);
    } catch (error) {
      console.log(`❌ ÉCHEC - Header X-Projet-Id ne fonctionne pas: ${error.response?.status} - ${error.response?.data?.error}`);
    }

    // 8. Test sans projet_id (devrait laisser passer ou échouer proprement)
    console.log('\n🔧 7. Test sans projet_id...');
    try {
      const formData4 = createFormData(user1.projet_id || '22');
      const response4 = await axios.post(
        'http://localhost:3000/api/extraction/upload', // Pas de projet_id dans URL
        formData4,
        {
          headers: {
            'Authorization': `Bearer ${token1}`,
            // Pas de X-Projet-Id
            ...formData4.getHeaders()
          }
        }
      );
      console.log(`⚠️  INATTENDU - Réussi sans projet_id accessible (HTTP ${response4.status})`);
    } catch (error) {
      console.log(`✅ ATTENDU - Échec sans projet_id: ${error.response?.status} - ${error.response?.data?.error}`);
    }

    // 9. Nettoyage
    console.log('\n🧹 8. Nettoyage...');
    fs.unlinkSync(testFilePath);
    console.log('✅ Fichier de test supprimé');

    console.log('\n🎉 Tests du middleware terminés !');

  } catch (error) {
    console.error('\n💥 Erreur lors des tests:', error.message);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data:`, error.response.data);
    }

    // Nettoyage en cas d'erreur
    try {
      if (fs.existsSync('./test-middleware.png')) {
        fs.unlinkSync('./test-middleware.png');
        console.log('✅ Fichier de test nettoyé');
      }
    } catch (cleanupError) {
      console.error('Erreur lors du nettoyage:', cleanupError.message);
    }
  }
}

// Exécuter le test
testRestrictToFirstUserMiddleware();
