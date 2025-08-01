-- Migration pour créer la hiérarchie géographique
-- Cette migration modifie la table localites pour supporter la hiérarchie géographique

-- 1. Créer une nouvelle table pour les régions
CREATE TABLE IF NOT EXISTS regions (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(10),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Créer une nouvelle table pour les départements
CREATE TABLE IF NOT EXISTS departements (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    code VARCHAR(10),
    region_id INTEGER REFERENCES regions(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(nom, region_id)
);

-- 3. Créer une nouvelle table pour les arrondissements
CREATE TABLE IF NOT EXISTS arrondissements (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    code VARCHAR(10),
    departement_id INTEGER REFERENCES departements(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(nom, departement_id)
);

-- 4. Ajouter des colonnes à la table localites pour la hiérarchie
ALTER TABLE localites 
ADD COLUMN IF NOT EXISTS region_id INTEGER REFERENCES regions(id),
ADD COLUMN IF NOT EXISTS departement_id INTEGER REFERENCES departements(id),
ADD COLUMN IF NOT EXISTS arrondissement_id INTEGER REFERENCES arrondissements(id);

-- 5. Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_localites_region ON localites(region_id);
CREATE INDEX IF NOT EXISTS idx_localites_departement ON localites(departement_id);
CREATE INDEX IF NOT EXISTS idx_localites_arrondissement ON localites(arrondissement_id);
CREATE INDEX IF NOT EXISTS idx_departements_region ON departements(region_id);
CREATE INDEX IF NOT EXISTS idx_arrondissements_departement ON arrondissements(departement_id);
