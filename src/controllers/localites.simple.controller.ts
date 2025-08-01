// Contrôleur simplifié pour les localités géographiques
import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../lib/prisma";

/**
 * Récupère les statistiques des localités
 */
export const getLocalitesStats = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const stats = await Promise.all([
      prisma.localites.count({ where: { type: "region" } }),
      prisma.localites.count({ where: { type: "departement" } }),
      prisma.localites.count({ where: { type: "arrondissement" } }),
    ]);

    reply.send({
      regions: stats[0],
      departements: stats[1],
      arrondissements: stats[2],
      total: stats[0] + stats[1] + stats[2],
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    reply.status(500).send({ error: "Erreur serveur" });
  }
};

/**
 * Recherche simple d'arrondissements par département
 */
export const searchArrondissementsByDepartement = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { departement } = request.params as { departement: string };

  try {
    // Recherche les arrondissements qui contiennent le nom du département
    const arrondissements = await prisma.localites.findMany({
      where: {
        type: "arrondissement",
        valeur: { contains: departement, mode: "insensitive" },
      },
      orderBy: { valeur: "asc" },
      take: 50, // Limiter à 50 résultats
    });

    reply.send({
      departement,
      arrondissements: arrondissements.map((a) => ({
        id: a.id,
        nom: a.valeur,
      })),
      total: arrondissements.length,
    });
  } catch (error) {
    console.error("Erreur lors de la recherche d'arrondissements:", error);
    reply.status(500).send({ error: "Erreur serveur" });
  }
};

/**
 * Récupère tous les départements disponibles
 */
export const getAllDepartements = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const departements = await prisma.localites.findMany({
      where: { type: "departement" },
      orderBy: { valeur: "asc" },
    });

    reply.send({
      departements: departements.map((d) => ({
        id: d.id,
        nom: d.valeur,
      })),
      total: departements.length,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des départements:", error);
    reply.status(500).send({ error: "Erreur serveur" });
  }
};

/**
 * Récupère toutes les régions disponibles
 */
export const getAllRegionsSimple = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const regions = await prisma.localites.findMany({
      where: { type: "region" },
      orderBy: { valeur: "asc" },
    });

    reply.send({
      regions: regions.map((r) => ({
        id: r.id,
        nom: r.valeur,
      })),
      total: regions.length,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des régions:", error);
    reply.status(500).send({ error: "Erreur serveur" });
  }
};

/**
 * Recherche de localités par terme
 */
export const searchLocalitesSimple = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { q, type } = request.query as { q?: string; type?: string };

  if (!q || q.length < 2) {
    return reply.status(400).send({
      error: "Le terme de recherche doit contenir au moins 2 caractères",
    });
  }

  try {
    const whereClause: any = {
      valeur: { contains: q, mode: "insensitive" },
    };

    if (type && ["region", "departement", "arrondissement"].includes(type)) {
      whereClause.type = type;
    }

    const results = await prisma.localites.findMany({
      where: whereClause,
      orderBy: [{ type: "asc" }, { valeur: "asc" }],
      take: 100, // Limiter à 100 résultats
    });

    reply.send({
      query: q,
      type: type || "all",
      results: results.map((r) => ({
        id: r.id,
        nom: r.valeur,
        type: r.type,
      })),
      total: results.length,
    });
  } catch (error) {
    console.error("Erreur lors de la recherche:", error);
    reply.status(500).send({ error: "Erreur serveur" });
  }
};

/**
 * Récupère les localités accessibles pour l'utilisateur connecté (version simplifiée)
 */
export const getMyLocalitesSimple = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const userRaw = request.user;
  if (!userRaw || typeof userRaw !== "object") {
    return reply.status(401).send({ error: "Non autorisé" });
  }

  const user = userRaw as { id: number; niveau_hierarchique: number };

  try {
    let localites: any[] = [];

    switch (user.niveau_hierarchique) {
      case 1: // Arrondissement - seulement son arrondissement
        const userWithLocalite = await prisma.utilisateurs.findUnique({
          where: { id: user.id },
          include: { localites: true },
        });

        if (userWithLocalite?.localites) {
          localites = [
            {
              id: userWithLocalite.localites.id,
              nom: userWithLocalite.localites.valeur,
              type: userWithLocalite.localites.type,
              niveau_acces: "arrondissement",
            },
          ];
        }
        break;

      case 2: // Département - tous les arrondissements de son département
        // Pour simplifier, on retourne toutes les localités de type arrondissement
        const arrondissements = await prisma.localites.findMany({
          where: { type: "arrondissement" },
          orderBy: { valeur: "asc" },
          take: 50,
        });

        localites = arrondissements.map((a) => ({
          id: a.id,
          nom: a.valeur,
          type: a.type,
          niveau_acces: "departement",
        }));
        break;

      case 3: // Région - tous les départements et arrondissements
        const deptEtArr = await prisma.localites.findMany({
          where: {
            type: { in: ["departement", "arrondissement"] },
          },
          orderBy: [{ type: "asc" }, { valeur: "asc" }],
          take: 100,
        });

        localites = deptEtArr.map((l) => ({
          id: l.id,
          nom: l.valeur,
          type: l.type,
          niveau_acces: "region",
        }));
        break;

      case 4: // Admin - toutes les localités
        const toutesLocalites = await prisma.localites.findMany({
          orderBy: [{ type: "asc" }, { valeur: "asc" }],
          take: 200,
        });

        localites = toutesLocalites.map((l) => ({
          id: l.id,
          nom: l.valeur,
          type: l.type,
          niveau_acces: "admin",
        }));
        break;
    }

    reply.send({
      user_id: user.id,
      niveau_hierarchique: user.niveau_hierarchique,
      localites,
      total: localites.length,
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des localités utilisateur:",
      error
    );
    reply.status(500).send({ error: "Erreur serveur" });
  }
};
