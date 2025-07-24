import { Pool } from "pg";

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: "localhost",
  database: process.env.DB_NAME || "geobpm",
  password: "password",
  port: 5432,
});

export const isPointInCameroon = async (
  longitude: number,
  latitude: number
): Promise<boolean> => {
  const query = `
    SELECT ST_Contains(
      (SELECT geom FROM cameroon_boundary LIMIT 1),
      ST_SetSRID(ST_MakePoint($1, $2), 4326)
    ) AS is_within;
  `;
  const result = await pool.query(query, [longitude, latitude]);
  return result.rows[0].is_within;
};

export const validateCoordinates = async (coordinates: {
  longitude: number;
  latitude: number;
}): Promise<boolean> => {
  return await isPointInCameroon(coordinates.longitude, coordinates.latitude);
};
