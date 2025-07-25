import { FastifyError, FastifyReply, FastifyRequest } from "fastify";

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  if (error.statusCode && error.message) {
    reply.status(error.statusCode).send({ error: error.message });
  } else {
    reply.status(500).send({ error: "Server error" });
  }
}
