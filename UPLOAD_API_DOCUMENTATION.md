# 📤 Documentation - Upload d'Extraction (API /extraction/upload)

## **Endpoint**
```
POST /api/extraction/upload?projet_id={PROJECT_ID}
```

**IMPORTANT :** Le `projet_id` doit être passé en **paramètre URL** pour contourner les limitations du middleware avec les requêtes `multipart/form-data`.

---

## **🔐 Authentification Requise**
```javascript
headers: {
  'Authorization': 'Bearer <JWT_TOKEN>'
}
```

---

## **📋 Paramètres**

### **URL Query Parameters (Requis)**
| Paramètre | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| `projet_id` | String/Number | ✅ | ID du projet (dans l'URL) |

### **FormData Body (Requis)**
| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `file` | File | ✅ | Document à traiter |
| `projet_id` | String/Number | ✅ | ID du projet (également dans le body) |
| `localite` | JSON String | ✅ | Localité géographique |

---

## **📄 Formats de Fichiers Supportés**

- **Images** : `image/jpeg`, `image/png`, `image/jpg`, `image/webp`
- **Documents** : `application/pdf`
- **Taille maximum** : 10 Mo

---

## **🌍 Format de la Localité**

```javascript
{
  "type": "arrondissement|departement|region|administration_centrale",
  "valeur": "Nom de la localité"
}
```

**Exemples valides :**
```javascript
// Arrondissement (niveau 1)
{ "type": "arrondissement", "valeur": "Soa" }

// Département (niveau 2)
{ "type": "departement", "valeur": "Mfoundi" }

// Région (niveau 3)
{ "type": "region", "valeur": "Centre" }

// Administration centrale (niveau 4)
{ "type": "administration_centrale", "valeur": "MINCAF" }
```

---

## **💻 Exemples d'Utilisation**

### **1. JavaScript Vanilla (Recommandé)**
```javascript
async function uploadExtraction(file, user) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('projet_id', user.projet_id.toString());
  formData.append('localite', JSON.stringify({
    type: user.localite.type,
    valeur: user.localite.valeur
  }));

  // IMPORTANT: Passer projet_id dans l'URL également
  const url = `http://localhost:3000/api/extraction/upload?projet_id=${user.projet_id}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      // Ne pas ajouter Content-Type pour FormData
    },
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erreur d\'upload');
  }

  return await response.json();
}
```

### **2. Avec Axios (Node.js)**
```javascript
const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

async function uploadWithAxios(filePath, token, user) {
  const formData = new FormData();
  
  formData.append('file', fs.createReadStream(filePath), {
    filename: 'document.png',
    contentType: 'image/png'
  });
  formData.append('projet_id', user.projet_id);
  formData.append('localite', JSON.stringify({
    type: user.localite.type,
    valeur: user.localite.valeur
  }));

  // IMPORTANT: Passer projet_id dans l'URL
  const url = `http://localhost:3000/api/extraction/upload?projet_id=${user.projet_id}`;

  const response = await axios.post(url, formData, {
    headers: {
      'Authorization': `Bearer ${token}`,
      ...formData.getHeaders()
    }
  });

  return response.data;
}
```

### **3. Composant React Complet**
```jsx
import React, { useState } from 'react';

