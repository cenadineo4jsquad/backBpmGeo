import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import { GeographicAccessService } from "../services/geographicAccess.service";
import pool from "../config/pool";

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const authHeader = request.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return reply.status(401).send({ error: "Missing or invalid JWT" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    const { getUserById } = require("../services/utilisateurs.service");
    // Le token contient 'id' et non 'sub'
    const utilisateur = await getUserById(payload.id);
    if (!utilisateur) {
      return reply.status(401).send({ error: "Utilisateur non trouvé" });
    }

    // Préparer les informations d'accès géographique
    let accessibleLocalites: string[] = [];
    let canAccessAll = utilisateur.niveau_hierarchique === 4;

    if (!canAccessAll && utilisateur.localites) {
      try {
        const geographicAccess = new GeographicAccessService(pool);
        accessibleLocalites = await geographicAccess.getAccessibleLocalites(
          utilisateur.niveau_hierarchique,
          utilisateur.localites
        );
      } catch (error) {
        console.error("Erreur lors du calcul des accès géographiques:", error);
        // En cas d'erreur, restreindre l'accès à la localité principale uniquement
        accessibleLocalites = utilisateur.localites
          ? [utilisateur.localites.valeur]
          : [];
      }
    }

    // Inclure les rôles pour que restrictToAdmin fonctionne
    (request as any).user = {
      id: utilisateur.id,
      email: utilisateur.email,
      niveau_hierarchique: utilisateur.niveau_hierarchique,
      localites: utilisateur.localites,
      utilisateur_roles: utilisateur.utilisateur_roles || [],
      // Informations d'accès géographique directement disponibles
      geographic_access: {
        can_access_all: canAccessAll,
        accessible_localites: accessibleLocalites,
        primary_localite: utilisateur.localites?.valeur || null,
      },
    };
  } catch (err) {
    console.error("[AUTH] Erreur de vérification JWT:", err);
    return reply.status(401).send({ error: "Missing or invalid JWT" });
  }
}
