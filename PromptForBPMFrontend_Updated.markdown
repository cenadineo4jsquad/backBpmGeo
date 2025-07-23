# Prompt pour la conception des interfaces utilisateur frontend du système BPM personnalisé avec intégration d’extraction

## Contexte
Le système BPM personnalisé, intégré au projet d’extraction et de structuration automatique des données géospatiales à partir de titres fonciers numérisés (images), est développé avec **React** pour le frontend, **Fastify.js** pour le backend, et **PostgreSQL** pour la base de données. L’extraction utilise **Tesseract** pour l’OCR et **`fuzzywuzzy`** pour la logique floue avec un seuil de confiance de 85–95%, gérant les imprécisions textuelles sans spéculer sur les coordonnées décimales. Le BPM orchestre la validation semi-automatique des données extraites (coordonnées géographiques, nom du propriétaire, surface, périmètre, localité) via des workflows configurés dynamiquement. Les utilisateurs sont organisés dans une structure hiérarchique décentralisée, où le niveau hiérarchique (`niveau_hierarchique`) correspond à la localité (`localite`):
- `localite.type = "arrondissement"` → `niveau_hierarchique = 1` (local).
- `localite.type = "departement"` → `niveau_hierarchique = 2` (regional).
- `localite.type = "administration_centrale"` → `niveau_hierarchique = 3` (national) ou `4` (superviseur, pour les rôles administratifs spécifiques).
Cette correspondance est assignée automatiquement lors de la création d’un utilisateur par un administrateur (niveau 4). Les interfaces doivent :
- Afficher une liste de titres fonciers sous forme de dossiers (nom du propriétaire, localité) après connexion pour les utilisateurs (niveaux 1–3).
- Permettre, via une page de détails, la modification des données du titre foncier (proprietaire, coordonnees_gps, surface, perimetre, localite) avec une carte interactive (Leaflet) mise à jour en temps réel.
- Fournir un assistant de configuration (setup wizard) pour les administrateurs, incluant la création de projets, étapes, rôles, permissions, et utilisateurs, avec la localité déterminant automatiquement le `niveau_hierarchique`.
- Réserver la configuration aux administrateurs (niveau 4).
- Restreindre l’extraction au premier utilisateur assigné à la première étape du workflow (niveaux 1–3).
- Fournir un tableau de bord administratif global, séparé de l’interface de configuration.
- Supporter la correction manuelle, les commentaires (obligatoires pour les rejets), et les pièces jointes (PDF, JPG, PNG).
- Être sécurisées avec JSON Web Tokens (JWT) et adaptées à une gestion décentralisée des territoires.

## Objectif
Concevoir un ensemble d’interfaces utilisateur React intégrées à une API Fastify.js, couvrant :
- Une liste de titres fonciers sous forme de dossiers et une page de détails avec modifications et carte interactive.
- Un assistant de configuration assignant automatiquement le `niveau_hierarchique` selon la localité.
- Un tableau de bord d’extraction pour le premier utilisateur assigné.
- Un tableau de bord administratif global pour superviser les activités.
- Une intégration avec les workflows BPM pour la validation semi-automatique.
- Une traçabilité complète via un audit.

## Exigences fonctionnelles

### 1. Tableau de bord des titres fonciers
**Objectif**: Afficher une liste de titres fonciers sous forme de dossiers pour les utilisateurs (niveaux 1–3) après connexion.
- **Accès**: Niveaux 1–3, limité aux titres de leur localité et niveau hiérarchique (par exemple, niveau 1 accède aux titres d’arrondissement correspondant).
- **Fonctionnalités**:
  - Afficher une liste paginée de titres fonciers sous forme de dossiers, chaque dossier montrant le nom du propriétaire et la localité.
  - Filtrer par nom du propriétaire ou localité (par exemple, "Yaoundé I").
  - Permettre la sélection d’un dossier pour ouvrir une page de détails.
- **Composants**:
  - **Grille de dossiers**: Cartes ou lignes affichant `proprietaire` et `localite.valeur` (par exemple, "Jean Dupont - Yaoundé I").
  - **Barre de recherche**: Filtrage en temps réel via `GET /api/titres_fonciers?search=terme`.
  - **Pagination**: Boutons pour naviguer entre les pages (10 titres par page).
  - **Message d’erreur**: Afficher "Aucun titre disponible" si la liste est vide.
