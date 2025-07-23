import { config as dotenvConfig } from "dotenv";

dotenvConfig();

const config = {
  port: process.env.PORT || 3000,
  db: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT ?? "5432", 10),
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "password",
    database: process.env.DB_NAME || "geospatial_db",
  },
  jwt: {
    secret: process.env.JWT_SECRET || "secret_key",
    expiresIn: process.env.JWT_EXPIRES_IN || "1h",
  },
  extraction: {
    confidenceThreshold: parseFloat(
      process.env.EXTRACTION_CONFIDENCE_THRESHOLD ?? "90"
    ),
    formats: (process.env.EXTRACTION_FORMATS || "png,jpeg,pdf").split(","),
    coordFormat: process.env.COORD_FORMAT || "decimal",
  },
};

export default config;
