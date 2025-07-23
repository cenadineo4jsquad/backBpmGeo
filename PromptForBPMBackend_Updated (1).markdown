# Prompt pour la conception du backend du système BPM personnalisé avec intégration d’extraction et nouvelles fonctionnalités frontend

## Contexte
Le système BPM personnalisé, intégré au projet d’extraction et de structuration automatique des données géospatiales à partir de titres fonciers numérisés (images), est développé avec **Fastify.js** et **PostgreSQL**. L’extraction utilise **Tesseract** pour l’OCR et **`fuzzywuzzy`** pour la logique floue avec un seuil de confiance de 85–95%, gérant les imprécisions textuelles sans spéculer sur les coordonnées décimales. Le BPM orchestre la validation semi-automatique des données extraites (coordonnées géographiques, nom du propriétaire, surface, périmètre, localité) via des workflows configurés dynamiquement. Les utilisateurs sont organisés dans une structure hiérarchique décentralisée, où le niveau hiérarchique (`niveau_hierarchique`) est déterminé par la localité (`localite`) lors de la création de l’utilisateur par un administrateur (niveau 4 - Superviseur) :
- `localite.type = "arrondissement"` → `niveau_hierarchique = 1` (local).
- `localite.type = "departement"` → `niveau_hierarchique = 2` (regional).
- `localite.type = "administration_centrale"` → `niveau_hierarchique = 3` (national) ou `4` (superviseur, si spécifié).
Le backend doit :
- Réserver la configuration des projets, étapes, rôles, permissions, utilisateurs, et paramètres d’extraction aux administrateurs (niveau 4).
- Restreindre l’extraction aux premiers utilisateurs assignés à la première étape du workflow (niveaux 1–3).
- Fournir une API dédiée pour la configuration des paramètres d’extraction.
- Supporter une interface frontend affichant les titres fonciers sous forme de dossiers (nom du propriétaire, localité) et une page de détails avec modification et visualisation cartographique (Leaflet) en temps réel.
- Supporter un assistant de configuration (setup wizard) avec assignation automatique du `niveau_hierarchique` basé sur la localité, et autocomplétion pour les départements et arrondissements du Cameroun.
- Initier automatiquement un workflow BPM après chaque extraction.
- Supporter la correction manuelle, les commentaires (obligatoires pour les rejets), et les pièces jointes (PDF, JPG, PNG).
- Assurer une journalisation complète pour la traçabilité.
- Être sécurisé avec JSON Web Tokens (JWT) et RBAC.

## Objectif
Concevoir un backend Fastify.js avec PostgreSQL pour gérer la configuration, l’exécution des workflows BPM, l’extraction des données géospatiales, et les nouvelles fonctionnalités frontend. The backend must:
- Provide REST API endpoints for configuration (restricted to level 4) and extraction (restricted to the first assigned user).
- Support land title folder lists and details with real-time updates.
- Enforce automatic `niveau_hierarchique` assignment based on `localite` during user creation.
- Provide autocomplete for Cameroon localities.
- Integrate extraction with BPM for automatic task creation.
- Be secure, performant, and aligned with the React frontend.

## Exigences fonctionnelles

### 1. Configuration administrative via l’assistant de configuration
**Objectif**: Allow administrators (level 4) to configure projects, stages, roles, permissions, users, and extraction parameters, with automatic `niveau_hierarchique` assignment based on `localite`.
- **Endpoints**:
  - `POST /api/projets`: Create a project (nom, description, date_creation).
  - `PUT /api/projets/:id`: Update a project.
  - `DELETE /api/projets/:id`: Delete a project.
  - `POST /api/projets/:id/etapes`: Add a stage (nom, ordre, description, type_validation: semi-automatique/manuelle).
  - `PUT /api/etapes/:id`: Update a stage.
  - `DELETE /api/etapes/:id`: Delete a stage.
  - `POST /api/projets/:id/roles`: Create a role (nom, niveau_hierarchique, description).
  - `POST /api/roles/:id/permissions`: Assign permissions (edit_coordinates, validate_geometry, etc.).
  - `POST /api/utilisateurs`: Create a user (nom, prenom, email, mot_de_passe, localite, est_superviseur). Automatically set `niveau_hierarchique` based on `localite.type`:
    - "arrondissement" → 1.
    - "departement" → 2.
    - "administration_centrale" → 3, or 4 if `est_superviseur = true`.
  - `POST /api/roles/:id/utilisateurs`: Assign a user to a role.
  - `POST /api/extraction/config`: Configure extraction parameters (seuil_confiance, formats, coord_format, projet_id).
  - `PUT /api/extraction/config/:id`: Update an extraction configuration.
  - `DELETE /api/extraction/config/:id`: Delete an extraction configuration.
  - `GET /api/localites/autocomplete`: Provide autocomplete suggestions for Cameroon departments and arrondissements (query: terme, type: departement/arrondissement).
