import { FastifyRequest, FastifyReply } from "fastify";
import { GeographicAccessService } from "../services/geographicAccess.service";
import pool from "../config/pool";

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const payload = await request.jwtVerify() as any;
    const { getUserById } = require("../services/utilisateurs.service");
    const utilisateur = await getUserById(payload.id);

    if (!utilisateur) {
      return reply.status(401).send({ error: "Utilisateur non trouvé" });
    }

    // Le reste de la logique pour attacher l'utilisateur et les droits reste identique
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
        accessibleLocalites = utilisateur.localites
          ? [utilisateur.localites.valeur]
          : [];
      }
    }

    let etape_courante_ordre = null;
    if (utilisateur.id) {
      try {
        const { rows: etapeRows } = await pool.query(
          `
          SELECT w.ordre, w.projet_id, w.etape_nom, ew.nom as nom_etape
          FROM workflows w
          LEFT JOIN etapes_workflow ew ON ew.projet_id = w.projet_id AND ew.ordre = w.ordre
          WHERE w.utilisateur_id = $1
          ORDER BY w.date_debut DESC
          LIMIT 1
        `,
          [utilisateur.id]
        );

        if (etapeRows.length > 0) {
          etape_courante_ordre = {
            ordre: etapeRows[0].ordre,
            projet_id: etapeRows[0].projet_id,
            etape_nom: etapeRows[0].etape_nom || etapeRows[0].nom_etape,
            nom_etape: etapeRows[0].nom_etape,
          };
        }
      } catch (error) {
        console.error(
          "Erreur lors de la récupération de l'étape courante:",
          error
        );
      }
    }

    (request as any).user = {
      id: utilisateur.id,
      email: utilisateur.email,
      niveau_hierarchique: utilisateur.niveau_hierarchique,
      localites: utilisateur.localites,
      utilisateur_roles: utilisateur.utilisateur_roles || [],
      etape_courante: etape_courante_ordre,
      geographic_access: {
        can_access_all: canAccessAll,
        accessible_localites: accessibleLocalites,
        primary_localite: utilisateur.localites?.valeur || null,
      },
    };

  } catch (err) {
    console.error("[AUTH] Erreur de vérification JWT:", err);
    return reply.status(401).send({ error: "Token invalide ou expiré" });
  }
}
