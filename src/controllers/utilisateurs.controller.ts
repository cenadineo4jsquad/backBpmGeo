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
    const token = await reply.jwtSign({
      id: utilisateur.id,
      email: utilisateur.email,
      role:
        utilisateur.utilisateur_roles &&
        utilisateur.utilisateur_roles.length > 0
          ? utilisateur.utilisateur_roles[0].roles.nom
          : undefined,
    });
    reply.send({ token });
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
    reply.status(201).send(utilisateur);
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
  try {
    const utilisateur = await utilisateurService.getUserById(id);
    if (!utilisateur) {
      return reply.status(404).send({ error: "Utilisateur non trouvé" });
    }
    reply.send(utilisateur);
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
  try {
    const utilisateur = await utilisateurService.updateUser(id, {
      nom,
      prenom,
      email,
      localite,
      est_superviseur,
    });
    if (!utilisateur) {
      return reply.status(404).send({ error: "Utilisateur non trouvé" });
    }
    reply.send(utilisateur);
  } catch (error) {
    reply.status(500).send({ error: "Erreur serveur" });
  }
};

export const deleteUserHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { id } = request.params as any;
  try {
    const utilisateur = await utilisateurService.deleteUser(id);
    if (!utilisateur) {
      return reply.status(404).send({ error: "Utilisateur non trouvé" });
    }
    reply.status(204).send();
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