- **Logic**:
  - Verify `niveau_hierarchique == 4` via JWT for configuration endpoints.
  - Validate stage order (sequential, unique per project).
  - Validate user creation:
    - Ensure `localite.type` is "administration_centrale", "departement", or "arrondissement".
    - Set `niveau_hierarchique` automatically based on `localite.type` and `est_superviseur`.
    - Validate email uniqueness and password strength (> 8 characters).
  - For autocomplete, query the `localites` table with `ILIKE %terme%`, limiting to 10 results.
  - Log all configuration actions in `audit_logs`.
- **Example**:
  - An administrator creates a project via `POST /api/projets` (nom: "Cadastre Douala 2025").
  - They add a stage via `POST /api/projets/1/etapes` (nom: "Validation géométrique", ordre: 1, type: semi-automatique).
  - They create a user via `POST /api/utilisateurs` (nom: "Dupont", prenom: "Jean", localite: { type: "arrondissement", valeur: "Douala I" }, est_superviseur: false → niveau_hierarchique: 1).
  - They search "Douala" via `GET /api/localites/autocomplete?type=arrondissement&terme=Douala`, receiving ["Douala I", "Douala II"].
  - They configure extraction via `POST /api/extraction/config` (seuil_confiance: 90, formats: ["png", "pdf"], coord_format: "decimal").

### 2. Gestion des titres fonciers (dossiers et détails)
**Objectif**: Provide endpoints for listing land titles as folders and managing their details with real-time map updates.
- **Endpoints**:
  - `GET /api/titres_fonciers`: List accessible land titles (filtered by niveau_hierarchique and localite).
  - `GET /api/titres_fonciers/:id`: Retrieve title details (proprietaire, coordonnees_gps, surface_m2, perimetre_m, localite).
  - `PUT /api/titres_fonciers/:id`: Update title details.
- **Logic**:
  - Filter titles based on user’s `niveau_hierarchique` and `localite`:
    - Level 1: Access titles where `localite.type = "arrondissement"` and `localite.valeur` matches user’s.
    - Level 2: Access titles where `localite.type = "arrondissement"` or `localite.type = "departement"` and `localite.valeur` matches.
    - Level 3–4: Access all titles.
  - Validate coordinate updates with PostGIS (ensure polygon is valid and within Cameroon’s national triangle).
  - Log updates in `audit_logs` with details (user, title ID, modified fields).
  - Return formatted data for folders (proprietaire, localite.valeur) and details (full data).
- **Example**:
  - A user (level 1, localite: { type: "arrondissement", valeur: "Douala I" }) calls `GET /api/titres_fonciers`, receiving [{ id: 1, proprietaire: "Jean Dupont", localite: { type: "arrondissement", valeur: "Douala I" } }, ...].
  - They retrieve details via `GET /api/titres_fonciers/1`: { proprietaire: "Jean Dupont", coordonnees_gps: [[48.8566, 2.3522], ...], surface_m2: 1250.5 }.
  - They update via `PUT /api/titres_fonciers/1`, modifying coordinates.

### 3. Extraction de données
**Objectif**: Allow the first user assigned to the initial workflow stage to perform extractions and correct results.
- **Endpoints**:
  - `POST /api/extraction/upload`: Upload images and extract data (files: PNG/JPEG/PDF, projet_id, localite).
  - `PUT /api/extractions/:id`: Correct extracted data (proprietaire, coordonnees_gps, localite).
  - `GET /api/projets/:id/etapes/premiere`: Verify if the user is the first assigned.
