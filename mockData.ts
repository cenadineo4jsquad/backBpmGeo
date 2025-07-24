// Table de liaison utilisateur_roles (mock)
export const MOCK_UTILISATEUR_ROLES = [
  { utilisateur_id: "user_okene", role_id: "role_agent_saisie" },
  { utilisateur_id: "user_validator", role_id: "role_validateur_dept" },
  { utilisateur_id: "user_admin", role_id: "role_admin_systeme" },
];
import type {
  User,
  Localite,
  Role,
  Permission,
  TitreFoncier,
  Projet,
  EtapeWorkflow,
  Tache,
  AuditEntry,
  Stats,
} from "./src/types";

// Type adapté à la nouvelle structure d'extraction
export type ExtractionMockResult = {
  filename: string;
  results: {
    Coordonnees: number[][];
    area_value: number;
    arrondissement_name: string;
    database_saved: boolean;
    department_name: string;
    owner_name: string;
    partial_only: boolean;
    polygon: {
      area: number;
      bounds: number[];
      centroid: number[];
      geometry: {
        coordinates: number[][][];
        type: string;
      };
      perimeter: number;
      type: string;
    };
    processing_status: string;
    status: string;
    successful_rectangles: number[];
  };
  success: boolean;
};

// Permissions disponibles
export const MOCK_PERMISSIONS: Permission[] = [
  {
    id: "perm_extract_data",
    nom: "Extraction de données",
    code: "extract_data",
  },
  {
    id: "perm_edit_coordinates",
    nom: "Modifier les coordonnées",
    code: "edit_coordinates",
  },
  {
    id: "perm_validate_geometry",
    nom: "Valider la géométrie",
    code: "validate_geometry",
  },
  {
    id: "perm_approve_title",
    nom: "Approuver un titre",
    code: "approve_title",
  },
  { id: "perm_reject_title", nom: "Rejeter un titre", code: "reject_title" },
  { id: "perm_view_audit", nom: "Consulter l'audit", code: "view_audit" },
  { id: "perm_export_data", nom: "Exporter les données", code: "export_data" },
  {
    id: "perm_system_config",
    nom: "Configuration système",
    code: "system_config",
  },
  {
    id: "perm_user_management",
    nom: "Gestion des utilisateurs",
    code: "user_management",
  },
  { id: "perm_full_access", nom: "Accès complet", code: "full_access" },
];

// Localités cohérentes avec l'extraction et enrichies
export const MOCK_LOCALITES: Localite[] = [
  {
    id: "loc_soa",
    nom: "Soa",
    type: "arrondissement",
    valeur: "Soa",
  },
  {
    id: "dep_mefou_afamba",
    nom: "Mefou et Afamba",
    type: "departement",
    valeur: "Mefou et Afamba",
  },
  {
    id: "loc_nkolafamba",
    nom: "Nkolafamba",
    type: "arrondissement",
    valeur: "Nkolafamba",
  },
  {
    id: "loc_edzendouan",
    nom: "Edzendouan",
    type: "arrondissement",
    valeur: "Edzendouan",
  },
];

// Rôles
export const MOCK_ROLES: Role[] = [
  {
    id: "role_agent_saisie",
    nom: "Agent de saisie",
    niveau_hierarchique: 1,
    permissions: [MOCK_PERMISSIONS[0]], // extract_data
  },
  {
    id: "role_validateur_dept",
    nom: "Validateur départemental",
    niveau_hierarchique: 2,
    permissions: [MOCK_PERMISSIONS[1], MOCK_PERMISSIONS[2]], // edit_coordinates, validate_geometry
  },
  {
    id: "role_superviseur_national",
    nom: "Superviseur national",
    niveau_hierarchique: 3,
    permissions: [
      MOCK_PERMISSIONS[3],
      MOCK_PERMISSIONS[4],
      MOCK_PERMISSIONS[5],
      MOCK_PERMISSIONS[6],
    ], // approve, reject, audit, export
  },
  {
    id: "role_admin_systeme",
    nom: "Administrateur système",
    niveau_hierarchique: 4,
    permissions: MOCK_PERMISSIONS, // Toutes les permissions
  },
];

