import { Pool } from "pg";

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: "localhost",
  database: process.env.DB_NAME || "geobpm",
  password: "password",
  port: 5432,
});

export const autocompleteLocalities = async (type: string, term: string) => {
  if (!["departement", "arrondissement"].includes(type)) {
    throw new Error("Invalid locality type");
  }

  const query = `
    SELECT valeur
    FROM localites
    WHERE type = $1 AND valeur ILIKE $2
    ORDER BY valeur
    LIMIT 10;
  `;

  const result = await pool.query(query, [type, `%${term}%`]);
  return result.rows.map((row) => row.valeur);
};
