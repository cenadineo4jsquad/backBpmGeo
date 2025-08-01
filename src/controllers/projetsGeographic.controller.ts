import { FastifyRequest, FastifyReply } from "fastify";
import { ProjetGeographicService } from "../services/projetGeographic.service";
import { logAuditAction } from "../services/audit.service";

const projetGeographicService = new ProjetGeographicService();

export const getProjectsWithGeographicAccess = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const user = request.user as any;

    const projets = await projetGeographicService.getProjectsForUser(
      user.niveau_hierarchique,
      user.localites
    );

    // Ajouter des informations de contexte d'accès
    const response = {
      projets: projets.map((projet) => ({
        id: projet.id,
        nom: projet.nom,
        description: projet.description,
        date_creation: projet.date_creation,
        localite: projet.localites
          ? {
              type: projet.localites.type,
              valeur: projet.localites.valeur,
            }
          : null,
        statistiques: {
          titres_fonciers: (projet as any)._count?.titres_fonciers || 0,
          extractions: (projet as any)._count?.extractions || 0,
        },
      })),
      access_info: {
        niveau_utilisateur: user.niveau_hierarchique,
        localite_principale: user.geographic_access.primary_localite,
        total_accessible: projets.length,
        scope: user.geographic_access.can_access_all ? "global" : "restricted",
      },
    };

    reply.status(200).send(response);
  } catch (error) {
    console.error("Erreur lors de la récupération des projets:", error);
    reply
      .status(500)
      .send({ error: "Erreur lors de la récupération des projets" });
  }
};

export const getProjectByIdWithGeographicAccess = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params as any;
    const user = request.user as any;

    const projet = await projetGeographicService.getProjectByIdForUser(
      parseInt(id),
      user.niveau_hierarchique,
      user.localites
    );

    if (!projet) {
      return reply
        .status(404)
        .send({ error: "Projet non trouvé ou accès interdit" });
    }

    const response = {
      id: projet.id,
      nom: projet.nom,
      description: projet.description,
      date_creation: projet.date_creation,
      localite: projet.localites
        ? {
            type: projet.localites.type,
            valeur: projet.localites.valeur,
          }
        : null,
      titres_fonciers: projet.titres_fonciers.map((titre) => ({
        id: titre.id,
        proprietaire: titre.proprietaire,
        superficie: titre.superficie,
        localite: titre.localite,
      })),
      extractions: projet.extractions.map((extraction) => ({
        id: extraction.id,
        statut: extraction.statut,
        date_extraction: extraction.date_extraction,
      })),
      statistiques: {
        total_titres_fonciers: projet._count.titres_fonciers,
        total_extractions: projet._count.extractions,
        total_workflows: projet._count.workflows,
      },
      access_info: {
        user_can_modify:
          user.geographic_access.can_access_all ||
          user.niveau_hierarchique >= 2,
        access_level: user.niveau_hierarchique,
      },
    };

    reply.status(200).send(response);
  } catch (error) {
    console.error("Erreur lors de la récupération du projet:", error);
    reply
      .status(500)
      .send({ error: "Erreur lors de la récupération du projet" });
  }
};

export const createProjectWithGeographicAccess = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { nom, description, localite_id } = request.body as any;
    const user = request.user as any;

    // Validation des permissions de création
    if (user.niveau_hierarchique < 2) {
      return reply.status(403).send({
        error:
          "Seuls les utilisateurs de niveau département ou supérieur peuvent créer des projets",
      });
    }

    if (!nom || nom.trim() === "") {
      return reply.status(400).send({ error: "Nom de projet requis" });
    }

    const projet = await projetGeographicService.createProjectForUser(
      { nom, description, localite_id },
      user.niveau_hierarchique,
      user.localites
    );

    // Enregistrer l'action d'audit
    await logAuditAction(user.id, "create_project", projet.id, {
      nom: projet.nom,
      description: projet.description,
      localite: projet.localites?.valeur,
    });

    const response = {
      id: projet.id,
      nom: projet.nom,
      description: projet.description,
      date_creation: projet.date_creation,
      localite: projet.localites
        ? {
            type: projet.localites.type,
            valeur: projet.localites.valeur,
          }
        : null,
      created_by: {
        niveau_hierarchique: user.niveau_hierarchique,
        localite_principale: user.geographic_access.primary_localite,
      },
    };

    reply.status(201).send(response);
  } catch (error) {
    console.error("Erreur lors de la création du projet:", error);
    reply.status(500).send({ error: "Erreur lors de la création du projet" });
  }
};

