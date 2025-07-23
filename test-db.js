const { Pool } = require("pg");
require("dotenv").config();

const dbUrl = process.env.DATABASE_URL;
const pool = new Pool({ connectionString: dbUrl });

pool.query("SELECT 1", (err, res) => {
  if (err) {
    console.error("Erreur connexion:", err.message);
  } else {
    console.log("Connexion OK:", res.rows);
  }
  pool.end();
});
