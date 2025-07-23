# Documentation des routes backend pour Bpm

Ce document décrit les principales routes API REST à implémenter pour le backend du projet GeoBpm, avec explications et exemples.

---

## Authentification

### POST /api/login

- **Description** : Authentifie un utilisateur et retourne un token JWT.
- **Body** : `{ email, mot_de_passe }`
- **Réponse** : `{ token, user }`

### GET /api/me

- **Description** : Retourne les informations de l'utilisateur connecté (via le token).
- **Header** : `Authorization: Bearer <token>`
- **Réponse** : `{ user }`

---

## Utilisateurs

### GET /api/utilisateurs

- **Description** : Liste tous les utilisateurs (admin seulement).
- **Réponse** : `[{ ...user }]`

### POST /api/utilisateurs

- **Description** : Crée un nouvel utilisateur (admin seulement).
- **Body** : `{ nom, email, mot_de_passe, niveau_hierarchique }`

### GET /api/utilisateurs/:id

- **Description** : Détail d'un utilisateur.

### PUT /api/utilisateurs/:id

- **Description** : Modifie un utilisateur.

### DELETE /api/utilisateurs/:id

- **Description** : Supprime un utilisateur.

---

## Projets

### GET /api/projets

- **Description** : Liste tous les projets.
- **Réponse** : `[{ ...projet }]`

### POST /api/projets

- **Description** : Crée un projet.
- **Body** : `{ nom, description }`

### GET /api/projets/:id

- **Description** : Détail d'un projet.

### PUT /api/projets/:id

- **Description** : Modifie un projet.

### DELETE /api/projets/:id

- **Description** : Supprime un projet.

---

## Extractions

### GET /api/extractions

- **Description** : Liste toutes les extractions (filtrable par projet, statut, utilisateur).
- **Query** : `?projet_id=...&statut=...`

### POST /api/extraction/upload

- **Description** : Upload de fichiers pour extraction automatique.
- **Body** : Fichiers + `projet_id`
- **Réponse** : Liste des extractions créées.

### GET /api/extractions/:id

- **Description** : Détail d'une extraction.

### PUT /api/extractions/:id

- **Description** : Correction ou modification d'une extraction.
- **Body** : `{ donnees_extraites, statut }`

### DELETE /api/extractions/:id

- **Description** : Supprime une extraction.

---

## Titres fonciers

### GET /api/titres

- **Description** : Liste tous les titres fonciers.

### GET /api/titres/:id

- **Description** : Détail d'un titre foncier.

### POST /api/titres

- **Description** : Ajoute un titre foncier.

### PUT /api/titres/:id

- **Description** : Modifie un titre foncier.

### DELETE /api/titres/:id

- **Description** : Supprime un titre foncier.

---

## Workflows BPM

### GET /api/workflows

- **Description** : Liste tous les workflows.

### POST /api/workflows

- **Description** : Démarre un workflow pour une extraction.
- **Body** : `{ titre_foncier_id, projet_id }`

### GET /api/workflows/:id

- **Description** : Détail d'un workflow.

---

## Validation

### POST /api/extractions/:id/valider

- **Description** : Valide une extraction (niveau 1-3).
- **Body** : `{ commentaire }`

### POST /api/extractions/:id/rejeter

- **Description** : Rejette une extraction.
- **Body** : `{ commentaire }`

---

## Logs et activité

### GET /api/logs

- **Description** : Liste des logs d'activité (admin).

---

## Géospatiale

### GET /api/titres/geojson

- **Description** : Retourne tous les titres fonciers au format GeoJSON pour affichage sur carte.

---

## Sécurité & rôles

- Toutes les routes sensibles nécessitent un token JWT et vérification du rôle/niveau_hierarchique.
- Les routes d'administration sont réservées au niveau 4 (admin).

---

## Notes

- Les routes sont à adapter selon le framework backend (Express, Fastify, NestJS, etc.).
- Les réponses d'erreur doivent être standardisées (`{ error: '...' }`).
- Les uploads doivent être sécurisés (vérification du type et taille de fichier).

---

Pour toute question sur l’implémentation, demande une route ou un exemple précis !
