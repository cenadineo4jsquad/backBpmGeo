// Handler stub : historique des commentaires d'un titre foncier
import { AuditLogsModel } from "../models/auditLogs.model";
import { PrismaClient } from "@prisma/client";

export const getHistorique = async (request: any, reply: any) => {
  // Récupère l'historique des commentaires pour un titre foncier (via projet_id)
  const { id } = request.params;
  const prisma = new PrismaClient();
  try {
    // On récupère le titre foncier pour obtenir le projet_id
    const titre = await prisma.titres_fonciers.findUnique({
      where: { id: Number(id) },
    });
    if (!titre) {
      return reply.status(404).send({ error: "Titre foncier non trouvé" });
    }
    // On récupère les logs d'audit liés à ce projet
    const auditModel = new AuditLogsModel();
    // Correction : ne passer projet_id que s'il est défini (number), sinon undefined
    const logs = await auditModel.getAuditLogs({
      projet_id:
        typeof titre.projet_id === "number" ? titre.projet_id : undefined,
    });
    // On filtre pour ne garder que les logs avec commentaire ou action pertinente
    const commentaires = logs
      .filter(
        (log: any) =>
          log.details &&
          (log.details.commentaire ||
            log.action?.toLowerCase().includes("commentaire"))
      )
      .map((log: any) => ({
        id: log.id,
        utilisateur_id: log.utilisateur_id,
        action: log.action,
        commentaire: log.details?.commentaire || null,
        details: log.details,
        date_action: log.date_action,
      }));
    reply.send({ commentaires });
  } catch (error) {
    reply
      .status(500)
      .send({
        error:
          "Erreur lors de la récupération de l'historique des commentaires",
      });
  } finally {
    await prisma.$disconnect();
  }
};

// Handler stub : titres en attente pour l'utilisateur connecté

export const getTitresEnAttente = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  // TODO: Implémenter la récupération des titres en attente pour l'utilisateur connecté
  reply.send({ titres: [], info: "Stub getTitresEnAttente" });
};
export const createTitreFoncier = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const user = request.user as any;
    // Seuls niveau 4 ou niveau 1 peuvent créer
    if (!(user.niveau_hierarchique === 4 || user.niveau_hierarchique === 1)) {
      return reply.status(403).send({ error: "Accès interdit" });
    }
    const data = request.body as any;
    // Validation minimale des champs requis
    if (
      !data.projet_id ||
      !data.proprietaire ||
      !data.coordonnees_gps ||
      !data.localite ||
      typeof data.surface_m2 !== "number" ||
      typeof data.perimetre_m !== "number"
    ) {
      return reply.status(400).send({ error: "Données invalides" });
    }
    // Mapping pour la BDD
    const mappedData = {
      ...data,
      superficie: data.surface_m2,
      perimetre: data.perimetre_m,
    };
    const titre = await titreFoncierService.createTitreFoncier(
      mappedData,
      user.id
    );
    // Format strict selon la doc
    const titreFormate = {
      id: titre.id,
      projet_id: titre.projet_id,
      proprietaire: titre.proprietaire,
      surface_m2:
        titre.superficie !== undefined ? Number(titre.superficie) : null,
      perimetre_m:
        titre.perimetre !== undefined ? Number(titre.perimetre) : null,
      coordonnees_gps: titre.coordonnees_gps,
      localite: titre.localite,
    };
    reply.status(201).send(titreFormate);
  } catch (error) {
    reply
      .status(500)
      .send({ error: "Erreur lors de la création du titre foncier" });
  }
};

export const deleteTitreFoncier = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params as any;
    if (!id || isNaN(Number(id))) {
      return reply.status(400).send({ error: "ID invalide" });
    }
    // Vérifier existence
    const titre = await titreFoncierService.findTitreFoncierById(Number(id));
    if (!titre) {
      return reply.status(404).send({ error: "Titre foncier non trouvé" });
    }
    await titreFoncierService.deleteTitreFoncier(Number(id));
    return reply.status(200).send({ success: true });
  } catch (error: any) {
    if (error.statusCode === 401) {
      return reply.status(401).send({ error: "Non autorisé" });
    }
    if (error.statusCode === 403) {
      return reply.status(403).send({ error: "Réservé aux administrateurs" });
    }
    return reply
      .status(500)
      .send({ error: "Erreur lors de la suppression du titre foncier" });
  }
};

