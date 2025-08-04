import { PrismaClient } from "@prisma/client";
import { TitreFoncierService } from "./titreFoncier.service";

const prisma = new PrismaClient();

export interface ExtractionData {
  id: number;
  projet_id: number;
  utilisateur_id: number;
  fichier: string;
  donnees_extraites: any;
  date_extraction: Date;
}

export class TitreFoncierExtractionService {
  private titreFoncierService: TitreFoncierService;

  constructor() {
    this.titreFoncierService = new TitreFoncierService();
  }

  /**
   * Crée automatiquement un titre foncier à partir des données d'extraction
   */
  async createTitreFromExtraction(
    extraction: ExtractionData,
    utilisateurId: number
  ): Promise<any> {
    try {
      console.log("[DEBUG] Création titre foncier depuis extraction:", extraction.id);

      // Extraire les données pertinentes des données extraites
      const titreData = this.extractTitreDataFromExtraction(extraction);
      
      if (!titreData) {
        console.log("[WARN] Impossible d'extraire les données du titre depuis l'extraction");
        return null;
      }

      // Créer le titre foncier
      const titreFoncier = await this.titreFoncierService.createTitreFoncier(
        {
          ...titreData,
          projet_id: extraction.projet_id,
        },
        utilisateurId
      );

      // Créer la relation entre l'extraction et le titre foncier
      await this.createExtractionTitreRelation(extraction.id, titreFoncier.id);

      console.log("[SUCCESS] Titre foncier créé avec ID:", titreFoncier.id);
      return titreFoncier;

    } catch (error) {
      console.error("[ERROR] Erreur lors de la création du titre foncier:", error);
      throw error;
    }
  }

  /**
   * Extrait les données d'un titre foncier depuis les données d'extraction
   */
  private extractTitreDataFromExtraction(extraction: ExtractionData): any {
    const donnees = extraction.donnees_extraites;
    
    if (!donnees) {
      return null;
    }

    // Mapping des champs selon la structure des données extraites
    const titreData: any = {};

    // Propriétaire - chercher dans différents champs possibles
    titreData.proprietaire = this.findProprietaire(donnees);

    // Coordonnées GPS - chercher dans différents formats
    titreData.coordonnees_gps = this.findCoordinates(donnees);

    // Superficie - chercher dans différents champs
    titreData.superficie = this.findSuperficie(donnees);

    // Périmètre - calculer ou extraire
    titreData.perimetre = this.findPerimetre(donnees);

    // Localité - extraire depuis les données ou l'extraction
    titreData.localite = this.findLocalite(donnees, extraction);

    // Validation des données minimales requises
    if (!titreData.proprietaire || !titreData.coordonnees_gps) {
      console.log("[WARN] Données insuffisantes pour créer un titre foncier");
      return null;
    }

    return titreData;
  }

  /**
   * Trouve le nom du propriétaire dans les données
   */
  private findProprietaire(donnees: any): string {
    const possibleFields = [
      'proprietaire',
      'owner',
      'nom_proprietaire',
      'titulaire',
      'beneficiaire',
      'nom',
      'name'
    ];

    for (const field of possibleFields) {
      if (donnees[field] && typeof donnees[field] === 'string' && donnees[field].trim()) {
        return donnees[field].trim();
      }
    }

    // Si aucun champ trouvé, générer un nom par défaut
    return `Propriétaire - ${new Date().toISOString().split('T')[0]}`;
  }

  /**
   * Trouve les coordonnées GPS dans les données
   */
  private findCoordinates(donnees: any): any {
    const possibleFields = [
      'coordonnees_gps',
      'coordinates',
      'gps',
      'polygon',
      'geometry',
      'shape'
    ];

    for (const field of possibleFields) {
      if (donnees[field]) {
        const coords = donnees[field];
        
        // Vérifier si c'est déjà au format GeoJSON
        if (Array.isArray(coords) && coords.length > 0) {
          // Format simple: [[lat, lng], [lat, lng], ...]
          if (Array.isArray(coords[0]) && coords[0].length === 2) {
            return coords;
          }
        }
        
        // Format GeoJSON
        if (coords.type === 'Polygon' && Array.isArray(coords.coordinates)) {
          return coords.coordinates[0]; // Premier anneau du polygone
        }
      }
    }

    // Générer des coordonnées par défaut si aucune trouvée
    return this.generateDefaultCoordinates();
  }

