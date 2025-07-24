import { FastifyRequest, FastifyReply } from "fastify";
import { UtilisateurRolesModel } from "../models/utilisateur_roles.model";
import { RoleModel } from "../models/roles.model";
import { UtilisateurModel } from "../models/utilisateurs.model";

const utilisateurRolesModel = new UtilisateurRolesModel();
const roleModel = new RoleModel();
const utilisateursModel = new UtilisateurModel();

export const assignUserToRole = async (
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
  const { utilisateur_id } = request.body as any;
  if (!utilisateur_id) {
    return reply.status(400).send({ error: "Champs requis manquants" });
  }
  // Vérifier que le rôle existe
  const roles = await roleModel.getAllRoles();
  const roleFound = roles.find((r: any) => r.id === Number(id));
  if (!roleFound) {
    return reply.status(404).send({ error: "Rôle ou utilisateur non trouvé" });
  }
  // Vérifier que l'utilisateur existe
  const users = await utilisateursModel.getAllUtilisateurs();
  const userFound = users.find((u: any) => u.id === Number(utilisateur_id));
  if (!userFound) {
    return reply.status(404).send({ error: "Rôle ou utilisateur non trouvé" });
  }
  // Vérifier si déjà assigné
  try {
    const already = await utilisateurRolesModel.userRoleExists(
      Number(utilisateur_id),
      Number(id)
    );
    if (already) {
      return reply
        .status(400)
        .send({ error: "Utilisateur déjà assigné à ce rôle" });
    }
    await utilisateurRolesModel.assignUserToRole(
      Number(utilisateur_id),
      Number(id)
    );
    reply
      .status(201)
      .send({ utilisateur_id: Number(utilisateur_id), role_id: Number(id) });
  } catch (err: any) {
    if (err.message === "ALREADY_ASSIGNED") {
      return reply
        .status(400)
        .send({ error: "Utilisateur déjà assigné à ce rôle" });
    }
    reply
      .status(500)
      .send({ error: "Erreur lors de l'attribution du rôle à l'utilisateur" });
  }
};