export const updateProjectWithGeographicAccess = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params as any;
    const { nom, description, localite_id } = request.body as any;
    const user = request.user as any;

    if (!nom || nom.trim() === "") {
      return reply.status(400).send({ error: "Nom de projet requis" });
    }

    const projet = await projetGeographicService.updateProjectForUser(
      parseInt(id),
      { nom, description, localite_id },
      user.niveau_hierarchique,
      user.localites
    );

    // Enregistrer l'action d'audit
    await logAuditAction(user.id, "update_project", projet.id, {
      nom: projet.nom,
      description: projet.description,
      localite: projet.localites?.valeur,
    });

    const response = {
      id: projet.id,
      nom: projet.nom,
      description: projet.description,
      date_creation: projet.date_creation,
      localite: projet.localites
        ? {
            type: projet.localites.type,
            valeur: projet.localites.valeur,
          }
        : null,
      updated_by: {
        niveau_hierarchique: user.niveau_hierarchique,
        localite_principale: user.geographic_access.primary_localite,
      },
    };

    reply.status(200).send(response);
  } catch (error: any) {
    if (error?.message?.includes("Accès interdit")) {
      return reply.status(403).send({ error: error.message });
    }
    console.error("Erreur lors de la mise à jour du projet:", error);
    reply
      .status(500)
      .send({ error: "Erreur lors de la mise à jour du projet" });
  }
};

export const deleteProjectWithGeographicAccess = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params as any;
    const user = request.user as any;

    // Seuls les administrateurs centraux peuvent supprimer des projets
    if (user.niveau_hierarchique !== 4) {
      return reply.status(403).send({
        error:
          "Seuls les administrateurs centraux peuvent supprimer des projets",
      });
    }

    await projetGeographicService.deleteProjectForUser(
      parseInt(id),
      user.niveau_hierarchique,
      user.localites
    );

    // Enregistrer l'action d'audit
    await logAuditAction(user.id, "delete_project", parseInt(id), {});

    reply.status(200).send({ success: true });
  } catch (error: any) {
    if (error?.message?.includes("Accès interdit")) {
      return reply.status(403).send({ error: error.message });
    }
    console.error("Erreur lors de la suppression du projet:", error);
    reply
      .status(500)
      .send({ error: "Erreur lors de la suppression du projet" });
  }
};

export const getProjectStatsWithGeographicAccess = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const user = request.user as any;

    const stats = await projetGeographicService.getProjectStatsForUser(
      user.niveau_hierarchique,
      user.localites
    );

    const response = {
      ...stats,
      access_info: {
        niveau_utilisateur: user.niveau_hierarchique,
        localite_principale: user.geographic_access.primary_localite,
        scope: user.geographic_access.can_access_all ? "global" : "restricted",
        localites_accessibles:
          user.geographic_access.accessible_localites.length,
      },
    };

    reply.status(200).send(response);
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    reply
      .status(500)
      .send({ error: "Erreur lors de la récupération des statistiques" });
  }
};

export default {
  getProjectsWithGeographicAccess,
  getProjectByIdWithGeographicAccess,
  createProjectWithGeographicAccess,
  updateProjectWithGeographicAccess,
  deleteProjectWithGeographicAccess,
  getProjectStatsWithGeographicAccess,
};
