# Documentation des routes backend pour GeoBPM

This document describes the REST API routes for the GeoBPM backend, developed with Fastify.js and PostgreSQL, supporting a decentralized land title management system with geospatial data extraction. The system enforces a hierarchical structure (`niveau_hierarchique` 1–4), locality-based access (`localite`), and a workflow where only the stage 1 user performs extraction, followed by validation/rejection at subsequent stages (n+1) with mandatory comments for rejection and optional for validation. Modifications to extracted data are sent to an external Flask API. All routes use JWT for authentication and RBAC for access control.

---

## Authentication

### POST /api/login

- **Description**: Authenticates a user and returns a JWT token.
- **Body**:
  ```json
  {
    "email": "string",
    "mot_de_passe": "string"
  }
  ```
- **Response** (200):
  ```json
  {
    "token": "string",
    "user": {
      "id": integer,
      "nom": "string",
      "prenom": "string",
      "email": "string",
      "niveau_hierarchique": integer,
      "localite": { "type": "string", "valeur": "string" }
    }
  }
  ```
- **Errors**:
  - 401: `{ "error": "Identifiants invalides" }`

### GET /api/me

- **Description**: Returns the authenticated user’s information.
- **Header**: `Authorization: Bearer <token>`
- **Response** (200):
  ```json
  {
    "id": integer,
    "nom": "string",
    "prenom": "string",
    "email": "string",
    "niveau_hierarchique": integer,
    "localite": { "type": "string", "valeur": "string" }
  }
  ```
- **Errors**:
  - 401: `{ "error": "Non autorisé" }`

---

## Users

### GET /api/utilisateurs

- **Description**: Lists all users (accessible to level 4 only).
- **Header**: `Authorization: Bearer <token>`
- **Response** (200):
  ```json
  [
    {
      "id": 1,
      "nom": "OKENE AHANDA MAMA PIE HERV",
      "prenom": "",
      "email": "okene.ahanda@example.com",
      "niveau_hierarchique": 1,
      "localite": { "type": "arrondissement", "valeur": "Soa" }
    },
    {
      "id": 2,
      "nom": "NDJOMO",
      "prenom": "Paul",
      "email": "paul.ndjomo@example.com",
      "niveau_hierarchique": 2,
      "localite": { "type": "departement", "valeur": "Mefou et Afamba" }
    },
    {
      "id": 3,
      "nom": "MBOUA",
      "prenom": "Sylvie",
      "email": "sylvie.mboua@example.com",
      "niveau_hierarchique": 4,
      "localite": {
        "type": "administration_centrale",
        "valeur": "Administration Centrale"
      }
    }
  ]
  ```
- **Errors**:
  - 403: `{ "error": "Réservé aux administrateurs" }`
  - 401: `{ "error": "Non autorisé" }`

### POST /api/utilisateurs

- **Description**: Creates a new user (level 4 only). `niveau_hierarchique` is derived from `localite` or `est_superviseur`.
- **Header**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "nom": "Jean Dupont",
    "prenom": "Jean",
    "email": "jean.dupont@example.com",
    "mot_de_passe": "password123",
    "localite": { "type": "arrondissement", "valeur": "Soa" },
    "est_superviseur": false
  }
  ```
- **Response** (201):
  ```json
  {
    "id": 4,
    "nom": "Jean Dupont",
    "prenom": "Jean",
    "email": "jean.dupont@example.com",
    "niveau_hierarchique": 1,
    "localite": { "type": "arrondissement", "valeur": "Soa" }
  }
  ```
- **Errors**:
  - 400: `{ "error": "Email déjà utilisé" }`
  - 403: `{ "error": "Réservé aux administrateurs" }`
  - 401: `{ "error": "Non autorisé" }`

### GET /api/utilisateurs/:id

- **Description**: Retrieves a user’s details (level 4 or self).
- **Header**: `Authorization: Bearer <token>`
- **Response** (200):
  ```json
  {
    "id": 1,
    "nom": "OKENE AHANDA MAMA PIE HERV",
    "prenom": "",
    "email": "okene.ahanda@example.com",
    "niveau_hierarchique": 1,
    "localite": { "type": "arrondissement", "valeur": "Soa" }
  }
  ```
- **Errors**:
  - 403: `{ "error": "Accès interdit" }`
  - 404: `{ "error": "Utilisateur non trouvé" }`
  - 401: `{ "error": "Non autorisé" }`

### PUT /api/utilisateurs/:id

- **Description**: Updates a user (level 4 or self). `niveau_hierarchique` is recalculated if `localite` changes.
- **Header**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "nom": "OKENE AHANDA",
    "prenom": "Mama",
    "email": "okene.ahanda@example.com",
    "localite": { "type": "arrondissement", "valeur": "Soa" },
    "est_superviseur": false
  }
  ```
