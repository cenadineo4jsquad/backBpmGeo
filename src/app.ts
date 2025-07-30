import fastify from "fastify";
import { Pool } from "pg";
import fastifyJwt from "@fastify/jwt";
import fastifyMultipart from "@fastify/multipart";
import routes from "./routes";
import config from "./config";
import pool from "./config/pool";

const app = fastify({ logger: true });

// const pool = new Pool({
//   user: config.db.user,
//   host: config.db.host,
//   database: config.db.database,
//   password: config.db.password,
//   port: config.db.port,
// });

console.log("[DEBUG][pg] Pool config:", config.db);

app.register(fastifyJwt, { secret: config.jwt.secret });
app.register(fastifyMultipart);

// Register routes
routes.forEach((route) => {
  app.register(route);
});

// Error handling
app.setErrorHandler((error, request, reply) => {
  app.log.error(error);
  reply.status(500).send({ error: "Something went wrong" });
});

// Start the server
const start = async () => {
  try {
    await app.listen({
      port:
        typeof config.port === "string"
          ? parseInt(config.port, 10)
          : config.port,
    });
    app.log.info(`Server listening on ${(app.server.address() as any).port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
