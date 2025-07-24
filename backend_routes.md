# Documentation des routes backend pour GeoBpm

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
- **Réponse** :

```json
[
  {
    "id": "user_okene",
    "nom": "OKENE AHANDA MAMA PIE HERV",
    "prenom": "",
    "email": "okene.ahanda@example.com",
    "niveau_hierarchique": 1
  },
  {
    "id": "user_validator",
    "nom": "NDJOMO",
    "prenom": "Paul",
    "email": "paul.ndjomo@example.com",
    "niveau_hierarchique": 2
  },
  {
    "id": "user_admin",
    "nom": "MBOUA",
    "prenom": "Sylvie",
    "email": "sylvie.mboua@example.com",
    "niveau_hierarchique": 4
  }
]
```

### POST /api/utilisateurs

- **Description** : Crée un nouvel utilisateur (admin seulement).
- **Body** :

```json
{
  "nom": "Jean Dupont",
  "email": "jean.dupont@example.com",
  "mot_de_passe": "motdepasse",
  "niveau_hierarchique": 4
}
```

- **Réponse** :

```json
{
  "id": "1",
  "nom": "Jean Dupont",
  "email": "jean.dupont@example.com",
  "niveau_hierarchique": 4
}
```

### GET /api/utilisateurs/:id

- **Description** : Détail d'un utilisateur.
- **Réponse** :

```json
{
  "id": "1",
  "nom": "Jean Dupont",
  "email": "jean.dupont@example.com",
  "niveau_hierarchique": 4
}
```

### PUT /api/utilisateurs/:id

- **Description** : Modifie un utilisateur.
- **Body** :

```json
{
  "nom": "Jean Dupont",
  "email": "jean.dupont@example.com",
  "niveau_hierarchique": 3
}
```

- **Réponse** :

```json
{
  "id": "1",
  "nom": "Jean Dupont",
  "email": "jean.dupont@example.com",
  "niveau_hierarchique": 3
}
```

### DELETE /api/utilisateurs/:id

- **Description** : Supprime un utilisateur.
- **Réponse** :

```json
{ "success": true }
```

---

## Projets

### GET /api/projets

- **Description** : Liste tous les projets.
- **Réponse** :

```json
[
  {
    "id": "projet_soa_2025",
    "nom": "Cadastre Soa 2025",
    "description": "Numérisation et validation des titres fonciers de Soa et environs (Mefou et Afamba)"
  }
]
```

### POST /api/projets

- **Description** : Crée un projet.
- **Body** :

```json
{
  "nom": "Projet A",
  "description": "Description du projet A"
}
```

- **Réponse** :

```json
{
  "id": "1",
  "nom": "Projet A",
  "description": "Description du projet A"
}
```

### GET /api/projets/:id

- **Description** : Détail d'un projet.
- **Réponse** :

```json
{
  "id": "1",
  "nom": "Projet A",
  "description": "Description du projet A"
}
```

### PUT /api/projets/:id

- **Description** : Modifie un projet.
- **Body** :

```json
{
  "nom": "Projet A modifié",
  "description": "Nouvelle description"
}
```

- **Réponse** :

```json
{
  "id": "1",
  "nom": "Projet A modifié",
  "description": "Nouvelle description"
}
```

### DELETE /api/projets/:id

- **Description** : Supprime un projet.
- **Réponse** :

```json
{ "success": true }
```

---

## Extractions

### GET /api/extractions

- **Description** : Liste toutes les extractions (filtrable par projet, statut, utilisateur).
- **Query** : `?projet_id=...&statut=...`
- **Réponse** :

```json
[
  {
    "id": "1",
    "projet_id": "1",
    "fichier": "scan1.pdf",
    "donnees_extraites": {
      "proprietaire": "Jean Dupont",
      "superficie": 1000,
      "perimetre": 400,
      "coordonnees_gps": [[7.1,12.3],[7.2,12.4]],
      "centroide": [7.15,12.35]
    },
    "statut": "extrait",
    "seuil_confiance": 98.5,
    "date_extraction": "2025-07-24T10:00:00Z",
    "workflow_initiated": true
  },
  ...
]
```

### POST /api/extraction/upload