// Utilisateurs enrichis
export const MOCK_USERS: User[] = [
  {
    id: "user_okene",
    nom: "OKENE AHANDA MAMA PIE HERV",
    prenom: "",
    email: "okene.ahanda@example.com",
    niveau_hierarchique: 1,
    localite: MOCK_LOCALITES[0], // Soa
    role: MOCK_ROLES[0],
  },
  {
    id: "user_validator",
    nom: "NDJOMO",
    prenom: "Paul",
    email: "paul.ndjomo@example.com",
    niveau_hierarchique: 2,
    localite: MOCK_LOCALITES[1], // Mefou et Afamba
    role: MOCK_ROLES[1],
  },
  {
    id: "user_admin",
    nom: "MBOUA",
    prenom: "Sylvie",
    email: "sylvie.mboua@example.com",
    niveau_hierarchique: 4,
    localite: MOCK_LOCALITES[1], // Mefou et Afamba
    role: MOCK_ROLES[3],
  },
];

// Projets enrichis
export const MOCK_PROJETS: Projet[] = [
  {
    id: "projet_soa_2025",
    nom: "Cadastre Soa 2025",
    description:
      "Numérisation et validation des titres fonciers de Soa et environs (Mefou et Afamba)",
    created_at: "2025-07-01T08:00:00Z",
    etapes: [],
  },
];

// Étapes de workflow enrichies
export const MOCK_ETAPES: EtapeWorkflow[] = [
  {
    id: "etape_1",
    nom: "Extraction des données",
    ordre: 1,
    description:
      "Extraction automatique des informations depuis les documents scannés",
    type: "semi_automatique",
    projet_id: "projet_soa_2025",
  },
  {
    id: "etape_2",
    nom: "Validation géométrique",
    ordre: 2,
    description: "Vérification et correction des coordonnées GPS",
    type: "manuelle",
    projet_id: "projet_soa_2025",
  },
  {
    id: "etape_3",
    nom: "Approbation finale",
    ordre: 3,
    description: "Validation finale par l'administrateur du cadastre",
    type: "manuelle",
    projet_id: "projet_soa_2025",
  },
];

// Mise à jour des projets avec leurs étapes
MOCK_PROJETS[0].etapes = MOCK_ETAPES;

// Titres fonciers enrichis
export const MOCK_TITRES_FONCIERS: TitreFoncier[] = [
  {
    id: "titre_okene_soa",
    proprietaire: "OKENE AHANDA MAMA PIE HERV",
    coordonnees_gps: [
      [11.599775887849335, 3.9915300998418504],
      [11.599931184680232, 3.991457821318175],
      [11.599866099504329, 3.991316788467999],
      [11.599735298636295, 3.9913776651149115],
      [11.599722156106091, 3.991413667401851],
      [11.599775887849335, 3.9915300998418504],
    ],
    surface_m2: 323,
    perimetre_m: 0.0006374518023342832,
    localite: MOCK_LOCALITES[0], // Soa
    statut: "validé",
    created_at: "2025-07-23T20:07:50Z",
    updated_at: "2025-07-23T20:07:50Z",
  },
  {
    id: "titre_ndjomo_nkolafamba",
    proprietaire: "NDJOMO Paul",
    coordonnees_gps: [
      [11.6001, 3.992],
      [11.6002, 3.9921],
      [11.6003, 3.992],
      [11.6001, 3.992],
    ],
    surface_m2: 250,
    perimetre_m: 80,
    localite: MOCK_LOCALITES[2], // Nkolafamba
    statut: "en_cours",
    created_at: "2025-07-20T10:00:00Z",
    updated_at: "2025-07-21T12:00:00Z",
  },
];