- **Response** (200):
  ```json
  {
    "id": 1,
    "nom": "OKENE AHANDA",
    "prenom": "Mama",
    "email": "okene.ahanda@example.com",
    "niveau_hierarchique": 1,
    "localite": { "type": "arrondissement", "valeur": "Soa" }
  }
  ```
- **Errors**:
  - 400: `{ "error": "Email déjà utilisé" }`
  - 403: `{ "error": "Accès interdit" }`
  - 404: `{ "error": "Utilisateur non trouvé" }`
  - 401: `{ "error": "Non autorisé" }`

### DELETE /api/utilisateurs/:id

- **Description**: Deletes a user (level 4 only).
- **Header**: `Authorization: Bearer <token>`
- **Response** (200):
  ```json
  { "success": true }
  ```
- **Errors**:
  - 403: `{ "error": "Réservé aux administrateurs" }`
  - 404: `{ "error": "Utilisateur non trouvé" }`
  - 401: `{ "error": "Non autorisé" }`

---

## Projects

### GET /api/projets

- **Description**: Lists all projects (accessible to levels 1–4, filtered by `localite` for levels 1–2).
- **Header**: `Authorization: Bearer <token>`
- **Response** (200):
  ```json
  [
    {
      "id": 1,
      "nom": "Cadastre Soa 2025",
      "description": "Numérisation et validation des titres fonciers de Soa et environs (Mefou et Afamba)",
      "date_creation": "2025-07-23T10:00:00Z"
    }
  ]
  ```
- **Errors**:
  - 401: `{ "error": "Non autorisé" }`

### POST /api/projets

- **Description**: Creates a project (level 4 only).
- **Header**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "nom": "Cadastre Soa 2025",
    "description": "Numérisation et validation des titres fonciers de Soa et environs"
  }
  ```
- **Response** (201):
  ```json
  {
    "id": 1,
    "nom": "Cadastre Soa 2025",
    "description": "Numérisation et validation des titres fonciers de Soa et environs",
    "date_creation": "2025-07-23T10:00:00Z"
  }
  ```
- **Errors**:
  - 400: `{ "error": "Nom de projet requis" }`
  - 403: `{ "error": "Réservé aux administrateurs" }`
  - 401: `{ "error": "Non autorisé" }`

### GET /api/projets/:id

- **Description**: Retrieves project details (filtered by `localite` for levels 1–2).
- **Header**: `Authorization: Bearer <token>`
- **Response** (200):
  ```json
  {
    "id": 1,
    "nom": "Cadastre Soa 2025",
    "description": "Numérisation et validation des titres fonciers de Soa et environs",
    "date_creation": "2025-07-23T10:00:00Z"
  }
  ```
- **Errors**:
  - 403: `{ "error": "Accès interdit" }`
  - 404: `{ "error": "Projet non trouvé" }`
  - 401: `{ "error": "Non autorisé" }`

### PUT /api/projets/:id

- **Description**: Updates a project (level 4 only).
- **Header**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "nom": "Cadastre Soa 2025 Modifié",
    "description": "Nouvelle description"
  }
  ```
- **Response** (200):
  ```json
  {
    "id": 1,
    "nom": "Cadastre Soa 2025 Modifié",
    "description": "Nouvelle description",
    "date_creation": "2025-07-23T10:00:00Z"
  }
  ```
- **Errors**:
  - 400: `{ "error": "Nom de projet requis" }`
  - 403: `{ "error": "Réservé aux administrateurs" }`
  - 404: `{ "error": "Projet non trouvé" }`
  - 401: `{ "error": "Non autorisé" }`

### DELETE /api/projets/:id

- **Description**: Deletes a project (level 4 only).
- **Header**: `Authorization: Bearer <token>`
- **Response** (200):
  ```json
  { "success": true }
  ```
- **Errors**:
  - 403: `{ "error": "Réservé aux administrateurs" }`
  - 404: `{ "error": "Projet non trouvé" }`
  - 401: `{ "error": "Non autorisé" }`

---

## Roles and Permissions

### GET /api/roles

- **Description**: Lists all roles (level 4 only).
- **Header**: `Authorization: Bearer <token>`
- **Response** (200):
  ```json
  [
    {
      "id": 1,
      "projet_id": 1,
      "nom": "Extracteur Local",
      "niveau_hierarchique": 1,
      "description": "Utilisateur local pour extraction"
    },
    {
      "id": 2,
      "projet_id": 1,
      "nom": "Validateur Régional",
      "niveau_hierarchique": 2,
      "description": "Validateur au niveau départemental"
    }
  ]
  ```
- **Errors**:
  - 403: `{ "error": "Réservé aux administrateurs" }`
  - 401: `{ "error": "Non autorisé" }`

### POST /api/roles