function FileUpload({ user, token }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    
    // Validation côté client
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'];
    const maxSize = 10 * 1024 * 1024; // 10 Mo
    
    if (!allowedTypes.includes(selectedFile.type)) {
      alert('Type de fichier non supporté. Utilisez: JPEG, PNG, JPG, WEBP ou PDF');
      return;
    }
    
    if (selectedFile.size > maxSize) {
      alert('Fichier trop volumineux. Taille maximum: 10 Mo');
      return;
    }
    
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projet_id', user.projet_id.toString());
      formData.append('localite', JSON.stringify(user.localite));

      // IMPORTANT: projet_id dans l'URL
      const url = `/api/extraction/upload?projet_id=${user.projet_id}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      const result = await response.json();
      setResult(result);
      alert(`Upload réussi ! ID: ${result.id}`);
    } catch (error) {
      alert(`Erreur: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-component">
      <h3>Upload d'Extraction</h3>
      
      <div className="user-info">
        <p><strong>Projet:</strong> {user.projet_id}</p>
        <p><strong>Localité:</strong> {user.localite.valeur} ({user.localite.type})</p>
        <p><strong>Rôle:</strong> {user.role.nom}</p>
      </div>
      
      <input 
        type="file" 
        onChange={handleFileSelect}
        accept=".jpg,.jpeg,.png,.webp,.pdf"
      />
      
      {file && (
        <div className="file-info">
          <p><strong>Fichier:</strong> {file.name}</p>
          <p><strong>Taille:</strong> {(file.size / 1024 / 1024).toFixed(2)} Mo</p>
        </div>
      )}
      
      <button 
        onClick={handleUpload} 
        disabled={!file || uploading}
      >
        {uploading ? 'Upload en cours...' : 'Uploader'}
      </button>
      
      {result && (
        <div className="upload-result">
          <h4>✅ Résultat:</h4>
          <p><strong>ID Extraction:</strong> {result.id}</p>
          <p><strong>Statut:</strong> {result.statut}</p>
          <p><strong>Confiance:</strong> {result.seuil_confiance}%</p>
          <p><strong>Date:</strong> {new Date(result.date_extraction).toLocaleString()}</p>
        </div>
      )}
    </div>
  );
}

export default FileUpload;
```

---

## **✅ Réponse Réussie (201)**
```json
{
  "id": 1,
  "projet_id": 22,
  "utilisateur_id": 44,
  "fichier": "test-document.png",
  "donnees_extraites": {},
  "seuil_confiance": 90.0,
  "statut": "Extrait",
  "date_extraction": "2025-08-01T18:27:39.510Z",
  "workflow_id": 1
}
```

---

## **❌ Erreurs Possibles**

| Code | Message | Cause | Solution |
|------|---------|-------|----------|
| 400 | "Le contenu doit être multipart/form-data" | Headers incorrects | Utiliser FormData, ne pas définir Content-Type |
| 400 | "Aucun fichier détecté" | Fichier manquant | Vérifier le champ 'file' |
| 400 | "Type de fichier non supporté" | Format non autorisé | Utiliser JPEG, PNG, WEBP ou PDF |
| 400 | "Fichier trop volumineux" | > 10 Mo | Réduire la taille du fichier |
| 403 | "Localité non autorisée" | Restriction géographique | Utiliser la localité assignée à l'utilisateur |
| 403 | "Seul l'utilisateur de l'étape 1 peut effectuer cette action" | Middleware restrictToFirstUser | Vérifier que l'utilisateur est assigné à l'étape 1 du projet |
| 401 | "Token invalide" | JWT expiré/invalide | Renouveler le token |

---

## **🔒 Restrictions de Sécurité**

1. **Authentification JWT obligatoire**
2. **Contrôle géographique** : 
   - Niveaux 1-2 : Limités à leur localité assignée
   - Niveaux 3-4 : Accès étendu selon hiérarchie
3. **Validation de fichier** : Type et taille
4. **Middleware restrictToFirstUser** : Seul l'utilisateur de l'étape 1 peut uploader
5. **Projet assigné** : L'utilisateur doit avoir accès au projet

---

## **🧪 Test Rapide avec cURL**
```bash
# 1. Connexion
TOKEN=$(curl -s -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"reception.foncier@workflow.cm","mot_de_passe":"reception2025"}' \
  | jq -r '.access_token')

# 2. Upload (noter le projet_id dans l'URL)
curl -X POST "http://localhost:3000/api/extraction/upload?projet_id=22" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@document.jpg" \
  -F "projet_id=22" \
  -F 'localite={"type":"arrondissement","valeur":"Soa"}'
```

---

## **💡 Points Clés à Retenir**

1. **Double projet_id** : Passer le `projet_id` à la fois dans l'URL ET dans le FormData
2. **Pas de Content-Type** : Laisser le navigateur définir automatiquement le Content-Type multipart
3. **Localité exacte** : Utiliser exactement la localité assignée à l'utilisateur connecté
4. **Validation client** : Vérifier type et taille côté client pour une meilleure UX
5. **Gestion d'erreurs** : Intercepter et afficher les erreurs de façon conviviale

Cette approche garantit la compatibilité avec le middleware `restrictToFirstUser` ! 🚀