- **Interactions**:
  - Charger les titres via `GET /api/titres_fonciers`.
  - Filtrer via la barre de recherche (par exemple, "Dupont" ou "Yaoundé").
  - Clic sur un dossier redirige vers `/titres/:id` avec `GET /api/titres_fonciers/:id`.
  - Vérifier l’accès via JWT (403 si non autorisé).
- **Exemple de flux**:
  - Un utilisateur (niveau 1, localite: { type: "arrondissement", valeur: "Yaoundé I" }) voit une grille : [{ id: 1, proprietaire: "Jean Dupont", localite: "Yaoundé I" }, ...].
  - Il tape "Dupont" dans la barre de recherche, réduisant la liste.
  - Il clique sur un dossier, ouvrant la page de détails.

### 2. Page de détails des titres fonciers
**Objectif**: Afficher et permettre la modification des données d’un titre foncier avec une carte interactive mise à jour en temps réel.
- **Accès**: Niveaux 1–3, limité aux titres de leur localité et niveau.
- **Fonctionnalités**:
  - Afficher les détails : proprietaire, coordonnees_gps, surface_m2, perimetre_m, localite.
  - Permettre la modification des champs (par exemple, proprietaire, coordonnees_gps via JSON ou interface graphique).
  - Visualiser le polygone sur une carte Leaflet, avec mise à jour en temps réel des coordonnées modifiées.
  - Enregistrer les modifications avec traçabilité.
- **Composants**:
  - **Formulaire de détails**: Champs éditables pour proprietaire (texte), coordonnees_gps (textarea JSON ou interface de points), surface_m2 (nombre), perimetre_m (nombre), localite (lecture seule).
  - **Carte interactive**: Affiche le polygone, centroïde, et limites de la localité (par exemple, arrondissement).
  - **Bouton de sauvegarde**: Soumet via `PUT /api/titres_fonciers/:id`.
  - **Message d’erreur**: Par exemple, "Coordonnées invalides" si JSON incorrect.
- **Interactions**:
  - Charger les détails via `GET /api/titres_fonciers/:id`.
  - Mettre à jour via `PUT /api/titres_fonciers/:id`.
  - Mettre à jour la carte en temps réel via `useState` et `useEffect` sur coordonnees_gps.
  - Valider les coordonnées (polygone fermé, dans le triangle national).
- **Exemple de flux**:
  - Un utilisateur ouvre le titre ID 1 : { proprietaire: "Jean Dupont", coordonnees_gps: [[48.8566, 2.3522], ...], localite: "Yaoundé I" }.
  - Il modifie une coordonnée, la carte se met à jour instantanément.
  - Il soumet via `PUT /api/titres_fonciers/1`, enregistrant les changements.

### 3. Assistant de configuration (Setup Wizard)
**Objectif**: Guider les administrateurs à travers un processus en 4 étapes : projets, étapes, rôles et permissions, utilisateurs, avec assignation automatique du `niveau_hierarchique` basé sur la localité.
- **Accès**: Exclusivement niveau 4 (superviseur).
- **Fonctionnalités**:
  - **Étape 1 - Projet**: Créer un projet (nom, description).
  - **Étape 2 - Étapes du workflow**: Ajouter des étapes (nom, ordre, description, type: semi-automatique/manuelle).
  - **Étape 3 - Rôles et permissions**: Définir des rôles (nom, niveau_hierarchique) et permissions (edit_coordinates, validate_geometry, etc.).
  - **Étape 4 - Utilisateurs**: Ajouter des utilisateurs (nom, prenom, email, mot_de_passe, localite). La localité détermine automatiquement le `niveau_hierarchique` :
    - `administration_centrale` → niveau 3 (national) ou 4 (superviseur, via une case à cocher supplémentaire "Est superviseur").
    - `departement` → niveau 2 (regional).
    - `arrondissement` → niveau 1 (local).
  - Localité : cases à cocher pour "administration_centrale", "département", "arrondissement". Si "département" ou "arrondissement" est sélectionné, afficher un champ avec autocomplétion pour les localités camerounaises.