- **Logic**:
  - Verify the user is the first assigned (`taches.utilisateur_id` for `etapes.ordre = 1`).
  - Use Tesseract for text extraction, `fuzzywuzzy` for data identification (threshold 85–95%).
  - Build a polygon with Shapely, calculate surface and perimeter.
  - Validate polygon with PostGIS (within national triangle).
  - Store extracted data in `titres_fonciers` and `extractions`, linking via `titre_foncier_id`.
  - Create a BPM task via `POST /api/workflows`.
  - Ensure extracted `localite` matches user’s `localite` for levels 1–2.
- **Example**:
  - A user (level 1, first assigned, localite: "Douala I") uploads a PNG via `POST /api/extraction/upload`.
  - The system extracts { proprietaire: "Jean Dupont", coordonnees_gps: [[48.8566, 2.3522], ...], localite: { type: "arrondissement", valeur: "Douala I" } }.
  - A validation task is created for the project.

### 4. Gestion des workflows BPM
**Objectif**: Orchestrate semi-automatic validation workflows.
- **Endpoints**:
  - `POST /api/workflows`: Create a workflow (projet_id, titre_foncier_id).
  - `PUT /api/taches/:id/valider`: Validate/reject a task (statut, commentaire, piece_jointe).
  - `GET /api/projets/:id/taches`: List project tasks for the user.
- **Logic**:
  - Create tasks after extraction, assigned based on roles and `niveau_hierarchique`.
  - Verify task access (`niveau_hierarchique >= tache.niveau_requis` and matching `localite` for levels 1–2).
  - Require comments for rejections.
  - Store attachments on a file system, record paths in PostgreSQL.
  - Update workflow status (En cours, Approuvé, Rejeté).
- **Example**:
  - After extraction, a workflow is created via `POST /api/workflows`.
  - A task is assigned to the first user, who rejects with a comment "Coordonnées incorrectes" and a PDF.

### 5. Audit et traçabilité
**Objectif**: Provide a history of actions for audit.
- **Endpoints**:
  - `GET /api/audit`: List actions (filtered by project, user, date, status, localite).
  - `POST /api/audit/export`: Export history as PDF.
- **Logic**:
  - Log all actions (creation, extraction, validation, updates) in `audit_logs`.
  - Restrict access to levels 3–4.
  - Support filtering by `localite` for level 3.
  - Generate PDF reports with details (user, localite, action, date).
- **Example**:
  - An administrator queries `GET /api/audit?localite=Yaoundé I`, sees an extraction and rejection.
  - They export a report via `POST /api/audit/export`.

## Exigences non fonctionnelles
- **Sécurité**:
  - JWT authentication with `niveau_hierarchique` and `localite` verification.
  - RBAC: configuration for level 4, extraction for first assigned user, title access based on `localite`.
  - AES encryption for sensitive data (mot_de_passe, proprietaire).
  - Secure attachment storage.
- **Performance**:
  - API response < 200 ms for GET.
  - Image extraction < 5 seconds.
  - Autocomplete < 100 ms.
- **Scalabilité**:
  - Fastify.js clustering with load balancing.
  - BullMQ queue for asynchronous extractions.
  - PostGIS spatial indexes for geometries.
- **Traçabilité**:
  - Log all actions in `audit_logs`.
  - Store extracted data in `extractions` and `titres_fonciers`.
- **Compatibilité**:
  - REST JSON API.
  - Support PNG, JPEG, PDF formats.

