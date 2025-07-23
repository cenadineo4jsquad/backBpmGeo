export const getRoles = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const roles = await roleModel.getAllRoles();
    reply.send(roles);
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
  try {
    const { projetId, nom, niveau_hierarchique, description } =
      request.body as any;
    const newRole = await roleModel.createRole(
      projetId,
      nom,
      niveau_hierarchique,
      description
    );
    reply.status(201).send(newRole);
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