- **Description**: Creates a role (level 4 only).
- **Header**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "projet_id": 1,
    "nom": "Extracteur Local",
    "niveau_hierarchique": 1,
    "description": "Utilisateur local pour extraction"
  }
  ```
- **Response** (201):
  ```json
  {
    "id": 1,
    "projet_id": 1,
    "nom": "Extracteur Local",
    "niveau_hierarchique": 1,
    "description": "Utilisateur local pour extraction"
  }
  ```
- **Errors**:
  - 400: `{ "error": "Champs requis manquants" }`
  - 403: `{ "error": "Réservé aux administrateurs" }`
  - 401: `{ "error": "Non autorisé" }`

### POST /api/roles/:id/permissions

- **Description**: Assigns permissions to a role (level 4 only).
- **Header**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "action": "extract_data"
  }
  ```
- **Response** (201):
  ```json
  {
    "id": 1,
    "role_id": 1,
    "action": "extract_data"
  }
  ```
- **Errors**:
  - 400: `{ "error": "Action déjà assignée" }`
  - 403: `{ "error": "Réservé aux administrateurs" }`
  - 404: `{ "error": "Rôle non trouvé" }`
  - 401: `{ "error": "Non autorisé" }`

### POST /api/roles/:id/utilisateurs

- **Description**: Assigns a user to a role (level 4 only).
- **Header**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "utilisateur_id": 1
  }
  ```
- **Response** (201):
  ```json
  {
    "utilisateur_id": 1,
    "role_id": 1
  }
  ```
- **Errors**:
  - 400: `{ "error": "Utilisateur déjà assigné à ce rôle" }`
  - 403: `{ "error": "Réservé aux administrateurs" }`
  - 404: `{ "error": "Rôle ou utilisateur non trouvé" }`
  - 401: `{ "error": "Non autorisé" }`

#L’erreur "Le nom 'fastify' est introuvable" est un faux positif de l’analyseur statique, le code est correct dans le contexte Fastify.#

---

## Localities

### GET /api/localites/autocomplete

- **Description**: Autocompletes localities for user/project configuration (level 4 only).
- **Header**: `Authorization: Bearer <token>`
- **Query**: `?type=arrondissement|departement&terme=string`
- **Response** (200):
  ```json
  ["Soa", "Yaoundé I", "Yaoundé II"]
  ```
- **Errors**:
  - 400: `{ "error": "Type de localité invalide" }`
  - 403: `{ "error": "Réservé aux administrateurs" }`
  - 401: `{ "error": "Non autorisé" }`

---

## Extractions

### GET /api/extractions

- **Description**: Lists extractions (filtered by `projet_id`, `statut`, `utilisateur_id`, and `localite` for levels 1–2).
- **Header**: `Authorization: Bearer <token>`
- **Query**: `?projet_id=integer&statut=string&utilisateur_id=integer`
- **Response** (200):
  ```json
  [
    {
      "id": 1,
      "projet_id": 1,
      "utilisateur_id": 1,
      "fichier": "titre_1.png",
      "donnees_extraites": {
        "proprietaire": "OKENE AHANDA MAMA PIE HERV",
        "surface_m2": 323.0,
        "perimetre_m": 637.4518023342832,
        "coordonnees_gps": [
          [11.599775887849335, 3.9915300998418504],
          [11.599931184680232, 3.991457821318175],
          [11.599866099504329, 3.991316788467999],
          [11.599735298636295, 3.9913776651149115],
          [11.599722156106091, 3.991413667401851],
          [11.599775887849335, 3.9915300998418504]
        ],
        "localite": { "type": "arrondissement", "valeur": "Soa" }
      },
      "seuil_confiance": 90.0,
      "statut": "Extrait",
      "date_extraction": "2025-07-24T10:00:00Z",
      "titre_foncier_id": 1
    }
  ]
  ```
- **Errors**:
  - 403: `{ "error": "Accès interdit" }`
  - 401: `{ "error": "Non autorisé" }`

### POST /api/extraction/upload

- **Description**: Uploads files for automatic extraction (stage 1 user only).
- **Header**: `Authorization: Bearer <token>`
- **Body**: Multipart form with files (JPG) + `projet_id` (integer), `localite` (JSONB)
- **Response** (201):
  ```json
  {
    "id": 1,
    "projet_id": 1,
    "utilisateur_id": 1,
    "fichier": "titre_1.png",
    "donnees_extraites": {
      "proprietaire": "OKENE AHANDA MAMA PIE HERV",
      "surface_m2": 323.0,
      "perimetre_m": 637.4518023342832,
      "coordonnees_gps": [
        [11.599775887849335, 3.9915300998418504],
        [11.599931184680232, 3.991457821318175],
        [11.599866099504329, 3.991316788467999],
        [11.599735298636295, 3.9913776651149115],
        [11.599722156106091, 3.991413667401851],
        [11.599775887849335, 3.9915300998418504]
      ],
      "localite": { "type": "arrondissement", "valeur": "Soa" }
    },
    "seuil_confiance": 90.0,
    "statut": "Extrait",
    "date_extraction": "2025-07-24T10:00:00Z",
    "titre_foncier_id": 1,
    "workflow_id": 1
  }
  ```
- **Errors**:
  - 400: `{ "error": "Fichier ou projet_id manquant" }`
  - 403: `{ "error": "Seul l’utilisateur de l’étape 1 peut extraire" }`
  - 401: `{ "error": "Non autorisé" }`

### GET /api/extractions/:id

- **Description**: Retrieves extraction details (accessible to assigned users or levels 3–4).
- **Header**: `Authorization: Bearer <token>`
- **Response** (200):
  ```json
  {
    "id": 1,
    "projet_id": 1,
    "utilisateur_id": 1,
    "fichier": "titre_1.png",
    "donnees_extraites": {
      "proprietaire": "OKENE AHANDA MAMA PIE HERV",
      "surface_m2": 323.0,
      "perimetre_m": 637.4518023342832,
      "coordonnees_gps": [
        [11.599775887849335, 3.9915300998418504],
        [11.599931184680232, 3.991457821318175],
        [11.599866099504329, 3.991316788467999],
        [11.599735298636295, 3.9913776651149115],
        [11.599722156106091, 3.991413667401851],
        [11.599775887849335, 3.9915300998418504]
      ],
      "localite": { "type": "arrondissement", "valeur": "Soa" }
    },
    "seuil_confiance": 90.0,
    "statut": "Extrait",
    "date_extraction": "2025-07-24T10:00:00Z",
    "titre_foncier_id": 1
  }
  ```
- **Errors**:
  - 403: `{ "error": "Accès interdit" }`
  - 404: `{ "error": "Extraction non trouvée" }`
  - 401: `{ "error": "Non autorisé" }`

### PUT /api/extractions/:id

- **Description**: Updates extraction data (accessible to stage 1 user or levels 3–4).
- **Header**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "donnees_extraites": {
      "proprietaire": "OKENE AHANDA MAMA PIE HERV",
      "surface_m2": 350.0,
      "perimetre_m": 650.0,
      "coordonnees_gps": [
        [11.599775887849335, 3.9915300998418504],
        [11.599931184680232, 3.991457821318175],
        [11.599866099504329, 3.991316788467999],
        [11.599735298636295, 3.9913776651149115],
        [11.599722156106091, 3.991413667401851],
        [11.599775887849335, 3.9915300998418504]
      ],
      "localite": { "type": "arrondissement", "valeur": "Soa" }
    },
    "statut": "Corrigé"
  }
  ```