- **Composants**:
  - **Interface de wizard**: Étapes séquentielles avec boutons "Suivant", "Précédent", "Terminer".
  - **Formulaire projet**: Champs pour nom (texte, requis), description (textarea, optionnel).
  - **Formulaire étapes**: Champs pour nom (texte, requis), ordre (nombre, requis), description (textarea), type_validation (liste déroulante: semi-automatique/manuelle).
  - **Formulaire rôles**: Champs pour nom (texte, requis), niveau_hierarchique (liste déroulante), cases à cocher pour permissions.
  - **Formulaire utilisateurs**: Champs pour nom (texte, requis), prenom (texte, requis), email (email, requis), mot_de_passe (mot de passe, requis), localite (cases à cocher pour type, champ d’autocomplétion pour valeur si département/arrondissement), case "Est superviseur" (visible si administration_centrale).
  - **Champ d’autocomplétion**: Suggestions via `GET /api/localites/autocomplete` (par exemple, "Yaoundé I", "Yaoundé II").
  - **Message d’erreur**: Par exemple, "Email déjà utilisé" ou "Localité requise".
- **Interactions**:
  - Soumettre chaque étape via les endpoints correspondants (`POST /api/projets`, `POST /api/projets/:id/etapes`, etc.).
  - Afficher/masquer le champ d’autocomplétion selon localite.type.
  - Définir automatiquement `niveau_hierarchique` basé sur localite.type :
    - "arrondissement" → 1.
    - "departement" → 2.
    - "administration_centrale" → 3, ou 4 si "Est superviseur" est coché.
  - Valider les champs (email unique, mot de passe > 8 caractères, localité valide).
  - Non-administrateurs reçoivent une erreur 403.
- **Exemple de flux**:
  - Un administrateur crée un projet "Cadastre Douala 2025".
  - Il ajoute une étape "Validation géométrique" (ordre: 1, semi-automatique).
  - Il crée un rôle "Validateur Local" (niveau 1) avec permission "edit_coordinates".
  - Il ajoute un utilisateur : nom: "Dupont", prenom: "Jean", email: "jean.dupont@example.com", localite: { type: "arrondissement", valeur: "Douala I" } (via autocomplétion), niveau_hierarchique: 1 (automatique).

### 4. Tableau de bord administratif global
**Objectif**: Fournir une vue d’ensemble des activités pour les administrateurs.
- **Accès**: Niveau 4.
- **Fonctionnalités**:
  - Afficher des statistiques : nombre de projets, extractions, tâches en cours, utilisateurs par localité.
  - Afficher les activités récentes (extractions, validations, configurations).
  - Fournir des liens vers l’assistant de configuration et la gestion des projets.
- **Composants**:
  - **Cartes de résumé**: Nombre de projets, extractions, tâches, utilisateurs (par exemple, "10 utilisateurs à Yaoundé I").
  - **Graphiques**: Diagrammes (Recharts) pour statuts des tâches, répartition par localité.
  - **Tableau des activités**: Liste paginée (ID, utilisateur, action, date, statut).
  - **Boutons de navigation**: Vers l’assistant de configuration, gestion des projets, etc.
- **Interactions**:
  - Charger les statistiques via `GET /api/admin/stats`.
  - Charger les activités via `GET /api/admin/activities`.
  - Clic sur un bouton redirige vers l’assistant ou une autre interface.
- **Exemple de flux**:
  - Un administrateur voit 5 projets, 30 extractions, 15 tâches en cours, et 20 utilisateurs (10 à Yaoundé, 5 à Douala).
  - Il clique sur "Configurer" pour lancer l’assistant.

### 5. Tableau de bord d’extraction
**Objectif**: Permettre au premier utilisateur assigné de déclencher des extractions et de corriger les résultats.
- **Accès**: Premier utilisateur assigné à la première étape (niveaux 1–3), vérifié via `GET /api/projets/:id/etapes/premiere`.
- **Fonctionnalités**:
  - Télécharger des images (PNG, JPEG, PDF) pour extraction.
  - Afficher les résultats : proprietaire, coordonnees_gps, surface_m2, perimetre_m, localite.
  - Visualiser le polygone sur une carte Leaflet.
  - Corriger les données avant soumission au workflow BPM.
- **Componants**:
  - **Formulaire de téléchargement**: Champ pour fichiers multiples, liste déroulante pour localite (basée sur l’utilisateur).
  - **Tableau des résultats**: Colonnes pour ID, proprietaire, coordonnees_gps, localite, statut.
  - **Carte interactive**: Affiche le polygone et le centroïde.
  - **Formulaire de correction**: Champs éditables pour proprietaire, coordonnees_gps, etc.
  - **Bouton de soumission**: Soumet au workflow via `POST /api/workflows`.
