import { FastifyRequest, FastifyReply } from "fastify";

export async function validateUpload(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // Pour Fastify multipart, utiliser request.file() au lieu de request.files
    const isMultipart = request.headers["content-type"]?.includes(
      "multipart/form-data"
    );

    if (!isMultipart) {
      return reply
        .status(400)
        .send({ error: "Le contenu doit être multipart/form-data" });
    }

    // Validation basique - la validation détaillée sera faite dans le contrôleur
    // car request.file() consomme le stream et ne peut être appelé qu'une fois

    // Vérifier que la requête contient bien des données multipart
    const contentLength = request.headers["content-length"];
    if (!contentLength || parseInt(contentLength) === 0) {
      return reply.status(400).send({ error: "Aucun fichier détecté" });
    }

    // Vérifier la taille maximale (10 Mo)
    if (parseInt(contentLength) > 10 * 1024 * 1024) {
      return reply
        .status(400)
        .send({ error: "Fichier trop volumineux (max 10 Mo)" });
    }
  } catch (error) {
    console.error("Erreur dans validateUpload:", error);
    return reply.status(500).send({ error: "Erreur de validation du fichier" });
  }
}