- **Response** (200):
  ```json
  {
    "id": 1,
    "projet_id": 1,
    "utilisateur_id": 1,
    "fichier": "titre_1.png",
    "donnees_extraites": {
      "proprietaire": "OKENE AHANDA MAMA PIE HERV",
      "surface_m2": 350.0,
      "perimetre_m": 650.0,
      "coordonnees_gps": [
        [11.599775887849335, 3.9915300998418504],
        [11.599931184680232, 3.991457821318175],
        [11.599866099504329, 3.991316788467999],
        [11.599735298636295, 3.9913776651149115],
        [11.599722156106091, 3.991413667401851],
        [11.599775887849335, 3.9915300998418504]
      ],
      "localite": { "type": "arrondissement", "valeur": "Soa" }
    },
    "seuil_confiance": 90.0,
    "statut": "Corrigé",
    "date_extraction": "2025-07-24T10:00:00Z",
    "titre_foncier_id": 1
  }
  ```
- **Errors**:
  - 400: `{ "error": "Données invalides" }`
  - 403: `{ "error": "Accès interdit" }`
  - 404: `{ "error": "Extraction non trouvée" }`
  - 401: `{ "error": "Non autorisé" }`

### DELETE /api/extractions/:id

- **Description**: Deletes an extraction (level 4 only).
- **Header**: `Authorization: Bearer <token>`
- **Response** (200):
  ```json
  { "success": true }
  ```
- **Errors**:
  - 403: `{ "error": "Réservé aux administrateurs" }`
  - 404: `{ "error": "Extraction non trouvée" }`
  - 401: `{ "error": "Non autorisé" }`

### POST /api/extraction/update_external