## Structure de la base de données
```sql
-- Table for Cameroon localities
CREATE TABLE localites (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL CHECK (type IN ('administration_centrale', 'departement', 'arrondissement')),
    valeur VARCHAR(255) NOT NULL,
    UNIQUE (type, valeur)
);

-- Projects
CREATE TABLE projets (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Workflow stages
CREATE TABLE etapes (
    id SERIAL PRIMARY KEY,
    projet_id INTEGER REFERENCES projets(id),
    nom VARCHAR(100) NOT NULL,
    ordre INTEGER NOT NULL,
    description TEXT,
    type_validation VARCHAR(50) NOT NULL CHECK (type_validation IN ('semi-automatique', 'manuelle')),
    CONSTRAINT unique_ordre_projet UNIQUE (projet_id, ordre)
);

-- Roles
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    projet_id INTEGER REFERENCES projets(id),
    nom VARCHAR(100) NOT NULL,
    niveau_hierarchique INTEGER NOT NULL CHECK (niveau_hierarchique IN (1, 2, 3, 4)),
    description TEXT
);

-- Permissions
CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    role_id INTEGER REFERENCES roles(id),
    action VARCHAR(100) NOT NULL,
    UNIQUE (role_id, action)
);

-- Users
CREATE TABLE utilisateurs (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    prenom VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    mot_de_passe VARCHAR(255) NOT NULL,
    niveau_hierarchique INTEGER NOT NULL CHECK (niveau_hierarchique IN (1, 2, 3, 4)),
    localite JSONB NOT NULL
);

-- User-role assignments
CREATE TABLE utilisateurs_roles (
    utilisateur_id INTEGER REFERENCES utilisateurs(id),
    role_id INTEGER REFERENCES roles(id),
    PRIMARY KEY (utilisateur_id, role_id)
);

-- Land titles
CREATE TABLE titres_fonciers (
    id SERIAL PRIMARY KEY,
    projet_id INTEGER REFERENCES projets(id),
    proprietaire VARCHAR(255) NOT NULL,
    coordonnees_gps JSONB,
    surface_m2 FLOAT,
    perimetre_m FLOAT,
    localite JSONB NOT NULL
);

-- Extractions
CREATE TABLE extractions (
    id SERIAL PRIMARY KEY,
    projet_id INTEGER REFERENCES projets(id),
    utilisateur_id INTEGER REFERENCES utilisateurs(id),
    fichier VARCHAR(255) NOT NULL,
    donnees_extraites JSONB,
    seuil_confiance FLOAT NOT NULL CHECK (seuil_confiance BETWEEN 85 AND 95),
    statut VARCHAR(50) DEFAULT 'Extrait',
    date_extraction TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    titre_foncier_id INTEGER REFERENCES titres_fonciers(id),
    CONSTRAINT check_premier_utilisateur CHECK (
        utilisateur_id IN (
            SELECT utilisateur_id 
            FROM taches t 
            JOIN etapes e ON t.etape_id = e.id 
            WHERE e.projet_id = projet_id AND e.ordre = 1
        )
    )
);

-- Extraction configurations
CREATE TABLE extraction_configs (
    id SERIAL PRIMARY KEY,
    projet_id INTEGER REFERENCES projets(id),
    seuil_confiance FLOAT NOT NULL CHECK (seuil_confiance BETWEEN 85 AND 95),
    formats VARCHAR(50)[] NOT NULL,
    coord_format VARCHAR(50) NOT NULL CHECK (coord_format IN ('decimal', 'dms')),
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Workflows
CREATE TABLE workflows (
    id SERIAL PRIMARY KEY,
    projet_id INTEGER REFERENCES projets(id),
    titre_foncier_id INTEGER REFERENCES titres_fonciers(id),
    statut VARCHAR(50) DEFAULT 'En cours',
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tasks
CREATE TABLE taches (
    id SERIAL PRIMARY KEY,
    workflow_id INTEGER REFERENCES workflows(id),
    etape_id INTEGER REFERENCES etapes(id),
    utilisateur_id INTEGER REFERENCES utilisateurs(id),
    statut VARCHAR(50) DEFAULT 'En attente',
    commentaire TEXT,
    piece_jointe VARCHAR(255),
    date_execution TIMESTAMP
);

-- Audit logs
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    utilisateur_id INTEGER REFERENCES utilisateurs(id),
    action VARCHAR(100) NOT NULL,
    projet_id INTEGER REFERENCES projets(id),
    details JSONB,
    date_action TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Exemple de code Fastify.js
```javascript
const fastify = require('fastify')({ logger: true });
const { Pool } = require('pg');
const fastifyJwt = require('@fastify/jwt');
const fastifyMultipart = require('@fastify/multipart');
const { hash } = require('bcrypt'); // For password hashing

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'geospatial_db',
  password: 'password',
  port: 5432,
});

fastify.register(fastifyJwt, { secret: 'secret_key' });
fastify.register(fastifyMultipart);

// Middleware for authentication
fastify.decorate('authenticate', async (request, reply) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.code(401).send({ error: 'Non autorisé' });
  }
});

