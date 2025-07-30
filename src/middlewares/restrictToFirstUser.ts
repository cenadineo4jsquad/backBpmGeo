import { FastifyRequest, FastifyReply } from "fastify";
import pool from "../config/pool";

export const restrictToFirstUser = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  // Protection contre undefined (cas multipart/form-data)
  const body = request.body ?? {};
  const { projet_id } = body as any;
  const userId = (request.user as { utilisateur_id?: number }).utilisateur_id;

  if (!projet_id) {
    // Si projet_id absent, on laisse passer (ou adapte selon ta logique)
    request.log &&
      request.log.info(
        "[DEBUG] restrictToFirstUser: pas de projet_id, passage autorisé"
      );
    return;
  }

  const query = `
    SELECT utilisateur_id 
    FROM taches t 
    JOIN etapes e ON t.etape_id = e.id 
    WHERE e.projet_id = $1 AND e.ordre = 1
  `;

  const result = await pool.query(query, [projet_id]);

  if (!result.rows.length || result.rows[0].utilisateur_id !== userId) {
    request.log &&
      request.log.warn(
        { userId, projet_id },
        "[DEBUG] restrictToFirstUser: accès refusé, utilisateur non autorisé"
      );
    return reply
      .code(403)
      .send({ error: "Seul l’utilisateur de l’étape 1 peut extraire" });
  }
};
