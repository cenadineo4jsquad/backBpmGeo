export const getRoles = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const userRaw = request.user;
  if (!userRaw || typeof userRaw !== "object") {
    return reply.status(401).send({ error: "Non autorisé" });
  }
  const user = userRaw as { niveau_hierarchique: number };
  if (user.niveau_hierarchique !== 4) {
    return reply.status(403).send({ error: "Réservé aux administrateurs" });
  }
  try {
    const roles = await roleModel.getAllRoles();
    // Formatage strict de la réponse comme dans la doc
    const formatted = roles.map((r: any) => ({
      id: r.id,
      projet_id: r.projet_id,
      nom: r.nom,
      niveau_hierarchique: r.niveau_hierarchique,
      description: r.description,
    }));
    reply.send(formatted);
  } catch (error) {
    reply
      .status(500)
      .send({ error: "Erreur lors de la récupération des rôles" });
  }
};

import { FastifyRequest, FastifyReply } from "fastify";
import { RoleModel } from "../models/roles.model";

const roleModel = new RoleModel();

export const createRole = async (
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
  try {
    const { projet_id, nom, niveau_hierarchique, description } =
      request.body as any;
    if (
      projet_id === undefined ||
      !nom ||
      niveau_hierarchique === undefined ||
      !description
    ) {
      return reply.status(400).send({ error: "Champs requis manquants" });
    }
    const newRole = await roleModel.createRole(
      projet_id,
      nom,
      niveau_hierarchique,
      description
    );
    // Formatage strict de la réponse
    const formatted = {
      id: newRole.id,
      projet_id: newRole.projet_id,
      nom: newRole.nom,
      niveau_hierarchique: newRole.niveau_hierarchique,
      description: newRole.description,
    };
    reply.status(201).send(formatted);
  } catch (error) {
    reply.status(500).send({ error: "Erreur lors de la création du rôle" });
  }
};

export const updateRole = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params as any;
    const { nom, niveau_hierarchique, description } = request.body as any;
    const updatedRole = await roleModel.updateRole(
      Number(id),
      nom,
      niveau_hierarchique,
      description
    );
    if (!updatedRole) {
      return reply.status(404).send({ error: "Rôle non trouvé" });
    }
    reply.send(updatedRole);
  } catch (error) {
    reply.status(500).send({ error: "Erreur lors de la mise à jour du rôle" });
  }
};

export const deleteRole = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params as any;
    const deletedRole = await roleModel.deleteRole(Number(id));
    if (!deletedRole) {
      return reply.status(404).send({ error: "Rôle non trouvé" });
    }
    reply.status(204).send();
  } catch (error) {
    reply.status(500).send({ error: "Erreur lors de la suppression du rôle" });
  }
};

export const getRolesByProject = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { projetId } = request.params as any;
    const roles = await roleModel.getRolesByProject(Number(projetId));
    reply.send(roles);
  } catch (error) {
    reply
      .status(500)
      .send({ error: "Erreur lors de la récupération des rôles" });
  }
};