- **Interactions**:
  - Vérifier l’accès via `GET /api/projets/:id/etapes/premiere`.
  - Télécharger via `POST /api/extraction/upload`.
  - Corriger via `PUT /api/extractions/:id`.
  - Afficher une erreur si non premier utilisateur (403).
- **Exemple de flux**:
  - Un utilisateur (niveau 1, premier assigné, localite: "Yaoundé I") télécharge un PNG.
  - Le système extrait { proprietaire: "Jean Dupont", coordonnees_gps: [[48.8566, 2.3522], ...], localite: "Yaoundé I" }.
  - Il corrige une coordonnée, visualise le polygone, et soumet au workflow.

### 6. Intégration avec les validations BPM
**Objectif**: Gérer les tâches de validation post-extraction.
- **Accès**: Niveaux 1–3, limité aux tâches de leur niveau et localité.
- **Fonctionnalités**:
  - Afficher les tâches assignées (par exemple, "Valider coordonnées").
  - Valider/rejeter avec commentaires (obligatoires pour rejets) et pièces jointes.
  - Comparer avec une base cadastrale externe (saisie manuelle ou upload).
  - Visualiser le polygone sur une carte.
- **Composants**:
  - **Liste des tâches**: Tableau paginé (étape, titre, statut, date).
  - **Formulaire de validation**: Boutons "Valider"/"Rejeter", champ commentaire, upload de fichier.
  - **Carte interactive**: Affiche le polygone.
  - **Section de comparaison**: Champs pour données cadastrales.
- **Interactions**:
  - Charger les tâches via `GET /api/projets/:id/taches`.
  - Valider via `PUT /api/taches/:id/valider`.
  - Afficher une erreur si commentaire manquant pour rejet.
- **Exemple de flux**:
  - Un utilisateur (niveau 2) voit une tâche "Validation géométrique".
  - Il compare avec une base cadastrale, rejette avec un commentaire "Coordonnées incohérentes" et un PDF.

### 7. Audit et traçabilité
**Objectif**: Fournir un historique des actions.
- **Accès**: Niveaux 3–4.
- **Fonctionnalités**:
  - Afficher l’historique (extractions, validations, configurations).
  - Filtrer par utilisateur, date, statut, localité.
  - Exporter en PDF.
- **Composants**:
  - **Tableau d’audit**: Colonnes pour action, utilisateur, localité, date, statut, commentaire.
  - **Filtres**: Recherche par utilisateur, date, localité, statut.
  - **Bouton d’exportation**: Génère un PDF via `POST /api/audit/export`.
- **Interactions**:
  - Charger via `GET /api/audit`.
  - Exporter via `POST /api/audit/export`.
- **Exemple de flux**:
  - Un administrateur filtre par localité "Yaoundé I", voit une extraction et un rejet, puis exporte un rapport.

## Exigences non fonctionnelles
- **Sécurité**:
  - Authentification JWT avec vérification RBAC.
  - Configuration réservée au niveau 4, extraction au premier utilisateur.
- **Performance**:
  - Chargement des tableaux < 2 secondes pour 1000 entrées.
  - Rendu des cartes < 1 seconde.
  - Autocomplétion < 100 ms.
- **Ergonomie**:
  - Design réactif (desktop, tablette).
  - Palette accessible (vert/blanc, contraste élevé).
  - Messages d’erreur clairs (par exemple, "Localité invalide").
- **Scalabilité**:
  - Support pour 1000 utilisateurs et 10 000 titres fonciers.
  - Pagination et chargement différé.

## Exemple de code React pour le tableau de bord des titres fonciers
```jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const TitleDashboard = () => {
  const { user } = useAuth();
  const [titles, setTitles] = useState([]);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`/api/titres_fonciers?search=${search}`, {
      headers: { Authorization: `Bearer ${user.token}` },
    }).then(response => setTitles(response.data));
  }, [search, user]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Titres fonciers</h1>
      <input
        type="text"
        placeholder="Rechercher par propriétaire ou localité"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="mb-4 p-2 border"
      />
      <div className="grid grid-cols-3 gap-4">
        {titles.length === 0 && <p>Aucun titre disponible</p>}
        {titles.map(title => (
          <div
            key={title.id}
            className="p-4 border cursor-pointer hover:bg-gray-100"
            onClick={() => navigate(`/titres/${title.id}`)}
          >
            <h3>{title.proprietaire}</h3>
            <p>{title.localite.valeur}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TitleDashboard;
```