- **Description**: Proxies modified extraction data to the external Flask API (stages n+1 users or levels 3–4).
- **Header**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "titre_id": 1,
    "donnees": {
      "proprietaire": "OKENE AHANDA MAMA PIE HERV",
      "surface_m2": 350.0,
      "perimetre_m": 650.0,
      "coordonnees_gps": [
        [11.599775887849335, 3.9915300998418504],
        [11.599931184680232, 3.991457821318175],
        [11.599866099504329, 3.991316788467999],
        [11.599735298636295, 3.9913776651149115],
        [11.599722156106091, 3.991413667401851],
        [11.599775887849335, 3.9915300998418504]
      ],
      "localite": { "type": "arrondissement", "valeur": "Soa" }
    }
  }
  ```
- **Response** (200):
  ```json
  { "success": true, "message": "Données envoyées à l’API Flask" }
  ```
- **Errors**:
  - 403: `{ "error": "Accès interdit" }`
  - 500: `{ "error": "Erreur lors de la communication avec l’API Flask" }`
  - 401: `{ "error": "Non autorisé" }`

---

## Land Titles

### GET /api/titres_fonciers

- **Description**: Lists land titles (filtered by `localite` for levels 1–2).
- **Header**: `Authorization: Bearer <token>`
- **Response** (200):
  ```json
  [
    {
      "id": 1,
      "projet_id": 1,
      "proprietaire": "OKENE AHANDA MAMA PIE HERV",
      "surface_m2": 323.0,
      "perimetre_m": 637.4518023342832,
      "coordonnees_gps": [
        [11.599775887849335, 3.9915300998418504],
        [11.599931184680232, 3.991457821318175],
        [11.599866099504329, 3.991316788467999],
        [11.599735298636295, 3.9913776651149115],
        [11.599722156106091, 3.991413667401851],
        [11.599775887849335, 3.9915300998418504]
      ],
      "localite": { "type": "arrondissement", "valeur": "Soa" }
    },
    {
      "id": 2,
      "projet_id": 1,
      "proprietaire": "NDJOMO Paul",
      "surface_m2": 250.0,
      "perimetre_m": 80.0,
      "coordonnees_gps": [
        [11.6001, 3.992],
        [11.6002, 3.9921],
        [11.6003, 3.992],
        [11.6001, 3.992]
      ],
      "localite": { "type": "arrondissement", "valeur": "Nkolafamba" }
    }
  ]
  ```
- **Errors**:
  - 401: `{ "error": "Non autorisé" }`

### GET /api/titres_fonciers/:id

- **Description**: Retrieves land title details (filtered by `localite` for levels 1–2).
- **Header**: `Authorization: Bearer <token>`
- **Response** (200):
  ```json
  {
    "id": 1,
    "projet_id": 1,
    "proprietaire": "OKENE AHANDA MAMA PIE HERV",
    "surface_m2": 323.0,
    "perimetre_m": 637.4518023342832,
    "coordonnees_gps": [
      [11.599775887849335, 3.9915300998418504],
      [11.599931184680232, 3.991457821318175],
      [11.599866099504329, 3.991316788467999],
      [11.599735298636295, 3.9913776651149115],
      [11.599722156106091, 3.991413667401851],
      [11.599775887849335, 3.9915300998418504]
    ],
    "localite": { "type": "arrondissement", "valeur": "Soa" }
  }
  ```
- **Errors**:
  - 403: `{ "error": "Accès interdit" }`
  - 404: `{ "error": "Titre foncier non trouvé" }`
  - 401: `{ "error": "Non autorisé" }`

### POST /api/titres_fonciers

- **Description**: Creates a land title (level 4 or stage 1 user).
- **Header**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "projet_id": 1,
    "proprietaire": "OKENE AHANDA MAMA PIE HERV",
    "surface_m2": 323.0,
    "perimetre_m": 637.4518023342832,
    "coordonnees_gps": [
      [11.599775887849335, 3.9915300998418504],
      [11.599931184680232, 3.991457821318175],
      [11.599866099504329, 3.991316788467999],
      [11.599735298636295, 3.9913776651149115],
      [11.599722156106091, 3.991413667401851],
      [11.599775887849335, 3.9915300998418504]
    ],
    "localite": { "type": "arrondissement", "valeur": "Soa" }
  }
  ```
- **Response** (201):
  ```json
  {
    "id": 1,
    "projet_id": 1,
    "proprietaire": "OKENE AHANDA MAMA PIE HERV",
    "surface_m2": 323.0,
    "perimetre_m": 637.4518023342832,
    "coordonnees_gps": [
      [11.599775887849335, 3.9915300998418504],
      [11.599931184680232, 3.991457821318175],
      [11.599866099504329, 3.991316788467999],
      [11.599735298636295, 3.9913776651149115],
      [11.599722156106091, 3.991413667401851],
      [11.599775887849335, 3.9915300998418504]
    ],
    "localite": { "type": "arrondissement", "valeur": "Soa" }
  }
  ```
- **Errors**:
  - 400: `{ "error": "Données invalides" }`
  - 403: `{ "error": "Accès interdit" }`
  - 401: `{ "error": "Non autorisé" }`

### PUT /api/titres_fonciers/:id

