import { FastifyRequest, FastifyReply } from "fastify";
import { Pool } from "pg";

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "geospatial_db",
  password: "password",
  port: 5432,
});

export const restrictToFirstUser = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { projet_id } = request.body as any;
  const userId = (request.user as { utilisateur_id?: number }).utilisateur_id;

  const query = `
    SELECT utilisateur_id 
    FROM taches t 
    JOIN etapes e ON t.etape_id = e.id 
    WHERE e.projet_id = $1 AND e.ordre = 1
  `;

  const result = await pool.query(query, [projet_id]);

  if (!result.rows.length || result.rows[0].utilisateur_id !== userId) {
    return reply
      .code(403)
      .send({ error: "Seul l’utilisateur de l’étape 1 peut extraire" });
  }
};