## Exemple de code React pour l’assistant de configuration (Étape utilisateurs)
```jsx
import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';

const UserSetup = ({ projectId, onBack, onComplete }) => {
  const { user } = useAuth();
  const [localiteType, setLocaliteType] = useState('');
  const [localiteValeur, setLocaliteValeur] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSuperviseur, setIsSuperviseur] = useState(false);

  const handleLocaliteTypeChange = (e) => {
    setLocaliteType(e.target.value);
    setLocaliteValeur('');
    setSuggestions([]);
    if (e.target.value !== 'administration_centrale') setIsSuperviseur(false);
  };

  const handleLocaliteSearch = async (e) => {
    const terme = e.target.value;
    setLocaliteValeur(terme);
    if (!['departement', 'arrondissement'].includes(localiteType)) return;
    try {
      const response = await axios.get(`/api/localites/autocomplete?type=${localiteType}&terme=${terme}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setSuggestions(response.data);
    } catch (error) {
      alert('Erreur : ' + error.response.data.error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { nom, prenom, email, mot_de_passe } = e.target;
    const niveau_hierarchique = localiteType === 'arrondissement' ? 1 :
                               localiteType === 'departement' ? 2 :
                               isSuperviseur ? 4 : 3;
    try {
      await axios.post('/api/utilisateurs', {
        nom: nom.value,
        prenom: prenom.value,
        email: email.value,
        mot_de_passe: mot_de_passe.value,
        niveau_hierarchique,
        localite: { type: localiteType, valeur: localiteType === 'administration_centrale' ? 'Administration Centrale' : localiteValeur },
      }, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      onComplete();
    } catch (error) {
      alert('Erreur : ' + error.response.data.error);
    }
  };

  if (user.niveau_hierarchique !== 4) return <div>Accès non autorisé</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Étape 4 : Ajouter un utilisateur</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Nom :
          <input name="nom" placeholder="Nom" required className="p-2 border mb-2" />
        </label>
        <label>
          Prénom :
          <input name="prenom" placeholder="Prénom" required className="p-2 border mb-2" />
        </label>
        <label>
          Email :
          <input name="email" type="email" placeholder="Email" required className="p-2 border mb-2" />
        </label>
        <label>
          Mot de passe :
          <input name="mot_de_passe" type="password" placeholder="Mot de passe" required className="p-2 border mb-2" />
        </label>
        <div className="mb-2">
          <label>
            <input
              type="checkbox"
              value="administration_centrale"
              checked={localiteType === 'administration_centrale'}
              onChange={handleLocaliteTypeChange}
            />
            Administration centrale
          </label>
          <label>
            <input
              type="checkbox"
              value="departement"
              checked={localiteType === 'departement'}
              onChange={handleLocaliteTypeChange}
            />
            Département
          </label>
          <label>
            <input
              type="checkbox"
              value="arrondissement"
              checked={localiteType === 'arrondissement'}
              onChange={handleLocaliteTypeChange}
            />
            Arrondissement
          </label>
        </div>
        {localiteType === 'administration_centrale' && (
          <label>
            <input
              type="checkbox"
              checked={isSuperviseur}
              onChange={() => setIsSuperviseur(!isSuperviseur)}
            />
            Est superviseur (niveau 4)
          </label>
        )}
        {['departement', 'arrondissement'].includes(localiteType) && (
          <div>
            <input
              value={localiteValeur}
              onChange={handleLocaliteSearch}
              placeholder={`Saisir ${localiteType}`}
              className="p-2 border mb-2"
            />
            <ul className="border p-2">
              {suggestions.map(suggestion => (
                <li
                  key={suggestion}
                  onClick={() => setLocaliteValeur(suggestion)}
                  className="cursor-pointer hover:bg-gray-100"
                >
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}
        <button type="button" onClick={onBack} className="mr-2">Précédent</button>
        <button type="submit">Terminer</button>
      </form>
    </div>
  );
};

export default UserSetup;
```