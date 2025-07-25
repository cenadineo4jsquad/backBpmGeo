import fs from "fs";
import path from "path";
import { Pool } from "pg";
const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "geobpm",
  password: process.env.DB_PASSWORD || "password",
  port: parseInt(process.env.DB_PORT ?? "5432", 10),
});

export async function getAuditLogs({
  projet_id,
  utilisateur_id,
  date_debut,
  date_fin,
  niveau_hierarchique,
  localite,
}: any) {
  let query = `SELECT * FROM audit_logs`;
  const where: string[] = [];
  const params: any[] = [];
  if (projet_id) {
    where.push(`projet_id = $${params.length + 1}`);
    params.push(projet_id);
  }
  if (utilisateur_id) {
    where.push(`utilisateur_id = $${params.length + 1}`);
    params.push(utilisateur_id);
  }
  if (date_debut) {
    where.push(`date_action >= $${params.length + 1}`);
    params.push(date_debut);
  }
  if (date_fin) {
    where.push(`date_action <= $${params.length + 1}`);
    params.push(date_fin);
  }
  // Filtre localite pour niveau 3
  if (niveau_hierarchique === 3 && localite) {
    where.push(`details->>'localite' = $${params.length + 1}`);
    params.push(localite);
  }
  if (where.length) query += ` WHERE ` + where.join(" AND ");
  query += " ORDER BY date_action DESC";
  const { rows } = await pool.query(query, params);
  // Parse le champ details (JSON)
  return rows.map((row) => ({
    ...row,
    details:
      typeof row.details === "string" ? JSON.parse(row.details) : row.details,
  }));
}

export async function logAuditAction(
  utilisateur_id: number,
  action: string,
  projet_id: number,
  details: any
) {
  const query = `INSERT INTO audit_logs (utilisateur_id, action, projet_id, details, date_action)
    VALUES ($1, $2, $3, $4, NOW())`;
  await pool.query(query, [
    utilisateur_id,
    action,
    projet_id,
    JSON.stringify(details),
  ]);
}

export async function exportAuditLogsPDF({
  projet_id,
  utilisateur_id,
  date_debut,
  date_fin,
  niveau_hierarchique,
  localite,
}: any): Promise<string> {
  const logs = await getAuditLogs({
    projet_id,
    utilisateur_id,
    date_debut,
    date_fin,
    niveau_hierarchique,
    localite,
  });
  // Ici, générez le PDF avec une lib comme pdfkit ou jsPDF
  // Exemple fictif :
  const fileName = `audit_report_${date_fin || Date.now()}.pdf`;
  const filePath = path.join(__dirname, "../../exports", fileName);
  fs.writeFileSync(filePath, "PDF CONTENT"); // Remplacez par le vrai contenu PDF
  return filePath;
}