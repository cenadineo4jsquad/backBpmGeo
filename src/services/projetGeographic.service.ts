import { PrismaClient } from "@prisma/client";
import { GeographicAccessService } from "./geographicAccess.service";
import pool from "../config/pool";

const prisma = new PrismaClient();

export class ProjetGeographicService {
  private geographicAccess: GeographicAccessService;

  constructor() {
    this.geographicAccess = new GeographicAccessService(pool);
  }

  /**
   * Récupère tous les projets accessibles par un utilisateur selon sa hiérarchie géographique
   */
  async getProjectsForUser(niveau_hierarchique: number, userLocalites: any) {
    if (niveau_hierarchique === 4) {
      // Niveau central - accès à tous les projets
      return await prisma.projets.findMany({
        include: {
          localites: true,
        },
        orderBy: { date_creation: "desc" },
      });
    }

    // Récupérer les localités accessibles par l'utilisateur
    const accessibleLocalites =
      await this.geographicAccess.getAccessibleLocalites(
        niveau_hierarchique,
        userLocalites
      );

    // Récupérer les projets dans les localités accessibles
    const projets = await prisma.projets.findMany({
      where: {
        OR: [
          {
            localites: {
              valeur: {
                in: accessibleLocalites,
              },
            },
          },
          {
            // Inclure aussi les projets sans localité spécifique si l'utilisateur est niveau département ou région
            localite_id: niveau_hierarchique >= 2 ? null : undefined,
          },
        ],
      },
      include: {
        localites: true,
        _count: {
          select: {
            titres_fonciers: true,
            extractions: true,
          },
        },
      },
      orderBy: { date_creation: "desc" },
    });

    return projets;
  }

  /**
   * Vérifie si un utilisateur a accès à un projet spécifique
   */
  async canUserAccessProject(
    projetId: number,
    niveau_hierarchique: number,
    userLocalites: any
  ): Promise<boolean> {
    if (niveau_hierarchique === 4) {
      return true; // Niveau central a accès à tout
    }

    const projet = await prisma.projets.findUnique({
      where: { id: projetId },
      include: { localites: true },
    });

    if (!projet) {
      return false;
    }

    // Si le projet n'a pas de localité, vérifier selon le niveau utilisateur
    if (!projet.localites) {
      return niveau_hierarchique >= 2; // Seuls les niveaux département et plus peuvent voir les projets sans localité
    }

    // Vérifier l'accès à la localité du projet
    return await this.geographicAccess.hasAccessToLocalite(
      niveau_hierarchique,
      userLocalites,
      projet.localites.valeur
    );
  }

  /**
   * Récupère un projet par ID avec vérification d'accès
   */
  async getProjectByIdForUser(
    projetId: number,
    niveau_hierarchique: number,
    userLocalites: any
  ) {
    const hasAccess = await this.canUserAccessProject(
      projetId,
      niveau_hierarchique,
      userLocalites
    );

    if (!hasAccess) {
      return null;
    }

    return await prisma.projets.findUnique({
      where: { id: projetId },
      include: {
        localites: true,
        titres_fonciers: {
          select: {
            id: true,
            proprietaire: true,
            superficie: true,
            localite: true,
          },
        },
        extractions: {
          select: {
            id: true,
            statut: true,
            date_extraction: true,
          },
        },
        _count: {
          select: {
            titres_fonciers: true,
            extractions: true,
            workflows: true,
          },
        },
      },
    });
  }

  /**
   * Crée un projet avec une localité appropriée selon l'utilisateur
   */
  async createProjectForUser(
    data: { nom: string; description?: string; localite_id?: number },
    niveau_hierarchique: number,
    userLocalites: any
  ) {
    // Si l'utilisateur n'est pas niveau central et aucune localité spécifiée,
    // utiliser sa localité principale
    if (niveau_hierarchique < 4 && !data.localite_id && userLocalites) {
      data.localite_id = userLocalites.id;
    }

    const projet = await prisma.projets.create({
      data: {
        nom: data.nom,
        description: data.description,
        localite_id: data.localite_id,
      },
      include: {
        localites: true,
      },
    });

    return projet;
  }

  /**
   * Met à jour un projet avec vérification d'accès
   */
  async updateProjectForUser(
    projetId: number,
    data: { nom?: string; description?: string; localite_id?: number },
    niveau_hierarchique: number,
    userLocalites: any
  ) {
    const hasAccess = await this.canUserAccessProject(
      projetId,
      niveau_hierarchique,
      userLocalites
    );

    if (!hasAccess) {
      throw new Error("Accès interdit à ce projet");
    }

    // Les utilisateurs non-centraux ne peuvent pas changer la localité vers une zone à laquelle ils n'ont pas accès
    if (niveau_hierarchique < 4 && data.localite_id) {
      const targetLocalite = await prisma.localites.findUnique({
        where: { id: data.localite_id },
      });

      if (targetLocalite) {
        const canAccessTargetLocalite =
          await this.geographicAccess.hasAccessToLocalite(
            niveau_hierarchique,
            userLocalites,
            targetLocalite.valeur
          );

        if (!canAccessTargetLocalite) {
          throw new Error(
            `Accès interdit à la localité ${targetLocalite.valeur}`
          );
        }
      }
    }

    return await prisma.projets.update({
      where: { id: projetId },
      data,
      include: {
        localites: true,
      },
    });
  }

  /**
   * Supprime un projet avec vérification d'accès
   */
  async deleteProjectForUser(
    projetId: number,
    niveau_hierarchique: number,
    userLocalites: any
  ) {
    const hasAccess = await this.canUserAccessProject(
      projetId,
      niveau_hierarchique,
      userLocalites
    );

    if (!hasAccess) {
      throw new Error("Accès interdit à ce projet");
    }

    return await prisma.projets.delete({
      where: { id: projetId },
    });
  }

  /**
   * Récupère les statistiques des projets pour un utilisateur
   */
  async getProjectStatsForUser(
    niveau_hierarchique: number,
    userLocalites: any
  ) {
    const projets = await this.getProjectsForUser(
      niveau_hierarchique,
      userLocalites
    );

    const stats = {
      total_projets: projets.length,
      projets_par_localite: {} as Record<string, number>,
      total_titres_fonciers: 0,
      total_extractions: 0,
    };

    projets.forEach((projet) => {
      const localite = projet.localites?.valeur || "Sans localité";
      stats.projets_par_localite[localite] =
        (stats.projets_par_localite[localite] || 0) + 1;
      stats.total_titres_fonciers += projet._count?.titres_fonciers || 0;
      stats.total_extractions += projet._count?.extractions || 0;
    });

    return stats;
  }
}

export default ProjetGeographicService;
