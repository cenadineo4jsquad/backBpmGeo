import { Pool } from "pg";
import bcrypt from "bcrypt";

const pool = new Pool({
  user: process.env.DB_USER || "Cenadi-Squad",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "geobpm",
  password: process.env.DB_PASSWORD || "",
  port: parseInt(process.env.DB_PORT ?? "5432", 10),
});

async function createAdmin() {
  const email = "admin@example.com";
  const mot_de_passe = "motdepassefort"; // À changer en prod !
  const hash = await bcrypt.hash(mot_de_passe, 10);

  const query = `
    INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, niveau_hierarchique, localite_id)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id
  `;
  const values = [
    "Admin",
    "Super",
    email,
    hash,
    4, // Niveau hiérarchique 4 pour l'administration centrale
    1, // Localité par défaut (à adapter si nécessaire)
  ];

  try {
    const { rows } = await pool.query(query, values);
    console.log("Admin créé avec l'id :", rows[0].id);
  } catch (err) {
    if (err instanceof Error) {
      console.error("Erreur création admin :", err.message);
    } else {
      console.error("Erreur création admin :", err);
    }
  } finally {
    await pool.end();
  }
}

createAdmin();