export const getTitresGeojson = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const user = request.user as any;
    let geojson;

    // Utiliser les informations d'accès géographique du middleware d'authentification
    if (user.geographic_access.can_access_all) {
      // Niveau central - accès à tout
      geojson = await titreFoncierService.getTitresGeojson();
    } else {
      // Autres niveaux - accès selon hiérarchie
      geojson = await titreFoncierService.getTitresGeojson(
        user.localites,
        user.niveau_hierarchique
      );
    }

    // Ajouter des métadonnées d'accès au GeoJSON
    const response = {
      ...geojson,
      metadata: {
        user_access: {
          niveau_hierarchique: user.niveau_hierarchique,
          localite_principale: user.geographic_access.primary_localite,
          features_count: geojson.features.length,
          access_scope: user.geographic_access.can_access_all
            ? "global"
            : "restricted",
        },
      },
    };

    reply.status(200).send(response);
  } catch (error) {
    reply
      .status(500)
      .send({ error: "Erreur lors de la récupération des titres GeoJSON" });
  }
};

import { FastifyRequest, FastifyReply } from "fastify";
import { TitreFoncierService } from "../services/titreFoncier.service";

const titreFoncierService = new TitreFoncierService();

export const getTitresFoncier = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const user = request.user as any;
    let titres;

    // Utiliser les informations d'accès géographique du middleware d'authentification
    if (user.geographic_access.can_access_all) {
      // Niveau central - accès à tous les titres
      titres = await titreFoncierService.findAllTitresFoncier();
    } else {
      // Autres niveaux - accès selon hiérarchie géographique
      titres = await titreFoncierService.getTitresFoncier(
        user.localites,
        user.niveau_hierarchique
      );
    }

    // Format strict selon la doc
    const titresFormates = (titres || []).map((t: any) => ({
      id: t.id,
      projet_id: t.projet_id,
      proprietaire: t.proprietaire,
      surface_m2: t.superficie !== undefined ? Number(t.superficie) : null,
      perimetre_m: t.perimetre !== undefined ? Number(t.perimetre) : null,
      coordonnees_gps: t.coordonnees_gps,
      localite: t.localite,
    }));

    // Ajouter des informations de contexte d'accès dans la réponse
    const response = {
      titres: titresFormates,
      access_info: {
        niveau_utilisateur: user.niveau_hierarchique,
        localite_principale: user.geographic_access.primary_localite,
        total_accessible: titresFormates.length,
        localites_accessibles:
          user.geographic_access.accessible_localites.length,
      },
    };

    reply.status(200).send(response);
  } catch (error) {
    reply
      .status(500)
      .send({ error: "Erreur lors de la récupération des titres fonciers" });
  }
};

export const getAccessStatistics = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const user = request.user as any;
    const stats = await titreFoncierService.getAccessStatistics(
      user.niveau_hierarchique,
      user.localites
    );

    reply.status(200).send(stats);
  } catch (error) {
    reply.status(500).send({
      error: "Erreur lors de la récupération des statistiques d'accès",
    });
  }
};

export const getAccessibleLocalites = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const user = request.user as any;
    const localites = await titreFoncierService.getAccessibleLocalites(
      user.niveau_hierarchique,
      user.localites
    );

    reply.status(200).send({
      total: localites.length,
      localites: localites,
    });
  } catch (error) {
    reply.status(500).send({
      error: "Erreur lors de la récupération des localités accessibles",
    });
  }
};

