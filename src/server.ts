import fastify from "fastify";
import { Pool } from "pg";
import fastifyJwt from "@fastify/jwt";
import fastifyMultipart from "@fastify/multipart"; // Assure-toi que le package est bien installé
import routes from "./routes";
import config from "./config";

const server = fastify({ logger: true });

const pool = new Pool({
  user: config.db.user,
  host: config.db.host,
  database: config.db.database,
  password: config.db.password,
  port: config.db.port,
});

server.register(fastifyJwt, { secret: config.jwt.secret });
server.register(fastifyMultipart);

// Register routes
routes.forEach((route: any) => {
  server.register(route);
});

// Route de santé
server.get('/health', async (request, reply) => {
  // Vérification de la base de données
  let dbStatus = 'unknown';
  try {
    await pool.query('SELECT 1');
    dbStatus = 'connected';
  } catch {
    dbStatus = 'error';
  }
  reply.send({
    status: 'ok',
    timestamp: new Date().toISOString(),
    node: process.version,
    uptime: process.uptime(),
    db: dbStatus,
    env: process.env.NODE_ENV || 'unknown',
    port: config.port,
  });
});

// Error handling
server.setErrorHandler((error, request, reply) => {
  request.log.error({
    message: error.message,
    stack: error.stack,
    url: request.url,
    method: request.method,
    body: request.body,
    params: request.params,
    query: request.query,
  }, "[SERVER ERROR]");
  reply.status(500).send({
    error: "Internal Server Error",
    details: error.message,
    url: request.url,
    method: request.method,
    timestamp: new Date().toISOString(),
  });
});

// Start the server
const start = async () => {
  try {
    await server.listen({ port: Number(config.port), host: "0.0.0.0" });
    const os = require("os");
    const interfaces = os.networkInterfaces();
    let ipList = ["localhost"];
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === "IPv4" && !iface.internal) {
          ipList.push(iface.address);
        }
      }
    }
    server.log.info("==================== SERVEUR DÉMARRÉ ====================");
    ipList.forEach(ip => {
      server.log.info(`➡️  API disponible sur http://${ip}:${config.port}`);
    });
    server.log.info("=========================================================");
  } catch (err) {
    const error = err as Error;
    server.log.error({
      message: error.message,
      stack: error.stack
    }, "[SERVER START ERROR]");
    process.exit(1);
  }
};

start();
