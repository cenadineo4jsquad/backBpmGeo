# 🚀 Guide de Démarrage Rapide - Frontend

## 📋 Résumé

Ce guide explique comment démarrer rapidement avec l'API BPM Extraction pour votre application frontend.

## 🏃‍♂️ Démarrage Express (5 minutes)

### 1. Démarrer le Backend

```bash
cd backend
npm run dev
```

Le serveur sera disponible sur `http://localhost:3000`

### 2. Tester avec la Démo HTML

Ouvrez le fichier `frontend-demo.html` dans votre navigateur pour voir une démonstration complète.

### 3. Comptes de Test Disponibles

| Niveau | Email                               | Mot de passe                | Rôle           |
| ------ | ----------------------------------- | --------------------------- | -------------- |
| 1      | `reception.foncier@workflow.cm`     | `ReceptionFoncier2024!`     | Réceptionnaire |
| 2      | `controle.technique@workflow.cm`    | `ControleTech2024!`         | Contrôleur     |
| 3      | `validation.principale@workflow.cm` | `ValidationPrincipale2024!` | Validateur     |
| 4      | `admin.systeme@workflow.cm`         | `AdminSysteme2024!`         | Administrateur |

## 💻 Code Minimal

### Connexion Simple

```javascript
const API_BASE = "http://localhost:3000";

async function login(email, password) {
  const response = await fetch(`${API_BASE}/utilisateurs/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, mot_de_passe: password }),
  });

  const data = await response.json();
  if (response.ok) {
    localStorage.setItem("access_token", data.access_token);
    return data.user;
  }
  throw new Error(data.error);
}
```

### Upload de Fichier

```javascript
async function uploadFile(file, user) {
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

  const response = await fetch(`${API_BASE}/extractions/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("access_token")}`,
    },
    body: formData,
  });

  return await response.json();
}
```

### Récupérer les Extractions

```javascript
async function getExtractions() {
  const response = await fetch(`${API_BASE}/extractions`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("access_token")}`,
    },
  });

  return await response.json();
}
```

## 🎯 Points Clés

### ✅ Authentification

- Utiliser `/utilisateurs/login` avec `email` et `mot_de_passe`
- Stocker le `access_token` pour les requêtes suivantes
- Inclure `Authorization: Bearer <token>` dans les headers

### ✅ Upload de Fichiers

- Utiliser `FormData` avec les champs : `file`, `projet_id`, `localite`
- Types supportés : JPEG, PNG, WEBP, PDF (max 10MB)
- La `localite` doit correspondre à celle de l'utilisateur (niveaux 1-2)

### ✅ Restrictions Géographiques

- **Niveau 1-2** : Accès limité à leur localité assignée
- **Niveau 3** : Accès régional
- **Niveau 4** : Accès complet

### ✅ Gestion des Erreurs

- `401` : Token invalide → Rediriger vers login
- `403` : Permissions insuffisantes
- `400` : Données invalides

## 🔗 Liens Utiles

- **Documentation complète** : `FRONTEND_INTEGRATION_GUIDE.md`
- **Démo interactive** : `frontend-demo.html`
- **Tests API** : Dossier `/tests`

## 🛠️ Prochaines Étapes

1. **Explorez la démo** : Ouvrez `frontend-demo.html` et testez les fonctionnalités
2. **Lisez la doc complète** : `FRONTEND_INTEGRATION_GUIDE.md` pour plus de détails
3. **Intégrez dans votre app** : Utilisez les exemples de code fournis
4. **Adaptez les styles** : Personnalisez l'interface selon vos besoins

## 💡 Conseils

- **Testez d'abord** avec les comptes fournis pour comprendre le workflow
- **Respectez les restrictions** géographiques pour éviter les erreurs 403
- **Gérez les tokens** : Implémentez le refresh automatique si nécessaire
- **Validez côté client** : Types de fichiers et tailles avant upload

---

🎉 **Vous êtes prêt !** Commencez par la démo HTML puis intégrez dans votre application.
