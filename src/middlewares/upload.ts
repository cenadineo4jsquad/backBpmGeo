import { FastifyRequest, FastifyReply } from "fastify";

export async function validateUpload(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const files = (request as any).files || [];
  for (const file of files) {
    if (
      !["image/png", "image/jpeg", "application/pdf"].includes(file.mimetype)
    ) {
      return reply.status(400).send({ error: "Type de fichier non autorisé" });
    }
    if (file.size > 10 * 1024 * 1024) {
      return reply.status(400).send({ error: "Fichier trop volumineux" });
    }
  }
}