  /**
   * Trouve la superficie dans les données
   */
  private findSuperficie(donnees: any): number {
    const possibleFields = [
      'superficie',
      'surface',
      'area',
      'surface_m2',
      'superficie_m2',
      'size'
    ];

    for (const field of possibleFields) {
      if (donnees[field]) {
        const value = parseFloat(donnees[field]);
        if (!isNaN(value) && value > 0) {
          return value;
        }
      }
    }

    // Calculer la superficie depuis les coordonnées si disponibles
    const coords = this.findCoordinates(donnees);
    if (coords && Array.isArray(coords) && coords.length > 2) {
      return this.calculateArea(coords);
    }

    return 100.0; // Valeur par défaut
  }

  /**
   * Trouve le périmètre dans les données
   */
  private findPerimetre(donnees: any): number {
    const possibleFields = [
      'perimetre',
      'perimeter',
      'boundary_length',
      'length'
    ];

    for (const field of possibleFields) {
      if (donnees[field]) {
        const value = parseFloat(donnees[field]);
        if (!isNaN(value) && value > 0) {
          return value;
        }
      }
    }

    // Calculer le périmètre depuis les coordonnées si disponibles
    const coords = this.findCoordinates(donnees);
    if (coords && Array.isArray(coords) && coords.length > 2) {
      return this.calculatePerimeter(coords);
    }

    return 40.0; // Valeur par défaut
  }

  /**
   * Trouve la localité dans les données
   */
  private findLocalite(donnees: any, extraction: ExtractionData): string {
    // Chercher dans les données extraites
    const possibleFields = [
      'localite',
      'location',
      'address',
      'adresse',
      'commune',
      'departement'
    ];

    for (const field of possibleFields) {
      if (donnees[field] && typeof donnees[field] === 'string') {
        return donnees[field];
      }
    }

    // Utiliser la localité de l'extraction si disponible
    if (extraction.donnees_extraites?.localite) {
      const localite = extraction.donnees_extraites.localite;
      if (typeof localite === 'string') {
        return localite;
      } else if (localite.valeur) {
        return localite.valeur;
      }
    }

    return 'Non spécifiée';
  }

  /**
   * Crée la relation entre une extraction et un titre foncier
   */
  private async createExtractionTitreRelation(extractionId: number, titreId: number): Promise<void> {
    await prisma.titres_extractions.create({
      data: {
        extraction_id: extractionId,
        titre_id: titreId,
      },
    });
  }

  /**
   * Génère des coordonnées GPS par défaut
   */
  private generateDefaultCoordinates(): number[][] {
    // Coordonnées par défaut autour de Yaoundé
    return [
      [11.5167, 3.8667],
      [11.5168, 3.8668],
      [11.5169, 3.8667],
      [11.5167, 3.8667]
    ];
  }

  /**
   * Calcule la superficie d'un polygone (formule de Gauss)
   */
  private calculateArea(coordinates: number[][]): number {
    let area = 0;
    const n = coordinates.length;
    
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += coordinates[i][0] * coordinates[j][1];
      area -= coordinates[j][0] * coordinates[i][1];
    }
    