// Résultats d'extraction enrichis
export const MOCK_EXTRACTIONS: ExtractionMockResult[] = [
  {
    filename: "20250723_200750_pdfscanner.jpg",
    results: {
      Coordonnees: [
        [788691.711, 441647.318],
        [788708.993, 441639.375],
        [788701.81, 441623.747],
        [788687.254, 441630.437],
        [788685.781, 441634.416],
      ],
      area_value: 323.0,
      arrondissement_name: "Soa",
      database_saved: true,
      department_name: "Mefou et Afamba",
      owner_name: "OKENE AHANDA MAMA PIE HERV",
      partial_only: false,
      polygon: {
        area: 2.6240213701101162e-8,
        bounds: [
          11.599722156106091, 3.991316788467999, 11.599931184680232,
          3.9915300998418504,
        ],
        centroid: [11.599822364065165, 3.991423862116124],
        geometry: {
          coordinates: [
            [
              [11.599775887849335, 3.9915300998418504],
              [11.599931184680232, 3.991457821318175],
              [11.599866099504329, 3.991316788467999],
              [11.599735298636295, 3.9913776651149115],
              [11.599722156106091, 3.991413667401851],
              [11.599775887849335, 3.9915300998418504],
            ],
          ],
          type: "Polygon",
        },
        perimeter: 0.0006374518023342832,
        type: "polygon",
      },
      processing_status: "complete",
      status: "success",
      successful_rectangles: [3],
    },
    success: true,
  },
  {
    filename: "20250720_100000_ndjomo.pdf",
    results: {
      Coordonnees: [
        [788800.0, 441700.0],
        [788810.0, 441705.0],
        [788805.0, 441710.0],
        [788800.0, 441700.0],
      ],
      area_value: 250.0,
      arrondissement_name: "Nkolafamba",
      database_saved: true,
      department_name: "Mefou et Afamba",
      owner_name: "NDJOMO Paul",
      partial_only: false,
      polygon: {
        area: 1.2e-8,
        bounds: [11.6001, 3.992, 11.6003, 3.9921],
        centroid: [11.6002, 3.99205],
        geometry: {
          coordinates: [
            [
              [11.6001, 3.992],
              [11.6002, 3.9921],
              [11.6003, 3.992],
              [11.6001, 3.992],
            ],
          ],
          type: "Polygon",
        },
        perimeter: 80,
        type: "polygon",
      },
      processing_status: "complete",
      status: "success",
      successful_rectangles: [2],
    },
    success: true,
  },
];

// Tâches enrichies
export const MOCK_TACHES: Tache[] = [
  {
    id: "tache_validation_okene",
    titre: "Validation géométrique - OKENE AHANDA MAMA PIE HERV",
    description:
      "Vérifier les coordonnées GPS du titre foncier de OKENE AHANDA MAMA PIE HERV à Soa.",
    statut: "en_cours",
    assignee: MOCK_USERS[1], // Validateur
    etape: MOCK_ETAPES[1], // Validation géométrique
    titre_foncier: MOCK_TITRES_FONCIERS[0],
    created_at: "2025-07-23T20:07:50Z",
    updated_at: "2025-07-23T20:07:50Z",
  },
  {
    id: "tache_approbation_ndjomo",
    titre: "Approbation finale - NDJOMO Paul",
    description:
      "Approbation finale du titre foncier de NDJOMO Paul à Nkolafamba.",
    statut: "en_attente",
    assignee: MOCK_USERS[2], // Admin
    etape: MOCK_ETAPES[2], // Approbation finale
    titre_foncier: MOCK_TITRES_FONCIERS[1],
    created_at: "2025-07-21T12:00:00Z",
    updated_at: "2025-07-21T12:00:00Z",
  },
];

// Audits enrichis
export const MOCK_AUDIT: AuditEntry[] = [
  {
    id: "audit_1",
    action: "Création titre foncier",
    utilisateur: MOCK_USERS[0],
    localite: MOCK_LOCALITES[0],
    statut: "succès",
    commentaire: "Titre foncier créé pour OKENE AHANDA MAMA PIE HERV à Soa.",
    created_at: "2025-07-23T20:07:50Z",
  },
  {
    id: "audit_2",
    action: "Validation géométrique",
    utilisateur: MOCK_USERS[1],
    localite: MOCK_LOCALITES[1],
    statut: "succès",
    commentaire:
      "Coordonnées validées pour le titre de OKENE AHANDA MAMA PIE HERV.",
    created_at: "2025-07-23T21:00:00Z",
  },
  {
    id: "audit_3",
    action: "Approbation finale",
    utilisateur: MOCK_USERS[2],
    localite: MOCK_LOCALITES[2],
    statut: "succès",
    commentaire: "Titre foncier de NDJOMO Paul approuvé à Nkolafamba.",
    created_at: "2025-07-21T13:00:00Z",
  },
];

// Statistiques enrichies
export const MOCK_STATS: Stats = {
  projets: 1,
  extractions: 2,
  taches_en_cours: 1,
  utilisateurs_par_localite: {
    Soa: 1,
    "Mefou et Afamba": 2,
    Nkolafamba: 0,
    Edzendouan: 0,
  },
};

// Mots de passe pour les tests enrichis
export const MOCK_PASSWORDS: { [email: string]: string } = {
  "okene.ahanda@example.com": "password123",
  "paul.ndjomo@example.com": "password123",
  "sylvie.mboua@example.com": "admin123",
};
