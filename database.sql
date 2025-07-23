-- Fichier de création de la base PostgreSQL pour le projet GeoBpm
-- À adapter selon vos besoins spécifiques

-- Création de la base
CREATE DATABASE geobpm;

-- Connexion à la base
\c geobpm;

CREATE TABLE utilisateurs (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    mot_de_passe VARCHAR(255) NOT NULL,
    niveau_hierarchique INT NOT NULL,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Table des localités
CREATE TABLE localites (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL CHECK (type IN ('administration_centrale', 'departement', 'arrondissement')),
    valeur VARCHAR(255) NOT NULL,
    UNIQUE (type, valeur)
);

-- Table des projets
CREATE TABLE projets (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(150) NOT NULL,
    description TEXT,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des extractions
CREATE TABLE extractions (
    id SERIAL PRIMARY KEY,
    projet_id INT REFERENCES projets(id) ON DELETE CASCADE,
    utilisateur_id INT REFERENCES utilisateurs(id) ON DELETE SET NULL,
    fichier VARCHAR(255) NOT NULL,
    donnees_extraites JSONB,
    seuil_confiance NUMERIC(5,2),
    statut VARCHAR(20) CHECK (statut IN ('extrait', 'corrige', 'valide', 'rejete')),
    date_extraction TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    workflow_initiated BOOLEAN DEFAULT FALSE
);

-- Table des workflows
CREATE TABLE workflows (
    id SERIAL PRIMARY KEY,
    titre_foncier_id INT REFERENCES extractions(id) ON DELETE CASCADE,
    projet_id INT REFERENCES projets(id) ON DELETE CASCADE,
    etape_nom VARCHAR(100),
    ordre INT,
    utilisateur_id INT REFERENCES utilisateurs(id) ON DELETE SET NULL,
    date_debut TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_fin TIMESTAMP
);

-- Table des titres fonciers
CREATE TABLE titres_fonciers (
    id SERIAL PRIMARY KEY,
    projet_id INT REFERENCES projets(id) ON DELETE CASCADE,
    proprietaire VARCHAR(150),
    superficie NUMERIC(10,2),
    perimetre NUMERIC(10,2),
    coordonnees_gps JSONB,
    centroide JSONB,
    date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Table de liaison titres_fonciers <-> extractions
CREATE TABLE titres_extractions (
    titre_id INT REFERENCES titres_fonciers(id) ON DELETE CASCADE,
    extraction_id INT REFERENCES extractions(id) ON DELETE CASCADE,
    PRIMARY KEY (titre_id, extraction_id)
);

-- Ajout backend complet
-- Table des rôles utilisateurs
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);
-- Table des permissions
CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    role_id INT REFERENCES roles(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    UNIQUE (role_id, action)
);

-- Table de liaison utilisateurs <-> rôles (plusieurs rôles par utilisateur)
CREATE TABLE utilisateur_roles (
    utilisateur_id INT REFERENCES utilisateurs(id) ON DELETE CASCADE,
    role_id INT REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (utilisateur_id, role_id)
);

-- Table des étapes de workflow
CREATE TABLE etapes_workflow (
    id SERIAL PRIMARY KEY,
    projet_id INT REFERENCES projets(id) ON DELETE CASCADE,
    nom VARCHAR(100) NOT NULL,
    ordre INT NOT NULL,
    description TEXT
);

-- Table de suivi des validations/rejets
CREATE TABLE validations (
    id SERIAL PRIMARY KEY,
    extraction_id INT REFERENCES extractions(id) ON DELETE CASCADE,
    utilisateur_id INT REFERENCES utilisateurs(id) ON DELETE SET NULL,
    statut VARCHAR(20) CHECK (statut IN ('valide', 'rejete')),
    commentaire TEXT,
    date_validation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table de logs d'activité
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    utilisateur_id INT REFERENCES utilisateurs(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    projet_id INT REFERENCES projets(id) ON DELETE CASCADE,
    details JSONB,
    date_action TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index sur email utilisateur
CREATE INDEX idx_utilisateurs_email ON utilisateurs(email);

-- Index sur statut extraction
CREATE INDEX idx_extractions_statut ON extractions(statut);

-- Index sur date_extraction
CREATE INDEX idx_extractions_date ON extractions(date_extraction);

-- Index sur projet_id dans titres_fonciers
CREATE INDEX idx_titres_projet ON titres_fonciers(projet_id);

-- Index pour la recherche géospatiale (si PostGIS installé)
CREATE EXTENSION IF NOT EXISTS postgis;
ALTER TABLE titres_fonciers ADD COLUMN IF NOT EXISTS geom geometry(Polygon, 4326);
CREATE INDEX IF NOT EXISTS idx_titres_geom ON titres_fonciers USING GIST (geom);

-- Exemples d'insertion de rôles
INSERT INTO roles (nom, description) VALUES
  ('admin', 'Administrateur du système'),
  ('validateur', 'Utilisateur validant les extractions'),
  ('extraction', 'Utilisateur effectuant les extractions');

-- Exemples d'insertion de projets
INSERT INTO projets (nom, description) VALUES
  ('Projet Test', 'Projet de démonstration pour GeoBpm');

-- Exemples d'insertion d'utilisateur
INSERT INTO utilisateurs (nom, email, mot_de_passe, niveau_hierarchique)
VALUES ('Admin', 'admin@exemple.com', 'motdepassehash', 4);

-- Ajoutez d'autres exemples ou contraintes selon vos besoins