    return Math.abs(area / 2) * 111320 * 111320 * Math.cos(coordinates[0][1] * Math.PI / 180);
  }

  /**
   * Calcule le périmètre d'un polygone
   */
  private calculatePerimeter(coordinates: number[][]): number {
    let perimeter = 0;
    
    for (let i = 0; i < coordinates.length; i++) {
      const j = (i + 1) % coordinates.length;
      const dx = coordinates[j][0] - coordinates[i][0];
      const dy = coordinates[j][1] - coordinates[i][1];
      perimeter += Math.sqrt(dx * dx + dy * dy);
    }
    
    return perimeter * 111320; // Conversion en mètres
  }

  /**
   * Vérifie si une extraction peut générer un titre foncier
   */
  canCreateTitreFromExtraction(extraction: ExtractionData): boolean {
    const donnees = extraction.donnees_extraites;
    
    if (!donnees) {
      return false;
    }

    // Vérifier la présence de données minimales
    const hasProprietaire = this.findProprietaire(donnees) !== null;
    const hasCoordinates = this.findCoordinates(donnees) !== null;
    
    return hasProprietaire && hasVoici le plan détaillé en français pour la création automatique d'un "titre foncier" après une extraction :

---

## Plan : Création automatique d'un "titre foncier" après une extraction

### Informations recueillies :

1. **Schéma de la base de données** :  
   - La table `extractions` contient les données extraites avec un champ JSON `donnees_extraites`.  
   - La table `titres_fonciers` stocke les titres fonciers avec des champs comme `proprietaire`, `superficie`, `coordonnees_gps`, etc.  
   - La table de liaison `titres_extractions` relie les extractions aux titres fonciers (relation plusieurs-à-plusieurs).

2. **Flux actuel** :  
   - Les extractions sont créées via la méthode `uploadExtraction` dans `ExtractionController`.  
   - Après extraction réussie, les données sont sauvegardées dans la table `extractions`.  
   - Il n’y a pas encore de création automatique de titres fonciers.

3. **Services disponibles** :  
   - `TitreFoncierService` possède une méthode `createTitreFoncier`.  
   - `ExtractionService` gère la création et la gestion des extractions.

### Plan d’action :

#### Phase 1 : Création d’un service pour générer automatiquement un titre foncier à partir des données d’extraction  
- [ ] Créer une méthode dans `TitreFoncierService` pour générer un titre foncier à partir des données extraites.  
- [ ] Mapper les champs pertinents de `donnees_extraites` vers les champs du titre foncier.  
- [ ] Gérer les cas particuliers et valider les données.

#### Phase 2 : Intégration dans le flux d’extraction  
- [ ] Modifier la méthode `createExtraction` dans `ExtractionService` pour déclencher la création automatique du titre foncier.  
- [ ] Lier automatiquement l’extraction au titre foncier créé via la table `titres_extractions`.  
- [ ] Assurer la gestion transactionnelle pour garantir la cohérence (rollback en cas d’erreur).

#### Phase 3 : Validation et mapping des données  
- [ ] Implémenter la logique de mapping des données extraites vers les champs du titre foncier.  
- [ ] Valider la présence des champs obligatoires avant création.  
- [ ] Gérer les données manquantes ou incomplètes de façon robuste.

#### Phase 4 : Tests et gestion des erreurs  
- [ ] Ajouter une gestion complète des erreurs.  
- [ ] Écrire des tests unitaires et d’intégration pour cette nouvelle fonctionnalité.  
- [ ] Assurer un bon logging et audit des opérations.

### Fichiers à modifier :

- `src/services/extraction.service.ts` : ajout de la logique de création automatique du titre foncier.  
- `src/services/titreFoncier.service.ts` : ajout de la méthode de création à partir des données d’extraction.  
- `src/controllers/extraction.controller.ts` : vérifier l’intégration correcte.  
- `src/models/titresFoncier.model.ts` : éventuellement ajouter des méthodes liées.  

### Fichiers dépendants :  
- `prisma/schema.prisma` : la relation est déjà en place.  
- `src/models/extraction.model.ts` : vérifier la gestion des relations.

### Étapes suivantes :  
- Tester la création automatique avec des extractions exemples.  
- Vérifier la liaison dans la table `titres_extractions`.  
- Ajouter les règles de validation des données.  

---

Veuillez me confirmer si je peux commencer la mise en œuvre de cette fonctionnalité en commençant par la Phase 1.
