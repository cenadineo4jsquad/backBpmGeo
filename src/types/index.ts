// Types minimalistes pour le mock
export type User = {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  niveau_hierarchique: number;
  localite: Localite;
  role: Role;
  mot_de_passe?: string;
};

export type Localite = {
  id: string;
  nom: string;
  type: string;
  valeur: string;
};

export type Role = {
  id: string;
  nom: string;
  niveau_hierarchique?: number;
  description?: string;
  permissions?: Permission[];
};

export type Permission = {
  id: string;
  nom: string;
  code: string;
  action?: string;
  role_id?: string;
};

export type TitreFoncier = {
  id: string;
  proprietaire: string;
  coordonnees_gps: any;
  surface_m2?: number;
  perimetre_m?: number;
  localite: Localite;
  statut: string;
  created_at: string;
  updated_at: string;
  projet_id?: string;
  superficie?: number;
  perimetre?: number;
  centroide?: any;
  date_ajout?: string;
};

export type Projet = {
  id: string;
  nom: string;
  description?: string;
  created_at?: string;
  date_creation?: string;
  etapes?: EtapeWorkflow[];
};

export type EtapeWorkflow = {
  id: string;
  nom: string;
  ordre: number;
  description?: string;
  type?: string;
  type_validation?: string;
  projet_id?: string;
};

export type Tache = {
  id: string;
  titre: string;
  description: string;
  statut: string;
  assignee: User;
  etape: EtapeWorkflow;
  titre_foncier: TitreFoncier;
  created_at: string;
  updated_at: string;
};

export type AuditEntry = {
  id: string;
  action: string;
  utilisateur: User;
  localite: Localite;
  statut: string;
  commentaire: string;
  created_at: string;
  utilisateur_id?: string;
  projet_id?: string;
  details?: any;
  date_action?: string;
};

export type Stats = {
  projets: number;
  extractions: number;
  taches_en_cours: number;
  utilisateurs_par_localite: Record<string, number>;
};
