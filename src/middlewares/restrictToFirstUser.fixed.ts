import { FastifyRequest, FastifyReply } from "fastify";
import pool from "../config/pool";

export const restrictToFirstUser = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const userId = (request.user as any)?.id;
    let projet_id = undefined;

    // Pour les requêtes multipart/form-data, récupérer projet_id depuis l'URL ou headers
    if (request.headers['content-type']?.includes('multipart/form-data')) {
      console.log("[DEBUG] restrictToFirstUser: Requête multipart détectée");
      
      // Méthode 1: Paramètre URL (?projet_id=22)
      if (request.query && (request.query as any).projet_id) {
        projet_id = (request.query as any).projet_id;
        console.log("[DEBUG] restrictToFirstUser: projet_id trouvé dans URL:", projet_id);
      }
      
      // Méthode 2: Header personnalisé
      if (!projet_id && request.headers['x-projet-id']) {
        projet_id = request.headers['x-projet-id'];
        console.log("[DEBUG] restrictToFirstUser: projet_id trouvé dans header:", projet_id);
      }
    } else {
      // Pour les autres types de requêtes, utiliser request.body
      const body = request.body ?? {};
      projet_id = (body as any).projet_id;
      console.log("[DEBUG] restrictToFirstUser: projet_id depuis body:", projet_id);
    }

    // Si projet_id absent, laisser passer (le handler principal gérera l'erreur)
    if (!projet_id) {
      console.log("[DEBUG] restrictToFirstUser: Pas de projet_id, passage autorisé");
      return;
    }

    console.log("[DEBUG] restrictToFirstUser: Vérification pour userId:", userId, "projet_id:", projet_id);

    // Logique de vérification existante - Adapter selon votre structure DB
    const query = `
      SELECT utilisateur_id 
      FROM workflows w
      JOIN etapes_workflow ew ON w.etape_id = ew.id 
      WHERE ew.projet_id = $1 AND ew.ordre = 1
      LIMIT 1
    `;

    const result = await pool.query(query, [projet_id]);

    if (!result.rows.length) {
      console.log("[DEBUG] restrictToFirstUser: Aucune étape 1 trouvée pour ce projet");
      return; // Laisser passer, le handler principal gérera
    }

    const firstStepUserId = result.rows[0].utilisateur_id;
    if (firstStepUserId !== userId) {
      console.warn("[DEBUG] restrictToFirstUser: Accès refusé", { userId, firstStepUserId, projet_id });
      return reply
        .code(403)
        .send({ error: "Seul l'utilisateur de l'étape 1 peut effectuer cette action" });
    }
    
    console.log("[DEBUG] restrictToFirstUser: Accès autorisé");
  } catch (error) {
    console.error("[DEBUG] restrictToFirstUser: Erreur:", error);
    return reply
      .code(500)
      .send({ error: "Erreur de vérification des permissions" });
  }
};
