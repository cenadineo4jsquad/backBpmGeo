# Guide d'Intégration Frontend - API BPM Extraction

## 📋 Vue d'ensemble

Cette documentation explique comment intégrer l'API BPM Extraction dans votre application frontend. L'API gère l'authentification, les workflows de traitement de documents, et les restrictions géographiques.

## 🚀 Configuration de Base

### URL de Base

```javascript
const API_BASE_URL = "http://localhost:3000";
```

### Headers Requis

```javascript
const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`, // Après connexion
};
```

## 🔐 Authentification

### 1. Connexion Utilisateur

**Endpoint:** `POST /utilisateurs/login`

```javascript
// Exemple de connexion
async function login(email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/utilisateurs/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        mot_de_passe: password,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      // Stocker les informations utilisateur
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      localStorage.setItem("user", JSON.stringify(data.user));

      return data;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error("Erreur de connexion:", error);
    throw error;
  }
}
```

### 2. Données Utilisateur Retournées

```javascript
// Structure de la réponse de connexion
{
  "user": {
    "id": 44,
    "email": "reception.foncier@workflow.cm",
    "nom": "Belinga",
    "prenom": "Claudine-Esperance",
    "niveau_hierarchique": 1,
    "projet_id": 22,
    "localite_id": 3,
    "localite": {
      "id": 3,
      "type": "arrondissement",
      "valeur": "Soa"
    },
    "role": {
      "id": 38,
      "nom": "receptionnaire_foncier",
      "niveau_hierarchique": 1,
      "description": "Réception et contrôle initial des documents fonciers"
    },
    "etape_courante": {
      "nom": "Réception et Contrôle",
      "ordre": 1
    },
    "niveau_etape": 1
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## 📄 Upload d'Extraction

### 1. Upload de Document

**Endpoint:** `POST /extractions/upload`

```javascript
async function uploadExtraction(file, user) {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("projet_id", user.projet_id.toString());
    formData.append(
      "localite",
      JSON.stringify({
        type: user.localite.type,
        valeur: user.localite.valeur,
      })
    );

    const response = await fetch(`${API_BASE_URL}/extractions/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        // Ne pas mettre Content-Type pour FormData
      },
      body: formData,
    });

    const data = await response.json();

    if (response.ok) {
      return data;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error("Erreur upload:", error);
    throw error;
  }
}
```

### 2. Composant React d'Upload

```jsx
import React, { useState } from "react";

function ExtractionUpload({ user }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];

    // Validation côté client
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "image/webp",
      "application/pdf",
    ];
    const maxSize = 10 * 1024 * 1024; // 10 Mo

    if (!allowedTypes.includes(selectedFile.type)) {
      alert(
        "Type de fichier non supporté. Utilisez: JPEG, PNG, JPG, WEBP ou PDF"
      );
      return;
    }

    if (selectedFile.size > maxSize) {
      alert("Fichier trop volumineux. Taille maximum: 10 Mo");
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      const result = await uploadExtraction(file, user);
      setResult(result);
      alert("Upload réussi !");
    } catch (error) {
      alert(`Erreur: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="extraction-upload">
      <h3>Upload d'Extraction</h3>

      <div className="user-info">
        <p>
          <strong>Projet:</strong> {user.projet_id}
        </p>
        <p>
          <strong>Localité:</strong> {user.localite.valeur} (
          {user.localite.type})
        </p>
        <p>
          <strong>Rôle:</strong> {user.role.nom}
        </p>
      </div>

      <input
        type="file"
        onChange={handleFileSelect}
        accept=".jpg,.jpeg,.png,.webp,.pdf"
      />

      {file && (
        <div className="file-info">
          <p>
            <strong>Fichier:</strong> {file.name}
          </p>
          <p>
            <strong>Taille:</strong> {(file.size / 1024 / 1024).toFixed(2)} Mo
          </p>
        </div>
      )}

      <button onClick={handleUpload} disabled={!file || uploading}>
        {uploading ? "Upload en cours..." : "Uploader"}
      </button>

      {result && (
        <div className="upload-result">
          <h4>Résultat:</h4>
          <p>
            <strong>ID Extraction:</strong> {result.id}
          </p>
          <p>
            <strong>Statut:</strong> {result.statut}
          </p>
          <p>
            <strong>Confiance:</strong> {result.seuil_confiance}%
          </p>
        </div>
      )}
    </div>
  );
}

export default ExtractionUpload;
```

## 📊 Gestion des Extractions

### 1. Liste des Extractions

**Endpoint:** `GET /extractions`

```javascript
async function getExtractions(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.projet_id) params.append("projet_id", filters.projet_id);
    if (filters.statut) params.append("statut", filters.statut);
    if (filters.utilisateur_id)
      params.append("utilisateur_id", filters.utilisateur_id);

    const response = await fetch(`${API_BASE_URL}/extractions?${params}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
    });

    return await response.json();
  } catch (error) {
    console.error("Erreur récupération extractions:", error);
    throw error;
  }
}
```

### 2. Composant Liste d'Extractions

```jsx
import React, { useState, useEffect } from "react";