- **Description** : Upload de fichiers pour extraction automatique.
- **Body** : Fichiers + `projet_id`
- **Réponse** (exemple détaillé) :

```json
{
  "filename": "20250723_200750_pdfscanner.jpg",
  "results": {
    "Coordonnees": [
      [788691.711, 441647.318],
      [788708.993, 441639.375],
      [788701.81, 441623.747],
      [788687.254, 441630.437],
      [788685.781, 441634.416]
    ],
    "area_value": 323.0,
    "arrondissement_name": "Soa",
    "database_saved": true,
    "department_name": "Mefou et Afamba",
    "owner_name": "OKENE AHANDA MAMA PIE HERV",
    "partial_only": false,
    "polygon": {
      "area": 2.6240213701101162e-8,
      "bounds": [
        11.599722156106091, 3.991316788467999, 11.599931184680232,
        3.9915300998418504
      ],
      "centroid": [11.599822364065165, 3.991423862116124],
      "geometry": {
        "coordinates": [
          [
            [11.599775887849335, 3.9915300998418504],
            [11.599931184680232, 3.991457821318175],
            [11.599866099504329, 3.991316788467999],
            [11.599735298636295, 3.9913776651149115],
            [11.599722156106091, 3.991413667401851],
            [11.599775887849335, 3.9915300998418504]
          ]
        ],
        "type": "Polygon"
      },
      "perimeter": 0.0006374518023342832,
      "type": "polygon"
    },
    "processing_status": "complete",
    "status": "success",
    "successful_rectangles": [3]
  },
  "success": true
}
```

### GET /api/extractions/:id

- **Description** : Détail d'une extraction.
- **Réponse** :

```json
{
  "id": "1",
  "projet_id": "1",
  "fichier": "scan1.pdf",
  "donnees_extraites": { ... },
  "statut": "extrait",
  "seuil_confiance": 98.5,
  "date_extraction": "2025-07-24T10:00:00Z",
  "workflow_initiated": true
}
```

### PUT /api/extractions/:id

- **Description** : Correction ou modification d'une extraction.
- **Body** :

```json
{
  "donnees_extraites": {
    "proprietaire": "Jean Dupont",
    "superficie": 1200,
    "perimetre": 420,
    "coordonnees_gps": [
      [7.1, 12.3],
      [7.2, 12.4]
    ],
    "centroide": [7.15, 12.35]
  },
  "statut": "corrige"
}
```

- **Réponse** :

```json
{
  "id": "1",
  "projet_id": "1",
  "fichier": "scan1.pdf",
  "donnees_extraites": { ... },
  "statut": "corrige",
  "seuil_confiance": 98.5,
  "date_extraction": "2025-07-24T10:00:00Z",
  "workflow_initiated": true
}
```

### DELETE /api/extractions/:id

- **Description** : Supprime une extraction.
- **Réponse** :

```json
{ "success": true }
```

---

## Titres fonciers

### GET /api/titres

- **Description** : Liste tous les titres fonciers.
- **Réponse** :

```json
[
  {
    "id": "titre_okene_soa",
    "proprietaire": "OKENE AHANDA MAMA PIE HERV",
    "superficie": 323,
    "perimetre": 0.0006374518023342832,
    "coordonnees_gps": [
      [11.599775887849335, 3.9915300998418504],
      [11.599931184680232, 3.991457821318175],
      [11.599866099504329, 3.991316788467999],
      [11.599735298636295, 3.9913776651149115],
      [11.599722156106091, 3.991413667401851],
      [11.599775887849335, 3.9915300998418504]
    ],
    "localite": "Soa"
  },
  {
    "id": "titre_ndjomo_nkolafamba",
    "proprietaire": "NDJOMO Paul",
    "superficie": 250,
    "perimetre": 80,
    "coordonnees_gps": [
      [11.6001, 3.992],
      [11.6002, 3.9921],
      [11.6003, 3.992],
      [11.6001, 3.992]
    ],
    "localite": "Nkolafamba"
  }
]
```

### GET /api/titres/:id

- **Description** : Détail d'un titre foncier.
- **Réponse** :

