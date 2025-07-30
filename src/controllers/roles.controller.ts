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
    const roles = await prisma.roles.findMany({
      include: { permissions: true },
    });
    reply.send(roles);
  } catch (error) {
    reply
      .status(500)
      .send({ error: "Erreur lors de la récupération des rôles" });
  }
};

import { FastifyRequest, FastifyReply } from "fastify";
import { RoleModel } from "../models/roles.model";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const roleModel = new RoleModel();

export const createRole = async (
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
    const { projet_id, nom, niveau_hierarchique, description, permissions } =
      request.body as any;
    if (
      projet_id === undefined ||
      !nom ||
      niveau_hierarchique === undefined ||
      !description
    ) {
      const existing = await prisma.roles.findUnique({ where: { nom } });
      if (existing) {
        return reply.status(400).send({ error: "Nom de rôle déjà utilisé" });
      }
    }
    // Création du rôle + permissions imbriquées
    const newRole = await prisma.roles.create({
      data: {
        projet_id,
        nom,
        niveau_hierarchique,
        description,
        permissions: permissions
          ? { create: permissions } // [{ action: "extract_data" }, ...]
          : undefined,
      },
      include: { permissions: true },
    });
    reply.status(201).send(newRole);
  } catch (error) {
    console.error(error); // Ajoute ceci
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
    const updatedRole = await prisma.roles.update({
      where: { id: Number(id) },
      data: { nom, niveau_hierarchique, description },
    });
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
    await prisma.roles.delete({ where: { id: Number(id) } });
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
    const roles = await prisma.roles.findMany({
      where: { projet_id: Number(projetId) },
      include: { permissions: true },
    });
    reply.send(roles);
  } catch (error) {
    reply
      .status(500)
      .send({ error: "Erreur lors de la récupération des rôles" });
  }
};
