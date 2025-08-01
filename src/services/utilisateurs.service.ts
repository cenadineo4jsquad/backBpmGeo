// src/services/utilisateurs.service.ts
// Squelette du service utilisateurs pour Fastify

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function getUserByEmail(email: string) {
  return prisma.utilisateurs.findUnique({
    where: { email },
    include: {
      utilisateur_roles: {
        include: {
          roles: true,
        },
      },
      localites: true, // Inclure les informations de localité
    },
  });
}

export async function createUser({
  nom,
  prenom,
  email,
  hashedPassword,
  niveau_hierarchique,
  localite,
}: any) {
  // À compléter avec la logique de création
  // Si localite est un string (nom), on cherche l'id correspondant
  let localite_id: number | undefined = undefined;
  if (typeof localite === "string" && localite.length > 0) {
    const found = await prisma.localites.findFirst({
      where: { valeur: localite },
    });
    if (found) localite_id = found.id;
  } else if (localite && localite.id) {
    localite_id = parseInt(localite.id);
  }
  const data: any = {
    nom,
    prenom,
    email,
    mot_de_passe: hashedPassword,
    niveau_hierarchique,
  };
  if (localite_id) {
    data.localite_id = localite_id;
  }
  return prisma.utilisateurs.create({
    data,
  });
}

export async function getUserById(id: string) {
  return prisma.utilisateurs.findUnique({
    where: { id: parseInt(id) },
    include: {
      utilisateur_roles: {
        include: {
          roles: true,
        },
      },
      localites: true,
    },
  });
}

export async function getUserByIdWithLocalite(id: string) {
  return prisma.utilisateurs.findUnique({
    where: { id: parseInt(id) },
    include: {
      localites: true,
    },
  });
}

export async function updateUser(id: string, data: any) {
  return prisma.utilisateurs.update({
    where: { id: parseInt(id) },
    data,
  });
}

export async function updateUserWithLocalite(id: string, data: any) {
  // Si localite présent, on met à jour localite_id
  const updateData = { ...data };
  if (data.localite && data.localite.id) {
    updateData.localite_id = parseInt(data.localite.id);
    delete updateData.localite;
  }
  return prisma.utilisateurs.update({
    where: { id: parseInt(id) },
    data: updateData,
    include: { localites: true },
  });
}

export async function deleteUser(id: string) {
  return prisma.utilisateurs.delete({
    where: { id: parseInt(id) },
  });
}

export async function getAllUsers() {
  return prisma.utilisateurs.findMany({
    include: {
      localites: true,
    },
  });
}