// Middleware for administrators
fastify.decorate('restrictToAdmin', async (request, reply) => {
  if (request.user.niveau_hierarchique !== 4) {
    reply.code(403).send({ error: 'Réservé aux administrateurs' });
  }
});

// Middleware for first assigned user
fastify.decorate('restrictToFirstUser', async (request, reply) => {
  const { projet_id } = request.body;
  const query = `
    SELECT utilisateur_id 
    FROM taches t 
    JOIN etapes e ON t.etape_id = e.id 
    WHERE e.projet_id = $1 AND e.ordre = 1
  `;
  const result = await pool.query(query, [projet_id]);
  if (!result.rows.length || result.rows[0].utilisateur_id !== request.user.utilisateur_id) {
    reply.code(403).send({ error: 'Seul le premier utilisateur assigné peut extraire' });
  }
});

// Create a user with automatic niveau_hierarchique
fastify.post('/api/utilisateurs', {
  preHandler: [fastify.authenticate, fastify.restrictToAdmin],
}, async (request, reply) => {
  const { nom, prenom, email, mot_de_passe, localite, est_superviseur } = request.body;
  if (!['administration_centrale', 'departement', 'arrondissement'].includes(localite.type)) {
    reply.code(400).send({ error: 'Type de localité invalide' });
    return;
  }
  if (['departement', 'arrondissement'].includes(localite.type) && !localite.valeur) {
    reply.code(400).send({ error: 'Valeur de localité requise' });
    return;
  }
  const niveau_hierarchique = localite.type === 'arrondissement' ? 1 :
                             localite.type === 'departement' ? 2 :
                             est_superviseur ? 4 : 3;
  const hashedPassword = await hash(mot_de_passe, 10);
  const query = `
    INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, niveau_hierarchique, localite)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, nom, prenom, email, niveau_hierarchique, localite;
  `;
  try {
    const result = await pool.query(query, [nom, prenom, email, hashedPassword, niveau_hierarchique, localite]);
    await pool.query('INSERT INTO audit_logs (utilisateur_id, action, projet_id, details) VALUES ($1, $2, $3, $4)', [
      request.user.utilisateur_id,
      'create_user',
      null,
      JSON.stringify({ nom, prenom, email, niveau_hierarchique, localite }),
    ]);
    reply.send(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      reply.code(400).send({ error: 'Email déjà utilisé' });
    } else {
      reply.code(500).send({ error: 'Erreur serveur' });
    }
  }
});

// Autocomplete localities
fastify.get('/api/localites/autocomplete', {
  preHandler: [fastify.authenticate, fastify.restrictToAdmin],
}, async (request, reply) => {
  const { type, terme } = request.query;
  if (!['departement', 'arrondissement'].includes(type)) {
    reply.code(400).send({ error: 'Type de localité invalide' });
    return;
  }
  const query = `
    SELECT valeur
    FROM localites
    WHERE type = $1 AND valeur ILIKE $2
    ORDER BY valeur
    LIMIT 10;
  `;
  const result = await pool.query(query, [type, `%${terme}%`]);
  reply.send(result.rows.map(row => row.valeur));
});

// List land titles
fastify.get('/api/titres_fonciers', {
  preHandler: [fastify.authenticate],
}, async (request, reply) => {
  const { niveau_hierarchique, localite } = request.user;
  const { search } = request.query;
  let query = `
    SELECT id, proprietaire, localite
    FROM titres_fonciers
    WHERE (
      $1 >= 3 OR
      ($1 = 2 AND localite->>'type' IN ('departement', 'arrondissement') AND localite->>'valeur' = $2->>'valeur') OR
      ($1 = 1 AND localite->>'type' = 'arrondissement' AND localite->>'valeur' = $2->>'valeur')
    )
  `;
  const params = [niveau_hierarchique, localite];
  if (search) {
    query += ` AND (proprietaire ILIKE $3 OR localite->>'valeur' ILIKE $3)`;
    params.push(`%${search}%`);
  }
  const result = await pool.query(query, params);
  reply.send(result.rows);
});

