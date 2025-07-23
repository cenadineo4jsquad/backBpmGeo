import { FastifyRequest, FastifyReply } from "fastify";

export const restrictToAdmin = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const user = request.user as { niveau_hierarchique?: number };
  if (user.niveau_hierarchique !== 4) {
    return reply.code(403).send({ error: "Réservé aux administrateurs" });
  }
};
