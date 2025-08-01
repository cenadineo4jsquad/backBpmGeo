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
    const {
      projet_id,
      nom,
      niveau_hierarchique,
      description,
      permissions,
      etape_id,
    } = request.body as any;

    // Validation des champs requis
    if (!projet_id || !nom || !niveau_hierarchique) {
      return reply.status(400).send({
        error:
          "Les champs projet_id, nom et niveau_hierarchique sont obligatoires",
      });
    }

    // Vérifie si le projet existe
    const projet = await prisma.projets.findUnique({
      where: { id: Number(projet_id) },
    });
    if (!projet) {
      return reply.status(404).send({ error: "Projet non trouvé" });
    }

    // Vérifie si le nom existe déjà
    const existing = await prisma.roles.findUnique({ where: { nom } });
    if (existing) {
      return reply.status(400).send({ error: "Nom de rôle déjà utilisé" });
    }

    // Si un etape_id est fourni, vérifie que l'étape existe et appartient au projet
    if (etape_id) {
      const etape = await prisma.etapes_workflow.findFirst({
        where: {
          id: Number(etape_id),
          projet_id: Number(projet_id),
        },
      });
      if (!etape) {
        return reply.status(404).send({
          error: "Étape non trouvée ou n'appartient pas au projet spécifié",
        });
      }
    }

    // Validation des permissions si fournies
    if (permissions && !Array.isArray(permissions)) {
      return reply.status(400).send({
        error: "Les permissions doivent être un tableau d'actions",
      });
    }

    // Création du rôle + permissions imbriquées
    const newRole = await prisma.roles.create({
      data: {
        projet_id: Number(projet_id),
        nom,
        niveau_hierarchique: Number(niveau_hierarchique),
        description,
        permissions: permissions
          ? {
              create: permissions.map((p: { action: string } | string) => ({
                action: typeof p === "string" ? p : p.action,
              })),
            }
          : undefined,
      },
      include: {
        permissions: true,
        projets: {
          include: {
            etapes_workflow: true,
          },
        },
      },
    });
    reply.status(201).send(newRole);
  } catch (error) {
    console.error(error);
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