- **Description**: Updates a land title (stages n+1 users or levels 3–4; sends to Flask API).
- **Header**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "proprietaire": "NDJOMO Paul",
    "surface_m2": 250.0,
    "perimetre_m": 80.0,
    "coordonnees_gps": [
      [11.6001, 3.992],
      [11.6002, 3.9921],
      [11.6003, 3.992],
      [11.6001, 3.992]
    ],
    "localite": { "type": "arrondissement", "valeur": "Nkolafamba" }
  }
  ```
- **Response** (200):
  ```json
  {
    "id": 2,
    "projet_id": 1,
    "proprietaire": "NDJOMO Paul",
    "surface_m2": 250.0,
    "perimetre_m": 80.0,
    "coordonnees_gps": [
      [11.6001, 3.992],
      [11.6002, 3.9921],
      [11.6003, 3.992],
      [11.6001, 3.992]
    ],
    "localite": { "type": "arrondissement", "valeur": "Nkolafamba" }
  }
  ```
- **Errors**:
  - 400: `{ "error": "Données invalides" }`
  - 403: `{ "error": "Accès interdit" }`
  - 404: `{ "error": "Titre foncier non trouvé" }`
  - 500: `{ "error": "Erreur lors de l’envoi à l’API Flask" }`
  - 401: `{ "error": "Non autorisé" }`

### DELETE /api/titres_fonciers/:id

- **Description**: Deletes a land title (level 4 only).
- **Header**: `Authorization: Bearer <token>`
- **Response** (200):
  ```json
  { "success": true }
  ```
- **Errors**:
  - 403: `{ "error": "Réservé aux administrateurs" }`
  - 404: `{ "error": "Titre foncier non trouvé" }`
  - 401: `{ "error": "Non autorisé" }`

---

## Workflows

### GET /api/workflows

- **Description**: Lists workflows (filtered by `projet_id`, `titre_foncier_id`, `statut`, and `localite` for levels 1–2).
- **Header**: `Authorization: Bearer <token>`
- **Response** (200):
  ```json
  [
    {
      "id": 1,
      "projet_id": 1,
      "titre_foncier_id": 1,
      "statut": "En cours",
      "current_etape_ordre": 2,
      "date_creation": "2025-07-23T10:00:00Z",
      "taches": [
        {
          "id": 1,
          "etape_id": 1,
          "etape_nom": "Extraction Initiale",
          "etape_ordre": 1,
          "utilisateur_id": 1,
          "statut": "Approuvé",
          "commentaire": "Extraction terminée",
          "piece_jointe": null,
          "date_execution": "2025-07-23T10:30:00Z"
        },
        {
          "id": 2,
          "etape_id": 2,
          "etape_nom": "Validation Régionale",
          "etape_ordre": 2,
          "utilisateur_id": 2,
          "statut": "En attente",
          "commentaire": null,
          "piece_jointe": null,
          "date_execution": null
        }
      ]
    }
  ]
  ```
- **Errors**:
  - 401: `{ "error": "Non autorisé" }`

### POST /api/workflows

- **Description**: Starts a workflow for an extraction (stage 1 user or level 4).
- **Header**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "projet_id": 1,
    "titre_foncier_id": 1
  }
  ```
- **Response** (201):
  ```json
  {
    "id": 1,
    "projet_id": 1,
    "titre_foncier_id": 1,
    "statut": "En cours",
    "current_etape_ordre": 1,
    "date_creation": "2025-07-23T10:00:00Z",
    "taches": [
      {
        "id": 1,
        "etape_id": 1,
        "etape_nom": "Extraction Initiale",
        "etape_ordre": 1,
        "utilisateur_id": 1,
        "statut": "En attente",
        "commentaire": null,
        "piece_jointe": null,
        "date_execution": null
      }
    ]
  }
  ```
- **Errors**:
  - 400: `{ "error": "Projet ou titre foncier non trouvé" }`
  - 403: `{ "error": "Accès interdit" }`
  - 401: `{ "error": "Non autorisé" }`

### GET /api/workflows/:id

- **Description**: Retrieves workflow details.
- **Header**: `Authorization: Bearer <token>`
- **Response** (200):
  ```json
  {
    "id": 1,
    "projet_id": 1,
    "titre_foncier_id": 1,
    "statut": "En cours",
    "current_etape_ordre": 2,
    "date_creation": "2025-07-23T10:00:00Z",
    "taches": [
      {
        "id": 1,
        "etape_id": 1,
        "etape_nom": "Extraction Initiale",
        "etape_ordre": 1,
        "utilisateur_id": 1,
        "statut": "Approuvé",
        "commentaire": "Extraction terminée",
        "piece_jointe": null,
        "date_execution": "2025-07-23T10:30:00Z"
      },
      {
        "id": 2,
        "etape_id": 2,
        "etape_nom": "Validation Régionale",
        "etape_ordre": 2,
        "utilisateur_id": 2,
        "statut": "En attente",
        "commentaire": null,
        "piece_jointe": null,
        "date_execution": null
      }
    ]
  }
  ```
