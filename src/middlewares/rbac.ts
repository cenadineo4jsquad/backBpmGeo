import { FastifyRequest, FastifyReply } from "fastify";

export function rbac(requiredLevel: number) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user;
    if (!user || typeof user.niveau_hierarchique !== "number") {
      return reply.status(401).send({ error: "Non autorisé" });
    }
    if (user.niveau_hierarchique < requiredLevel) {
      return reply
        .status(403)
        .send({ error: "Insufficient niveau_hierarchique or role" });
    }
  };
}
