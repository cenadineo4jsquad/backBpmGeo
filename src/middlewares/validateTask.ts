import { FastifyRequest, FastifyReply } from "fastify";

export async function validateTask(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { statut, commentaire } = request.body as any;
  if (statut === "Rejeté" && !commentaire) {
    return reply
      .status(400)
      .send({ error: "Commentaire obligatoire pour un rejet" });
  }
}