export const getTitreFoncierById = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { id } = request.params as any;
  const user = request.user as any;
  try {
    const titre = await titreFoncierService.getTitreFoncierById(Number(id));
    if (!titre) {
      return reply.status(404).send({ error: "Titre foncier non trouvé" });
    }
    // Filtrage localité pour niveaux 1–2 (robuste)
    if (user.niveau_hierarchique === 1 || user.niveau_hierarchique === 2) {
      let titreLocalite = titre.localite;
      let userLocalite = user.localite || user.localites;

      // Si localite est un string JSON, parser
      if (typeof titreLocalite === "string") {
        try {
          titreLocalite = JSON.parse(titreLocalite);
        } catch {}
      }
      if (typeof userLocalite === "string") {
        try {
          userLocalite = JSON.parse(userLocalite);
        } catch {}
      }

      if (
        !titreLocalite ||
        !userLocalite ||
        titreLocalite.valeur !== userLocalite.valeur ||
        titreLocalite.type !== userLocalite.type
      ) {
        return reply.status(403).send({ error: "Accès interdit" });
      }
    }
    // Format strict selon la doc
    const titreFormate = {
      id: titre.id,
      projet_id: titre.projet_id,
      proprietaire: titre.proprietaire,
      surface_m2:
        titre.superficie !== undefined ? Number(titre.superficie) : null,
      perimetre_m:
        titre.perimetre !== undefined ? Number(titre.perimetre) : null,
      coordonnees_gps: titre.coordonnees_gps,
      localite: titre.localite,
    };
    reply.status(200).send(titreFormate);
  } catch (error) {
    reply
      .status(500)
      .send({ error: "Erreur lors de la récupération du titre foncier" });
  }
};

export const updateTitreFoncier = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { id } = request.params as any;
  const user = request.user as any;
  // Seuls niveaux 3-4 ou n+1 peuvent modifier
  if (!(user.niveau_hierarchique === 3 || user.niveau_hierarchique === 4)) {
    return reply.status(403).send({ error: "Accès interdit" });
  }
  const body = request.body as any;
  // Validation minimale des champs requis
  if (
    !body.proprietaire ||
    !body.coordonnees_gps ||
    !body.localite ||
    typeof body.surface_m2 !== "number" ||
    typeof body.perimetre_m !== "number"
  ) {
    return reply.status(400).send({ error: "Données invalides" });
  }
  // Charger le titre existant pour récupérer projet_id
  const titre = await titreFoncierService.getTitreFoncierById(Number(id));
  if (!titre) {
    return reply.status(404).send({ error: "Titre foncier non trouvé" });
  }
  // Mapping pour la BDD
  const data = {
    id: Number(id),
    projet_id: titre.projet_id,
    proprietaire: body.proprietaire,
    coordonnees_gps: body.coordonnees_gps,
    superficie: body.surface_m2,
    perimetre: body.perimetre_m,
    localite: body.localite,
  };
  try {
    const updatedTitre = await titreFoncierService.updateTitreFoncier(
      Number(id),
      data,
      user.id
    );
    if (!updatedTitre) {
      return reply.status(404).send({ error: "Titre foncier non trouvé" });
    }
    // Appel à l’API Flask (POST /api/extraction/update_external)
    try {
      await fetch("http://flask-api/extraction/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titre_id: updatedTitre.id,
          donnees: {
            proprietaire: updatedTitre.proprietaire,
            surface_m2: updatedTitre.superficie,
            perimetre_m: updatedTitre.perimetre,
            coordonnees_gps: updatedTitre.coordonnees_gps,
            localite: updatedTitre.localite,
          },
        }),
      });
    } catch (err) {
      return reply
        .status(500)
        .send({ error: "Erreur lors de l’envoi à l’API Flask" });
    }
    // Format strict selon la doc
    const titreFormate = {
      id: updatedTitre.id,
      projet_id: updatedTitre.projet_id,
      proprietaire: updatedTitre.proprietaire,
      surface_m2:
        updatedTitre.superficie !== undefined
          ? Number(updatedTitre.superficie)
          : null,
      perimetre_m:
        updatedTitre.perimetre !== undefined
          ? Number(updatedTitre.perimetre)
          : null,
      coordonnees_gps: updatedTitre.coordonnees_gps,
      localite: updatedTitre.localite,
    };
    reply.status(200).send(titreFormate);
  } catch (error) {
    reply
      .status(500)
      .send({ error: "Erreur lors de la mise à jour du titre foncier" });
  }
};
