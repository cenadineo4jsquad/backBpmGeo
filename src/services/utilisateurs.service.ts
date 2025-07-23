export async function getUserByEmail(email: string) {
  return prisma.utilisateurs.findUnique({
    where: { email },
    include: {
      utilisateur_roles: {
        include: {
          roles: true,
        },
      },
    },
  });
}
// src/services/utilisateurs.service.ts
// Squelette du service utilisateurs pour Fastify

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function createUser({
  nom,
  prenom,
  email,
  hashedPassword,
  niveau_hierarchique,
  localite,
}: any) {
  // À compléter avec la logique de création
  return prisma.utilisateurs.create({
    data: {
      nom,
      prenom,
      email,
      mot_de_passe: hashedPassword,
      niveau_hierarchique,
      localite_id: localite?.id ? parseInt(localite.id) : null,
    },
  });
}

export async function getUserById(id: string) {
  return prisma.utilisateurs.findUnique({
    where: { id: parseInt(id) },
  });
}

export async function updateUser(id: string, data: any) {
  return prisma.utilisateurs.update({
    where: { id: parseInt(id) },
    data,
  });
}

export async function deleteUser(id: string) {
  return prisma.utilisateurs.delete({
    where: { id: parseInt(id) },
  });
}

export async function getAllUsers() {
  return prisma.utilisateurs.findMany();
}
