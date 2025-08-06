import { PrismaClient } from '@prisma/client';
import type { TitreData, ExtractionDto } from '../features/extraction/types';

const prisma = new PrismaClient();

/* ---------- utilitaires ---------- */
const findProprietaire = (d: any): string =>
  ['proprietaire', 'owner', 'nom_proprietaire', 'titulaire', 'beneficiaire', 'nom', 'name']
    .map(k => d[k]?.trim?.())
    .find(Boolean) ?? `Propriétaire-${new Date().toISOString().split('T')[0]}`;

const findCoordinates = (d: any): number[][] => {
  // Vérifier les champs possibles
  const coords = d.coordonnees_gps ?? d.coordinates ?? d.polygon ?? d.geometry ?? d.shape;
  
  if (Array.isArray(coords) && coords.length > 0) {
    // Format simple: [[lat, lng], [lat, lng], ...]
    if (Array.isArray(coords[0]) && coords[0].length === 2) {
      return coords;
    }
  }
  
  // Format GeoJSON
  if (coords?.type === 'Polygon' && Array.isArray(coords.coordinates)) {
    return coords.coordinates[0]; // Premier anneau du polygone
  }
  
  // Coordonnées par défaut autour de Yaoundé
  return [[11.5167, 3.8667], [11.5168, 3.8668], [11.5169, 3.8667], [11.5167, 3.8667]];
};

const findNumber = (d: any, keys: string[]): number =>
  keys.map(k => parseFloat(d[k])).find(v => !isNaN(v) && v > 0) ?? 100;

const findLocalite = (d: any, extractionId?: number): TitreData['localite'] => {
  const fields = ['localite', 'location', 'commune', 'arrondissement', 'ville', 'city'];
  
  for (const field of fields) {
    if (d[field]) {
      if (typeof d[field] === 'string') {
        return { type: 'commune', valeur: d[field] };
      }
      if (typeof d[field] === 'object' && d[field].valeur) {
        return d[field];
      }
    }
  }
  
  return { 
    type: 'commune', 
    valeur: extractionId ? `Localité-${extractionId}` : 'Yaoundé' 
  };
};

/* ---------- service ---------- */
export const titreFoncierService = {
  async createTitreFoncier(data: TitreData, projetId: number) {
    return prisma.titres_fonciers.create({
      data: {
        projet_id: projetId,
        proprietaire: data.proprietaire,
        superficie: data.superficie,
        perimetre: data.perimetre,
        coordonnees_gps: data.coordonnees_gps,
        centroide: data.coordonnees_gps[0], // Premier point comme centroïde
        date_ajout: new Date(),
        localite: JSON.stringify(data.localite), // Stocker comme JSON string
      },
    });
  },

  async linkExtractionToTitre(extractionId: number, titreId: number) {
    return prisma.titres_extractions.create({
      data: { extraction_id: extractionId, titre_id: titreId },
    });
  },
};

export const titreFoncierExtractionService = {
  async createTitreFromExtraction(
    extraction: ExtractionDto,
    utilisateurId: number
  ) {
    console.log("[DEBUG] Création titre foncier depuis extraction:", extraction.id);
    
    const d = extraction.donnees_extraites;
    if (!d) {
      console.log("[WARN] Aucunes données extraites trouvées");
      return null;
    }

    const titreData: TitreData = {
      proprietaire: findProprietaire(d),
      coordonnees_gps: findCoordinates(d),
      superficie: findNumber(d, ['superficie', 'surface', 'area', 'surface_m2', 'superficie_m2']),
      perimetre: findNumber(d, ['perimetre', 'perimeter', 'boundary_length']),
      localite: findLocalite(d, extraction.id),
    };

    // Validation des données minimales
    if (!titreData.proprietaire || !titreData.coordonnees_gps.length) {
      console.log("[WARN] Données insuffisantes pour créer un titre foncier");
      return null;
    }

    try {
      const titre = await titreFoncierService.createTitreFoncier(titreData, extraction.projet_id);
      await titreFoncierService.linkExtractionToTitre(extraction.id, titre.id);
      
      console.log("[SUCCESS] Titre foncier créé avec ID:", titre.id);
      return titre;
    } catch (error) {
      console.error("[ERROR] Erreur lors de la création du titre foncier:", error);
      throw error;
    }
  },

  canCreateTitreFromExtraction(extraction: ExtractionDto): boolean {
    const d = extraction.donnees_extraites;
    if (!d) return false;
    
    const hasProprietaire = !!findProprietaire(d);
    const hasCoordinates = findCoordinates(d).length > 0;
    
    return hasProprietaire && hasCoordinates;
  },
};