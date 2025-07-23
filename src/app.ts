import fastify from 'fastify';
import { Pool } from 'pg';
import fastifyJwt from '@fastify/jwt';
import fastifyMultipart from '@fastify/multipart';
import routes from './routes';
import { config } from './config';

const app = fastify({ logger: true });

const pool = new Pool({
  user: config.dbUser,
  host: config.dbHost,
  database: config.dbName,
  password: config.dbPassword,
  port: config.dbPort,
});

app.register(fastifyJwt, { secret: config.jwtSecret });
app.register(fastifyMultipart);

// Register routes
routes.forEach(route => {
  app.register(route);
});

// Error handling
app.setErrorHandler((error, request, reply) => {
  app.log.error(error);
  reply.status(500).send({ error: 'Something went wrong' });
});

// Start the server
const start = async () => {
  try {
    await app.listen(config.port);
    app.log.info(`Server listening on ${app.server.address().port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();