- **Errors**:
  - 403: `{ "error": "Accès interdit" }`
  - 404: `{ "error": "Workflow non trouvé" }`
  - 401: `{ "error": "Non autorisé" }`

### POST /api/workflows/submit

- **Description**: Submits a workflow to the next stage (current stage user).
- **Header**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "workflow_id": 1
  }
  ```
- **Response** (200):
  ```json
  {
    "success": true,
    "message": "Soumis à l’étape suivante",
    "workflow": {
      "id": 1,
      "projet_id": 1,
      "titre_foncier_id": 1,
      "statut": "En cours",
      "current_etape_ordre": 2
    }
  }
  ```
- **Errors**:
  - 400: `{ "error": "Aucun utilisateur disponible pour l’étape suivante" }`
  - 403: `{ "error": "Non autorisé à soumettre cette tâche" }`
  - 404: `{ "error": "Workflow non trouvé ou terminé" }`
  - 401: `{ "error": "Non autorisé" }`

---

## Validation

### PUT /api/taches/:id/valider

- **Description**: Validates or rejects a task (stages n+1 users). Rejection requires a comment; validation comment is optional.
- **Header**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "statut": "Approuvé", // or "Rejeté"
    "commentaire": "Tout est correct", // Required for "Rejeté"
    "piece_jointe": "string" // Optional file path
  }
  ```
- **Response** (200):
  ```json
  {
    "success": true,
    "message": "Tâche validée",
    "tache": {
      "id": 2,
      "workflow_id": 1,
      "etape_id": 2,
      "utilisateur_id": 2,
      "statut": "Approuvé",
      "commentaire": "Tout est correct",
      "piece_jointe": null,
      "date_execution": "2025-07-24T10:00:00Z"
    }
  }
  ```
- **Errors**:
  - 400: `{ "error": "Commentaire obligatoire pour un rejet" }`
  - 403: `{ "error": "Tâche non autorisée ou déjà traitée" }`
  - 404: `{ "error": "Tâche non trouvée" }`
  - 401: `{ "error": "Non autorisé" }`

---

## Audit Logs

### GET /api/audit

- **Description**: Lists audit logs (levels 3–4, filtered by `localite` for level 3).
- **Header**: `Authorization: Bearer <token>`
- **Query**: `?projet_id=integer&utilisateur_id=integer&date_debut=string&date_fin=string`
- **Response** (200):
  ```json
  [
    {
      "id": 1,
      "utilisateur_id": 1,
      "action": "extract_data",
      "projet_id": 1,
      "details": {
        "titre_id": 1,
        "fichier": "titre_1.png"
      },
      "date_action": "2025-07-23T10:30:00Z"
    },
    {
      "id": 2,
      "utilisateur_id": 1,
      "action": "submit_to_next_stage",
      "projet_id": 1,
      "details": {
        "workflow_id": 1,
        "new_etape_ordre": 2
      },
      "date_action": "2025-07-23T10:30:05Z"
    }
  ]
  ```
- **Errors**:
  - 403: `{ "error": "Accès interdit" }`
  - 401: `{ "error": "Non autorisé" }`

### POST /api/audit/export

- **Description**: Exports audit logs as PDF (levels 3–4).
- **Header**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "projet_id": 1,
    "utilisateur_id": 1,
    "date_debut": "2025-07-23",
    "date_fin": "2025-07-24"
  }
  ```
- **Response** (200):
  ```json
  {
    "success": true,
    "file_path": "audit_report_20250724.pdf"
  }
  ```
- **Errors**:
  - 403: `{ "error": "Accès interdit" }`
  - 401: `{ "error": "Non autorisé" }`

---

## Geospatial

### GET /api/titres_fonciers/geojson

- **Description**: Returns land titles as GeoJSON for map display (filtered by `localite` for levels 1–2).
- **Header**: `Authorization: Bearer <token>`
- **Response** (200):
  ```json
  {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "geometry": {
          "type": "Polygon",
          "coordinates": [
            [
              [11.599775887849335, 3.9915300998418504],
              [11.599931184680232, 3.991457821318175],
              [11.599866099504329, 3.991316788467999],
              [11.599735298636295, 3.9913776651149115],
              [11.599722156106091, 3.991413667401851],
              [11.599775887849335, 3.9915300998418504]
            ]
          ]
        },
        "properties": {
          "id": 1,
          "projet_id": 1,
          "proprietaire": "OKENE AHANDA MAMA PIE HERV",
          "surface_m2": 323.0,
          "perimetre_m": 637.4518023342832,
          "localite": { "type": "arrondissement", "valeur": "Soa" }
        }
      },
      {
        "type": "Feature",
        "geometry": {
          "type": "Polygon",
          "coordinates": [
            [
              [11.6001, 3.992],
              [11.6002, 3.9921],
              [11.6003, 3.992],
              [11.6001, 3.992]
            ]
          ]
        },
        "properties": {
          "id": 2,
          "projet_id": 1,
          "proprietaire": "NDJOMO Paul",
          "surface_m2": 250.0,
          "perimetre_m": 80.0,
          "localite": { "type": "arrondissement", "valeur": "Nkolafamba" }
        }
      }
    ]
  }
  ```
- **Errors**:
  - 401: `{ "error": "Non autorisé" }`

---

## Extraction Configurations

### POST /api/extraction/config

- **Description**: Configures extraction parameters (level 4 only).
- **Header**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "projet_id": 1,
    "seuil_confiance": 90.0,
    "formats": ["png", "pdf", "jpeg"],
    "coord_format": "decimal"
  }
  ```