```json
{
  "id": "titre_okene_soa",
  "proprietaire": "OKENE AHANDA MAMA PIE HERV",
  "superficie": 323,
  "perimetre": 0.0006374518023342832,
  "coordonnees_gps": [
    [11.599775887849335, 3.9915300998418504],
    [11.599931184680232, 3.991457821318175],
    [11.599866099504329, 3.991316788467999],
    [11.599735298636295, 3.9913776651149115],
    [11.599722156106091, 3.991413667401851],
    [11.599775887849335, 3.9915300998418504]
  ],
  "localite": "Soa"
}
```

### POST /api/titres

- **Description** : Ajoute un titre foncier.
- **Body** :

```json
{
  "proprietaire": "OKENE AHANDA MAMA PIE HERV",
  "superficie": 323,
  "perimetre": 0.0006374518023342832,
  "coordonnees_gps": [
    [11.599775887849335, 3.9915300998418504],
    [11.599931184680232, 3.991457821318175],
    [11.599866099504329, 3.991316788467999],
    [11.599735298636295, 3.9913776651149115],
    [11.599722156106091, 3.991413667401851],
    [11.599775887849335, 3.9915300998418504]
  ],
  "localite": "Soa"
}
```

- **Réponse** :

```json
{
  "id": "titre_okene_soa",
  "proprietaire": "OKENE AHANDA MAMA PIE HERV",
  "superficie": 323,
  "perimetre": 0.0006374518023342832,
  "coordonnees_gps": [
    [11.599775887849335, 3.9915300998418504],
    [11.599931184680232, 3.991457821318175],
    [11.599866099504329, 3.991316788467999],
    [11.599735298636295, 3.9913776651149115],
    [11.599722156106091, 3.991413667401851],
    [11.599775887849335, 3.9915300998418504]
  ],
  "localite": "Soa"
}
```

### PUT /api/titres/:id

- **Description** : Modifie un titre foncier.
- **Body** :

```json
{
  "proprietaire": "NDJOMO Paul",
  "superficie": 250,
  "perimetre": 80,
  "coordonnees_gps": [
    [11.6001, 3.992],
    [11.6002, 3.9921],
    [11.6003, 3.992],
    [11.6001, 3.992]
  ],
  "localite": "Nkolafamba"
}
```

- **Réponse** :

```json
{
  "id": "titre_ndjomo_nkolafamba",
  "proprietaire": "NDJOMO Paul",
  "superficie": 250,
  "perimetre": 80,
  "coordonnees_gps": [
    [11.6001, 3.992],
    [11.6002, 3.9921],
    [11.6003, 3.992],
    [11.6001, 3.992]
  ],
  "localite": "Nkolafamba"
}
```

### DELETE /api/titres/:id

- **Description** : Supprime un titre foncier.
- **Réponse** :

```json
{ "success": true }
```

---

## Workflows BPM

### GET /api/workflows

- **Description** : Liste tous les workflows.
- **Réponse** :

```json
[
  {
    "id": "workflow_1",
    "titre_foncier_id": "titre_okene_soa",
    "projet_id": "projet_soa_2025",
    "etapes": [
      {
        "id": "etape_1",
        "ordre": 1,
        "nom": "Extraction des données",
        "description": "Extraction automatique des informations depuis les documents scannés",
        "type": "semi_automatique",
        "statut": "valide"
      },
      {
        "id": "etape_2",
        "ordre": 2,
        "nom": "Validation géométrique",
        "description": "Vérification et correction des coordonnées GPS",
        "type": "manuelle",
        "statut": "en attente"
      },
      {
        "id": "etape_3",
        "ordre": 3,
        "nom": "Approbation finale",
        "description": "Validation finale par l'administrateur du cadastre",
        "type": "manuelle",
        "statut": "en attente"
      }
    ],
    "statut": "en cours",
    "historique": [
      {
        "date": "2025-07-23T20:07:50Z",
        "action": "création",
        "user_id": "user_okene"
      }
    ]
  }
]
```

### POST /api/workflows

- **Description** : Démarre un workflow pour une extraction.
- **Body** :

```json
{
  "titre_foncier_id": "titre_okene_soa",
  "projet_id": "projet_soa_2025"
}
```

- **Réponse** :

