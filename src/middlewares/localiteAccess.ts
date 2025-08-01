import { FastifyRequest, FastifyReply } from "fastify";
import { GeographicAccessService } from "../services/geographicAccess.service";
import pool from "../config/pool";

// Middleware pour restreindre l'accès aux données selon la localité de l'utilisateur
export async function restrictToUserLocalite(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const user = (request as any).user;

  if (!user) {
    return reply.status(401).send({ error: "Utilisateur non authentifié" });
  }

  // Les administrateurs centraux (niveau 4) ont accès à tout
  if (user.niveau_hierarchique === 4) {
    return; // Passer au middleware suivant
  }

  // Vérifier que l'utilisateur a une localité définie
  if (!user.localites || !user.localites.valeur) {
    return reply.status(403).send({
      error: "Accès interdit - Localité non définie pour cet utilisateur",
    });
  }

  // Ajouter les informations d'accès géographique à la requête
  const geographicAccess = new GeographicAccessService(pool);

  try {
    // Récupérer les localités accessibles pour cet utilisateur
    const accessibleLocalites = await geographicAccess.getAccessibleLocalites(
      user.niveau_hierarchique,
      user.localites
    );

    // Ajouter les informations d'accès à la requête pour les contrôleurs
    (request as any).userAccess = {
      niveau_hierarchique: user.niveau_hierarchique,
      localite_principale: user.localites.valeur,
      accessible_localites: accessibleLocalites,
      can_access_all: false,
    };
  } catch (error) {
    console.error(
      "Erreur lors de la vérification des accès géographiques:",
      error
    );
    return reply
      .status(500)
      .send({ error: "Erreur de vérification des accès" });
  }
}

// Middleware pour vérifier l'accès à une localité spécifique
export async function checkLocaliteAccess(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const user = (request as any).user;
  const userAccess = (request as any).userAccess;

  // Les administrateurs centraux ont accès à tout
  if (user?.niveau_hierarchique === 4) {
    return;
  }

  // Extraire la localité demandée depuis les paramètres de la route
  const { localite, departement, region, arrondissement } =
    request.params as any;
  const targetLocalite = localite || departement || region || arrondissement;

  if (targetLocalite && userAccess) {
    // Vérifier si l'utilisateur a accès à cette localité
    const hasAccess = userAccess.accessible_localites.includes(targetLocalite);

    if (!hasAccess) {
      return reply.status(403).send({
        error: `Accès interdit à la localité '${targetLocalite}'. Vous n'avez accès qu'à: ${userAccess.accessible_localites.join(
          ", "
        )}`,
      });
    }
  }
}

// Middleware pour filtrer les données selon l'accès utilisateur
export function filterDataByUserAccess<T extends { localite?: string }>(
  data: T[],
  userAccess: any
): T[] {
  // Si l'utilisateur a accès à tout, retourner toutes les données
  if (!userAccess || userAccess.can_access_all) {
    return data;
  }

  // Filtrer les données selon les localités accessibles
  return data.filter((item) => {
    if (!item.localite) return false;
    return userAccess.accessible_localites.includes(item.localite);
  });
}

// Middleware pour les projets - vérifie l'accès selon la localité du projet
export async function restrictToProjectLocalite(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const user = (request as any).user;
  const { id } = request.params as any;

  // Les administrateurs centraux ont accès à tout
  if (user?.niveau_hierarchique === 4) {
    return;
  }

  if (id) {
    try {
      const { PrismaClient } = require("@prisma/client");
      const prisma = new PrismaClient();

      // Récupérer le projet avec sa localité
      const projet = await prisma.projets.findUnique({
        where: { id: parseInt(id) },
        include: { localites: true },
      });

      if (!projet) {
        return reply.status(404).send({ error: "Projet non trouvé" });
      }

      // Vérifier l'accès à la localité du projet
      if (projet.localites) {
        const geographicAccess = new GeographicAccessService(pool);
        const hasAccess = await geographicAccess.hasAccessToLocalite(
          user.niveau_hierarchique,
          user.localites,
          projet.localites.valeur
        );

        if (!hasAccess) {
          return reply.status(403).send({
            error: `Accès interdit au projet '${projet.nom}' - Localité: ${projet.localites.valeur}`,
          });
        }
      }

      await prisma.$disconnect();
    } catch (error) {
      console.error("Erreur lors de la vérification d'accès au projet:", error);
      return reply
        .status(500)
        .send({ error: "Erreur de vérification des accès" });
    }
  }
}

export default {
  restrictToUserLocalite,
  checkLocaliteAccess,
  filterDataByUserAccess,
  restrictToProjectLocalite,
};