// Retrieve land title details
fastify.get('/api/titres_fonciers/:id', {
  preHandler: [fastify.authenticate],
}, async (request, reply) => {
  const { id } = request.params;
  const { niveau_hierarchique, localite } = request.user;
  const query = `
    SELECT id, proprietaire, coordonnees_gps, surface_m2, perimetre_m, localite, projet_id
    FROM titres_fonciers
    WHERE id = $1 AND (
      $2 >= 3 OR
      ($2 = 2 AND localite->>'type' IN ('departement', 'arrondissement') AND localite->>'valeur' = $3->>'valeur') OR
      ($2 = 1 AND localite->>'type' = 'arrondissement' AND localite->>'valeur' = $3->>'valeur')
    )
  `;
  const result = await pool.query(query, [id, niveau_hierarchique, localite]);
  if (result.rows.length === 0) {
    reply.code(403).send({ error: 'Accès non autorisé au titre foncier' });
    return;
  }
  reply.send(result.rows[0]);
});

// Update land title
fastify.put('/api/titres_fonciers/:id', {
  preHandler: [fastify.authenticate],
}, async (request, reply) => {
  const { id } = request.params;
  const { proprietaire, coordonnees_gps, surface_m2, perimetre_m } = request.body;
  const { niveau_hierarchique, localite } = request.user;
  // Validate coordinates with PostGIS (simplified for example)
  const query = `
    UPDATE titres_fonciers
    SET proprietaire = $1, coordonnees_gps = $2, surface_m2 = $3, perimetre_m = $4
    WHERE id = $5 AND (
      $6 >= 3 OR
      ($6 = 2 AND localite->>'type' IN ('departement', 'arrondissement') AND localite->>'valeur' = $7->>'valeur') OR
      ($6 = 1 AND localite->>'type' = 'arrondissement' AND localite->>'valeur' = $7->>'valeur')
    )
    RETURNING *;
  `;
  const result = await pool.query(query, [proprietaire, coordonnees_gps, surface_m2, perimetre_m, id, niveau_hierarchique, localite]);
  if (result.rows.length === 0) {
    reply.code(403).send({ error: 'Accès non autorisé au titre foncier' });
    return;
  }
  await pool.query('INSERT INTO audit_logs (utilisateur_id, action, projet_id, details) VALUES ($1, $2, $3, $4)', [
    request.user.utilisateur_id,
    'update_titre_foncier',
    result.rows[0].projet_id,
    JSON.stringify({ id, proprietaire, coordonnees_gps, surface_m2, perimetre_m }),
  ]);
  reply.send(result.rows[0]);
});

// Upload and extract
fastify.post('/api/extraction/upload', {
  preHandler: [fastify.authenticate, fastify.restrictToFirstUser],
}, async (request, reply) => {
  const data = await request.file();
  const { projet_id, localite } = request.body;
  // Validate localite matches user’s localite for levels 1–2
  if (request.user.niveau_hierarchique < 3 && JSON.stringify(request.user.localite) !== JSON.stringify(localite)) {
    reply.code(403).send({ error: 'Localité non autorisée' });
    return;
  }
  // Simulate extraction with Tesseract and fuzzywuzzy
  const extractedData = {
    proprietaire: 'Jean Dupont',
    coordonnees_gps: [[48.8566, 2.3522], [48.8570, 2.3530], [48.8574, 2.3525], [48.8570, 2.3518]],
    surface_m2: 1250.5,
    perimetre_m: 145.8,
    localite: localite,
  };
  // Validate polygon with PostGIS (simplified)
  const titreQuery = `
    INSERT INTO titres_fonciers (projet_id, proprietaire, coordonnees_gps, surface_m2, perimetre_m, localite)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;
  const titreResult = await pool.query(titreQuery, [
    projet_id,
    extractedData.proprietaire,
    extractedData.coordonnees_gps,
    extractedData.surface_m2,
    extractedData.perimetre_m,
    extractedData.localite,
  ]);
  const extractionQuery = `
    INSERT INTO extractions (projet_id, utilisateur_id, fichier, donnees_extraites, seuil_confiance, titre_foncier_id)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;
  const extractionResult = await pool.query(extractionQuery, [
    projet_id,
    request.user.utilisateur_id,
    data.filename,
    extractedData,
    90,
    titreResult.rows[0].id,
  ]);
  const workflowQuery = `
    INSERT INTO workflows (projet_id, titre_foncier_id)
    VALUES ($1, $2)
    RETURNING id;
  `;
  const workflowResult = await pool.query(workflowQuery, [projet_id, titreResult.rows[0].id]);
  const taskQuery = `
    INSERT INTO taches (workflow_id, etape_id, utilisateur_id)
    SELECT $1, id, $2
    FROM etapes
    WHERE projet_id = $3 AND ordre = 1
    RETURNING *;
  `;
  await pool.query(taskQuery, [workflowResult.rows[0].id, request.user.utilisateur_id, projet_id]);
  await pool.query('INSERT INTO audit_logs (utilisateur_id, action, projet_id, details) VALUES ($1, $2, $3, $4)', [
    request.user.utilisateur_id,
    'extract_data',
    projet_id,
    JSON.stringify(extractedData),
  ]);
  reply.send(extractionResult.rows[0]);
});

