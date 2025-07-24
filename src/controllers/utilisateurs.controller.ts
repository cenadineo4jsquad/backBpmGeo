import { FastifyRequest, FastifyReply } from "fastify";
import { hash, compare } from "bcrypt";
import * as utilisateurService from "../services/utilisateurs.service";

export const loginHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { email, mot_de_passe } = request.body as any;
  try {
    const utilisateur = await utilisateurService.getUserByEmail(email);
    if (!utilisateur) {
      return reply
        .status(401)
        .send({ error: "Email ou mot de passe incorrect" });
    }
    const passwordMatch = await compare(mot_de_passe, utilisateur.mot_de_passe);
    if (!passwordMatch) {
      return reply
        .status(401)
        .send({ error: "Email ou mot de passe incorrect" });
    }
    // Générer le token JWT
    const role =
      utilisateur.utilisateur_roles && utilisateur.utilisateur_roles.length > 0
        ? utilisateur.utilisateur_roles[0].roles.nom
        : undefined;
    const token = await reply.jwtSign({
      id: utilisateur.id,
      email: utilisateur.email,
      role,
      niveau_hierarchique: utilisateur.niveau_hierarchique,
    });
    reply.send({
      token,
      user: {
        id: utilisateur.id,
        email: utilisateur.email,
        role,
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        niveau_hierarchique: utilisateur.niveau_hierarchique,
      },
    });
  } catch (error) {
    reply.status(500).send({ error: "Erreur serveur" });
  }
};

export const createUserHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { nom, prenom, email, mot_de_passe, localite, est_superviseur } =
    request.body as any;
  const hashedPassword = await hash(mot_de_passe, 10);
  const niveau_hierarchique =
    localite?.type === "arrondissement"
      ? 1
      : localite?.type === "departement"
      ? 2
      : est_superviseur
      ? 4
      : 3;
  try {
    const utilisateur = await utilisateurService.createUser({
      nom,
      prenom,
      email,
      hashedPassword,
      niveau_hierarchique,
      localite,
    });
    // On retourne la réponse formatée comme dans la doc
    reply.status(201).send({
      id: utilisateur.id,
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      email: utilisateur.email,
      niveau_hierarchique: utilisateur.niveau_hierarchique,
      localite: localite, // renvoyer l'objet localite reçu en entrée
    });
  } catch (error: any) {
    if (error.code === "23505") {
      reply.status(400).send({ error: "Email déjà utilisé" });
    } else {
      reply.status(500).send({ error: "Erreur serveur" });
    }
  }
};

export const getUserByIdHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { id } = request.params as any;
  const userRaw = request.user;
  if (!userRaw || typeof userRaw !== "object") {
    return reply.status(401).send({ error: "Non autorisé" });
  }
  // On force le typage pour accéder aux propriétés attendues
  const user = userRaw as { id: number; niveau_hierarchique: number };
  if (user.niveau_hierarchique !== 4 && user.id !== parseInt(id)) {
    return reply.status(403).send({ error: "Accès interdit" });
  }
  try {
    const utilisateur = await utilisateurService.getUserByIdWithLocalite(id);
    if (!utilisateur) {
      return reply.status(404).send({ error: "Utilisateur non trouvé" });
    }
    // Formatage de la réponse comme dans la doc
    reply.send({
      id: utilisateur.id,
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      email: utilisateur.email,
      niveau_hierarchique: utilisateur.niveau_hierarchique,
      localite: utilisateur.localites
        ? {
            type: utilisateur.localites.type,
            valeur: utilisateur.localites.valeur,
          }
        : null,
    });
  } catch (error) {
    reply.status(500).send({ error: "Erreur serveur" });
  }
};

export const updateUserHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { id } = request.params as any;
  const { nom, prenom, email, localite, est_superviseur } = request.body as any;
  const userRaw = request.user;
  if (!userRaw || typeof userRaw !== "object") {
    return reply.status(401).send({ error: "Non autorisé" });
  }
  const user = userRaw as { id: number; niveau_hierarchique: number };
  if (user.niveau_hierarchique !== 4 && user.id !== parseInt(id)) {
    return reply.status(403).send({ error: "Accès interdit" });
  }
  // Recalcul du niveau_hierarchique si localite change
  let niveau_hierarchique: number | undefined = undefined;
  if (localite) {
    niveau_hierarchique =
      localite.type === "arrondissement"
        ? 1
        : localite.type === "departement"
        ? 2
        : est_superviseur
        ? 4
        : 3;
  }
  try {
    const utilisateur = await utilisateurService.updateUserWithLocalite(id, {
      nom,
      prenom,
      email,
      localite,
      est_superviseur,
      ...(niveau_hierarchique !== undefined ? { niveau_hierarchique } : {}),
    });
    if (!utilisateur) {
      return reply.status(404).send({ error: "Utilisateur non trouvé" });
    }
    // Formatage de la réponse comme dans la doc
    reply.send({
      id: utilisateur.id,
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      email: utilisateur.email,
      niveau_hierarchique: utilisateur.niveau_hierarchique,
      localite: utilisateur.localites
        ? {
            type: utilisateur.localites.type,
            valeur: utilisateur.localites.valeur,
          }
        : null,
    });
  } catch (error: any) {
    if (error.code === "P2002" || error.code === "23505") {
      reply.status(400).send({ error: "Email déjà utilisé" });
    } else {
      reply.status(500).send({ error: "Erreur serveur" });
    }
  }
};

export const deleteUserHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { id } = request.params as any;
  const userRaw = request.user;
  if (!userRaw || typeof userRaw !== "object") {
    return reply.status(401).send({ error: "Non autorisé" });
  }
  const user = userRaw as { niveau_hierarchique: number };
  if (user.niveau_hierarchique !== 4) {
    return reply.status(403).send({ error: "Réservé aux administrateurs" });
  }
  try {
    const utilisateur = await utilisateurService.deleteUser(id);
    if (!utilisateur) {
      return reply.status(404).send({ error: "Utilisateur non trouvé" });
    }
    reply.status(200).send({ success: true });
  } catch (error) {
    reply.status(500).send({ error: "Erreur serveur" });
  }
};

export const getAllUsersHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const utilisateurs = await utilisateurService.getAllUsers();
    reply.send(utilisateurs);
  } catch (error) {
    reply.status(500).send({ error: "Erreur serveur" });
  }
};