function ExtractionsList({ user }) {
  const [extractions, setExtractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadExtractions();
  }, [filter]);

  const loadExtractions = async () => {
    try {
      const filters = {};
      if (filter !== "all") {
        filters.statut = filter;
      }

      const data = await getExtractions(filters);
      setExtractions(data);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleValidation = async (extractionId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/extractions/${extractionId}/valider`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            commentaire: "Validation automatique",
          }),
        }
      );

      if (response.ok) {
        alert("Extraction validée !");
        loadExtractions(); // Recharger la liste
      }
    } catch (error) {
      alert("Erreur lors de la validation");
    }
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="extractions-list">
      <h3>Mes Extractions</h3>

      <div className="filters">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">Toutes</option>
          <option value="Extrait">Extraites</option>
          <option value="Validé">Validées</option>
          <option value="Rejeté">Rejetées</option>
        </select>
      </div>

      <div className="extractions-grid">
        {extractions.map((extraction) => (
          <div key={extraction.id} className="extraction-card">
            <h4>Extraction #{extraction.id}</h4>
            <p>
              <strong>Fichier:</strong> {extraction.fichier}
            </p>
            <p>
              <strong>Statut:</strong> {extraction.statut}
            </p>
            <p>
              <strong>Confiance:</strong> {extraction.seuil_confiance}%
            </p>
            <p>
              <strong>Date:</strong>{" "}
              {new Date(extraction.date_extraction).toLocaleDateString()}
            </p>

            {/* Actions selon le niveau hiérarchique */}
            {user.niveau_hierarchique >= 1 &&
              extraction.statut === "Extrait" && (
                <div className="actions">
                  <button onClick={() => handleValidation(extraction.id)}>
                    Valider
                  </button>
                  <button onClick={() => handleRejection(extraction.id)}>
                    Rejeter
                  </button>
                </div>
              )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 🔧 Gestion des Erreurs

### 1. Codes d'Erreur Communs

```javascript
const ERROR_CODES = {
  401: "Non autorisé - Token invalide ou expiré",
  403: "Accès interdit - Permissions insuffisantes",
  400: "Données invalides",
  404: "Ressource non trouvée",
  500: "Erreur serveur",
};

function handleApiError(error, response) {
  if (response.status === 401) {
    // Token expiré, rediriger vers login
    localStorage.clear();
    window.location.href = "/login";
  } else if (response.status === 403) {
    // Accès interdit
    alert("Vous n'avez pas les permissions nécessaires");
  } else {
    // Autres erreurs
    alert(ERROR_CODES[response.status] || "Erreur inconnue");
  }
}
```

### 2. Intercepteur Axios

```javascript
import axios from "axios";

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Intercepteur pour ajouter le token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
```

## 🌍 Restrictions Géographiques

### 1. Comprendre les Niveaux

```javascript
const NIVEAUX_HIERARCHIQUES = {
  1: "Arrondissement - Accès limité à sa localité",
  2: "Département - Accès limité à sa localité",
  3: "Régional - Accès à plusieurs localités",
  4: "National - Accès complet",
};

function canAccessLocalite(user, targetLocalite) {
  // Niveau 4 : accès complet
  if (user.niveau_hierarchique === 4) {
    return true;
  }

  // Niveaux 1-2 : seulement leur localité
  if (user.niveau_hierarchique <= 2) {
    return (
      user.localite.type === targetLocalite.type &&
      user.localite.valeur === targetLocalite.valeur
    );
  }

  // Niveau 3 : logique plus complexe (à adapter)
  return true;
}
```

## 👥 Comptes de Test Disponibles

```javascript
const TEST_ACCOUNTS = {
  receptionnaire: {
    email: "reception.foncier@workflow.cm",
    password: "ReceptionFoncier2024!",
    niveau: 1,
    localite: "Soa (arrondissement)",
  },
  controleur: {
    email: "controle.technique@workflow.cm",
    password: "ControleTech2024!",
    niveau: 2,
    localite: "Soa (arrondissement)",
  },
  validateur: {
    email: "validation.principale@workflow.cm",
    password: "ValidationPrincipale2024!",
    niveau: 3,
    localite: "Soa (arrondissement)",
  },
  admin: {
    email: "admin.systeme@workflow.cm",
    password: "AdminSysteme2024!",
    niveau: 4,
    localite: "Toutes",
  },
};
```

## 🚦 État du Serveur

Pour vérifier que l'API est disponible :

```javascript
async function checkServerStatus() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch (error) {
    return false;
  }
}
```

## 📝 Exemple d'Application Complète

```jsx
import React, { useState, useEffect } from "react";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté
    const savedUser = localStorage.getItem("user");
    const token = localStorage.getItem("access_token");

    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }

    setLoading(false);
  }, []);

  const handleLogin = async (email, password) => {
    try {
      const loginData = await login(email, password);
      setUser(loginData.user);
    } catch (error) {
      alert(`Erreur de connexion: ${error.message}`);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (!user) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div className="app">
      <header>
        <h1>BPM Extraction</h1>
        <div className="user-info">
          <span>
            {user.prenom} {user.nom}
          </span>
          <span>({user.role.nom})</span>
          <button onClick={handleLogout}>Déconnexion</button>
        </div>
      </header>

      <main>
        {user.niveau_hierarchique <= 2 && <ExtractionUpload user={user} />}
        <ExtractionsList user={user} />
      </main>
    </div>
  );
}
```

## 🔄 Démarrage du Serveur

Pour tester l'intégration, assurez-vous que le serveur backend est démarré :

```bash
cd backend
npm run dev
```

Le serveur sera disponible sur `http://localhost:3000`.

---

Cette documentation couvre les cas d'usage principaux. Pour des besoins spécifiques, consultez les fichiers de test dans le dossier `/tests` du backend.
