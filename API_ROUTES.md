# Documentation des routes API

## Authentification

- **POST /api/login**
  - Connexion utilisateur, retourne un token JWT.

---

## Utilisateurs

- **POST /api/utilisateurs** _(admin)_
  - Créer un utilisateur
- **PUT /api/utilisateurs/:id** _(admin)_
  - Modifier un utilisateur
- **DELETE /api/utilisateurs/:id** _(admin)_
  - Supprimer un utilisateur
- **GET /api/utilisateurs/:id** _(authentifié)_
  - Récupérer un utilisateur
- **GET /api/utilisateurs** _(authentifié)_
  - Liste des utilisateurs

---

## Audit

- **GET /api/audit** _(authentifié)_
  - Récupérer les logs d’audit
- **POST /api/audit/export** _(admin)_
  - Exporter les logs d’audit

---

## Étapes workflow

- **POST /api/etapes** _(admin)_
  - Créer une étape
- **PUT /api/etapes/:id** _(admin)_
  - Modifier une étape
- **DELETE /api/etapes/:id** _(admin)_
  - Supprimer une étape
- **GET /api/etapes/projet/:projet_id** _(authentifié)_
  - Liste des étapes d’un projet

---

## Extraction

- **POST /api/extraction/upload** _(premier utilisateur)_
  - Upload d’une extraction
- **PUT /api/extraction/:id** _(authentifié)_
  - Correction d’une extraction
- **POST /api/extraction/submit** _(authentifié)_
  - Soumettre à l’étape suivante

---

## Proxy Flask

- **POST /api/extraction/update_external** _(authentifié)_
  - Mise à jour via le service Flask

---

## Localités

- **GET /api/localites/departements**
  - Liste des départements
- **GET /api/localites/arrondissements**
  - Liste des arrondissements
- **GET /api/localites/autocomplete?type=...&terme=...**
  - Autocomplétion sur les localités

---

## Projets

- **POST /api/projets** _(admin)_
  - Créer un projet
- **PUT /api/projets/:id** _(admin)_
  - Modifier un projet
- **DELETE /api/projets/:id** _(admin)_
  - Supprimer un projet
- **GET /api/projets** _(authentifié)_
  - Liste des projets

---

## Rôles

- **POST /api/roles** _(admin)_
  - Créer un rôle
- **PUT /api/roles/:id** _(admin)_
  - Modifier un rôle
- **DELETE /api/roles/:id** _(admin)_
  - Supprimer un rôle
- **GET /api/roles** _(authentifié)_
  - Liste des rôles

---

## Titres fonciers

- **GET /titres-foncier** _(authentifié)_
  - Liste des titres fonciers
- **GET /titres-foncier/:id** _(authentifié)_
  - Détail d’un titre foncier
- **PUT /titres-foncier/:id** _(admin)_
  - Modifier un titre foncier

---

## Workflows

- **POST /api/workflows** _(admin)_
  - Créer un workflow
- **POST /api/workflows/submit** _(authentifié)_
  - Soumettre à l’étape suivante
- **PUT /api/taches/:id/valider** _(authentifié)_
  - Valider une tâche

---

> Toutes les routes protégées nécessitent le token JWT dans l’en-tête `Authorization: Bearer <token>`.