- **Response** (201):
  ```json
  {
    "id": 1,
    "projet_id": 1,
    "seuil_confiance": 90.0,
    "formats": ["png", "pdf", "jpeg"],
    "coord_format": "decimal",
    "date_creation": "2025-07-23T10:00:00Z"
  }
  ```
- **Errors**:
  - 400: `{ "error": "Paramètres invalides" }`
  - 403: `{ "error": "Réservé aux administrateurs" }`
  - 401: `{ "error": "Non autorisé" }`

---

## Security & Access Control

- **Authentication**: All routes require `Authorization: Bearer <token>` (JWT).
- **RBAC**:
  - **Level 1**: Can perform extraction (`/api/extraction/upload`, stage 1 only) and view titles/workflows in their `localite` (arrondissement).
  - **Level 2**: Can validate/reject tasks (stages n+1) and view titles/workflows in their `localite` (departement or arrondissement).
  - **Level 3**: Can validate/reject tasks (stages n+1) and view all titles/workflows.
  - **Level 4**: Full access (configuration, user management, project management, audit logs).
- **Extraction Restriction**: `/api/extraction/upload` is restricted to the user assigned to stage 1 of the workflow (`taches.utilisateur_id`, `etapes.ordre = 1`).
- **Validation Rules**:
  - Rejection (`statut: "Rejeté"`) requires a `commentaire`.
  - Validation (`statut: "Approuvé"`) allows optional `commentaire` and `piece_jointe`.
  - Modifications to `titres_fonciers` or `extractions` by stages n+1 users trigger a `POST /api/extraction/update_external` call to the Flask API.
- **File Uploads**:
  - Validate file types (PNG, JPEG, PDF).
  - Limit file size (e.g., 10MB).
  - Optional: Implement antivirus scanning.
- **Error Handling**:
  - 400: Invalid request data.
  - 401: Missing or invalid JWT.
  - 403: Insufficient `niveau_hierarchique` or role.
  - 404: Resource not found.
  - 500: Server error (e.g., Flask API failure).
  - Format: `{ "error": "message" }`

---

## Notes – Version Prisma / 2025

- **Framework**  
  Fastify.js est conservé pour sa rapidité et son écosystème de plugins ; toutes les routes sont typées en TypeScript et déclarées via des plugins Fastify autogénérés à partir des modèles Prisma.

- **Base de données & ORM**  
  PostgreSQL 15+ avec **Prisma ORM** (v5).  
  Schéma Prisma reflète les tables : `utilisateurs`, `projets`, `roles`, `permissions`, `localites`, `titres_fonciers`, `extractions`, `extraction_configs`, `workflows`, `taches`, `audit_logs`.  
  – PostGIS activé (`extensions = [postgis]` dans `schema.prisma`).  
  – Migrations gérées via `npx prisma migrate dev`.

- **Flask Integration**  
  Toujours via `http://flask-api/extraction/update`, mais le payload est maintenant **validé par un schéma Prisma généré** avant envoi ; réponse asynchrone via webhook stockée dans `extractions.resultat_flask`.

- **Géospatial**  
  Champs `coordonnees_gps` déclarés `Unsupported("geometry")` dans Prisma ; validation PostGIS (ST_Within + enveloppe Cameroun) encapsulée dans un middleware Prisma `$extends`.

- **Audit Logging**  
  Utilisation du **Prisma Client Extension** `@prisma-extension/audit` : chaque `create`, `update`, `delete` sur les entités principales alimente automatiquement `audit_logs` (timestamp, userId, diff JSON).

- **Scalability**  
  – Clustering Fastify via `fastify-cluster`.  
  – File d’attente **BullMQ** pilotée par `extractions.queue` et `workers/extraction.worker.ts` ; jobs persistés dans Redis, résultats écrits via Prisma.

- **Security**  
  HTTPS partout, certificats Let’s Encrypt.  
  Données sensibles (mot de passe, coord. GPS précises) chiffrées côté serveur via AES-256-GCM avec clé stockée dans **AWS Secrets Manager** et référencée via `env("AES_KEY")`.

Pour des routes ou règles métier spécifiques, fournissez les détails requis.