// Validate task
fastify.put('/api/taches/:id/valider', {
  preHandler: [fastify.authenticate],
}, async (request, reply) => {
  const { id } = request.params;
  const { statut, commentaire, piece_jointe } = request.body;
  if (statut === 'Rejeté' && !commentaire) {
    reply.code(400).send({ error: 'Commentaire obligatoire pour un rejet' });
    return;
  }
  const query = `
    UPDATE taches
    SET statut = $1, commentaire = $2, piece_jointe = $3, date_execution = CURRENT_TIMESTAMP
    WHERE id = $4 AND utilisateur_id = $5
    RETURNING *;
  `;
  const result = await pool.query(query, [statut, commentaire, piece_jointe, id, request.user.utilisateur_id]);
  if (result.rows.length === 0) {
    reply.code(403).send({ error: 'Tâche non autorisée' });
    return;
  }
  await pool.query('INSERT INTO audit_logs (utilisateur_id, action, projet_id, details) VALUES ($1, $2, $3, $4)', [
    request.user.utilisateur_id,
    'validate_task',
    result.rows[0].projet_id,
    JSON.stringify({ tache_id: id, statut, commentaire }),
  ]);
  reply.send(result.rows[0]);
});

// Admin statistics
fastify.get('/api/admin/stats', {
  preHandler: [fastify.authenticate, fastify.restrictToAdmin],
}, async (request, reply) => {
  const statsQuery = `
    SELECT
      (SELECT COUNT(*) FROM projets) as projets,
      (SELECT COUNT(*) FROM extractions) as extractions,
      (SELECT COUNT(*) FROM taches WHERE statut = 'En attente') as taches,
      (SELECT json_agg(json_build_object('localite', localite->>'valeur', 'count', count)) 
       FROM (SELECT localite->>'valeur' as localite, COUNT(*) as count 
             FROM utilisateurs GROUP BY localite->>'valeur') as counts) as utilisateurs_par_localite
  `;
  const result = await pool.query(statsQuery);
  reply.send(result.rows[0]);
});

fastify.listen({ port: 3000 }, (err) => {
  if (err) throw err;
  console.log('Serveur Fastify démarré sur le port 3000');
});
```

## Livrable attendu
- **Frontend**: A set of React interfaces integrated with a Fastify.js API, covering:
  - A land title folder list (proprietaire, localite) and details page with editable fields and real-time Leaflet map updates.
  - A setup wizard for administrators to configure projects, stages, roles, permissions, and users, with automatic `niveau_hierarchique` assignment based on `localite` and autocomplete for Cameroon localities.
  - An admin dashboard for global oversight with locality-based statistics.
  - An extraction dashboard for the first assigned user.
  - Integration with BPM validations and audit history.
- **Backend**: A Fastify.js backend with PostgreSQL, providing:
  - Configuration endpoints for administrators, with automatic `niveau_hierarchique` assignment based on `localite`.
  - Land title endpoints for folder lists and details, filtered by `niveau_hierarchique` and `localite`.
  - Extraction endpoints restricted to the first assigned user, with BPM integration.
  - Workflow endpoints for validation tasks.
  - Audit endpoints for action history and PDF export.
Both must be secure (JWT, RBAC), performant, scalable, and aligned with decentralized land management, ensuring `niveau_hierarchique` is set according to `localite` during user creation.

## Note sur les futures modifications
Please provide details of any future frontend or backend modifications, and I will update both prompts in a single response, ensuring alignment and incorporating all changes.