```json
{
  "id": "workflow_1",
  "titre_foncier_id": "titre_okene_soa",
  "projet_id": "projet_soa_2025",
  "etapes": [
    {
      "id": "etape_1",
      "ordre": 1,
      "nom": "Extraction des données",
      "description": "Extraction automatique des informations depuis les documents scannés",
      "type": "semi_automatique",
      "statut": "valide"
    },
    {
      "id": "etape_2",
      "ordre": 2,
      "nom": "Validation géométrique",
      "description": "Vérification et correction des coordonnées GPS",
      "type": "manuelle",
      "statut": "en attente"
    },
    {
      "id": "etape_3",
      "ordre": 3,
      "nom": "Approbation finale",
      "description": "Validation finale par l'administrateur du cadastre",
      "type": "manuelle",
      "statut": "en attente"
    }
  ],
  "statut": "en cours",
  "historique": [
    {
      "date": "2025-07-23T20:07:50Z",
      "action": "création",
      "user_id": "user_okene"
    }
  ]
}
```

### GET /api/workflows/:id

- **Description** : Détail d'un workflow.
- **Réponse** :

```json
{
  "id": "1",
  "titre_foncier_id": "1",
  "projet_id": "1",
  "etapes": [ ... ],
  "statut": "en cours",
  "historique": [ ... ]
}
```

---

## Validation

### POST /api/extractions/:id/valider

- **Description** : Valide une extraction (niveau 1-3).
- **Body** :

```json
{
  "commentaire": "Tout est correct"
}
```

- **Réponse** :

```json
{
  "success": true,
  "message": "Extraction validée",
  "utilisateur": {
    "id": "user_validator",
    "nom": "NDJOMO",
    "prenom": "Paul",
    "email": "paul.ndjomo@example.com",
    "niveau_hierarchique": 2
  },
  "statut": "valide"
}
```

### POST /api/extractions/:id/rejeter

- **Description** : Rejette une extraction.
- **Body** :

```json
{
  "commentaire": "Erreur détectée"
}
```

- **Réponse** :

```json
{
  "success": true,
  "message": "Extraction rejetée",
  "utilisateur": {
    "id": "user_validator",
    "nom": "NDJOMO",
    "prenom": "Paul",
    "email": "paul.ndjomo@example.com",
    "niveau_hierarchique": 2
  },
  "statut": "rejete"
}
```

---

## Logs et activité

### GET /api/logs

- **Description** : Liste des logs d'activité (admin).
- **Réponse** :

```json
[
  {
    "id": "1",
    "action": "login",
    "user_id": "1",
    "date": "2025-07-24T10:00:00Z"
  },
  ...
]
```

---

## Géospatiale

### GET /api/titres/geojson

- **Description** : Retourne tous les titres fonciers au format GeoJSON pour affichage sur carte.
- **Réponse** :

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
        "id": "titre_okene_soa",
        "proprietaire": "OKENE AHANDA MAMA PIE HERV"
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
        "id": "titre_ndjomo_nkolafamba",
        "proprietaire": "NDJOMO Paul"
      }
    }
  ]
}
```

---

## Sécurité & rôles

- Toutes les routes sensibles nécessitent un token JWT et vérification du rôle/niveau_hierarchique.
- Les routes d'administration sont réservées au niveau 4 (admin).
- Les routes d'extraction, de correction et de workflow sont réservées aux niveaux 1 à 3 (validation).
- La validation/rejet d'une extraction doit vérifier le niveau de l'utilisateur :
  - Niveau 1 : peut valider/rejeter les extractions initiales.
  - Niveau 2 : peut valider/rejeter après correction.
  - Niveau 3 : peut valider/rejeter en dernier niveau.
- Les routes doivent retourner une erreur 403 si le niveau n'est pas suffisant : `{ error: 'Accès interdit' }`
- Les uploads doivent être sécurisés (type, taille, scan antivirus si possible).

---

## Notes

- Les routes sont à adapter selon le framework backend (Express, Fastify, NestJS, etc.).
- Les réponses d'erreur doivent être standardisées (`{ error: '...' }`).
- Les uploads doivent être sécurisés (vérification du type et taille de fichier, scan antivirus recommandé).
- Pour toute route, bien vérifier le niveau d'accès avant traitement.
- Pour la validation multi-niveaux, stocker l'historique des validations/rejets dans le workflow.

---

Pour toute question sur l’implémentation, demande une route ou un exemple précis !
