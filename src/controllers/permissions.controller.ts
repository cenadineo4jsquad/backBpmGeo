import { FastifyRequest, FastifyReply } from "fastify";
import { PermissionsModel } from "../models/permissions.model";
import { RoleModel } from "../models/roles.model";

const permissionsModel = new PermissionsModel();
const roleModel = new RoleModel();

export const assignPermission = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  // Vérification authentification et admin
  const userRaw = request.user;
  if (!userRaw || typeof userRaw !== "object") {
    return reply.status(401).send({ error: "Non autorisé" });
  }
  const user = userRaw as { niveau_hierarchique: number };
  if (user.niveau_hierarchique !== 4) {
    return reply.status(403).send({ error: "Réservé aux administrateurs" });
  }
  const { id } = request.params as any;
  const { action } = request.body as any;
  if (!action) {
    return reply.status(400).send({ error: "Champs requis manquants" });
  }
  // Vérifier que le rôle existe
  const role = await roleModel.getAllRoles();
  const roleFound = role.find((r: any) => r.id === Number(id));
  if (!roleFound) {
    return reply.status(404).send({ error: "Rôle non trouvé" });
  }
  // Vérifier si la permission existe déjà
  try {
    const already = await permissionsModel.permissionExists(Number(id), action);
    if (already) {
      return reply.status(400).send({ error: "Action déjà assignée" });
    }
    const perm = await permissionsModel.assignPermission(Number(id), action);
    const formatted = {
      id: perm.id,
      role_id: perm.role_id,
      action: perm.action,
    };
    reply.status(201).send(formatted);
  } catch (err: any) {
    if (err.message === "ALREADY_ASSIGNED") {
      return reply.status(400).send({ error: "Action déjà assignée" });
    }
    reply
      .status(500)
      .send({ error: "Erreur lors de l'attribution de la permission" });
  }
};
