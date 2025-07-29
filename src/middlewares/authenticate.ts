import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const authHeader = request.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return reply.status(401).send({ error: "Missing or invalid JWT" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string);
    const { getUserById } = require("../services/utilisateurs.service");
    const utilisateur = await getUserById(payload.sub);
    if (!utilisateur) {
      return reply.status(401).send({ error: "Utilisateur non trouvé" });
    }
    (request as any).user = utilisateur;
  } catch (err) {
    return reply.status(401).send({ error: "Missing or invalid JWT" });
  }
}
