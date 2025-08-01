import { FastifyRequest, FastifyReply } from "fastify";
import { hash, compare } from "bcrypt";
import * as utilisateurService from "../services/utilisateurs.service";
import * as workflowService from "../services/workflow.service";
import { prisma } from "../lib/prisma";

export const loginHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { email, mot_de_passe } = request.body as any;
  const ACCESS_EXPIRES_IN = "1h"; // Durée de vie de l'access token
  const REFRESH_EXPIRES_IN = "7d"; // Durée de vie du refresh token

  console.log("[LOGIN] Tentative de connexion avec email:", email); // <-- ici
  try {
    const utilisateur = await utilisateurService.getUserByEmail(email);
    console.log("[LOGIN] Utilisateur trouvé:", utilisateur); // <-- ici
    if (!utilisateur) {
      console.log("[LOGIN] Aucun utilisateur trouvé pour cet email."); // <-- ici
      return reply
        .status(401)
        .send({ error: "Email ou mot de passe incorrect" });
    }
    const passwordMatch = await compare(mot_de_passe, utilisateur.mot_de_passe);
    console.log("[LOGIN] Password match:", passwordMatch); // <-- ici
    if (!passwordMatch) {
      console.log("[LOGIN] Mot de passe incorrect."); // <-- ici

      return reply
        .status(401)
        .send({ error: "Email ou mot de passe incorrect" });
    }
    // Générer le token JWT
    const role =
      utilisateur.utilisateur_roles && utilisateur.utilisateur_roles.length > 0
        ? utilisateur.utilisateur_roles[0].roles.nom
        : undefined;
    // Récupérer le projet principal via le rôle (s'il existe)
    let projet_id = undefined;
    if (
      utilisateur.utilisateur_roles &&
      utilisateur.utilisateur_roles.length > 0
    ) {
      projet_id = utilisateur.utilisateur_roles[0].roles.projet_id;
    }
    // Chercher l'étape courante de l'utilisateur pour ce projet (via workflow)
    let etape_courante = null;
    let niveau_etape = null;
    if (projet_id) {
      const workflow = await prisma.workflows.findFirst({
        where: {
          utilisateur_id: utilisateur.id,
          projet_id: projet_id,
        },
        orderBy: { date_debut: "desc" },
      });
      if (workflow && workflow.etape_nom) {
        // Récupérer les détails de l'étape depuis la table etapes_workflow
        const etapeDetails = await prisma.etapes_workflow.findFirst({
          where: {
            projet_id: projet_id,
            nom: workflow.etape_nom,
          },
        });

        etape_courante = {
          nom: workflow.etape_nom,
          ordre: workflow.ordre || etapeDetails?.ordre,
        };

        // Le niveau d'étape correspond à l'ordre de l'étape
        niveau_etape = etapeDetails?.ordre || workflow.ordre;
      }
    }
    // Générer l'access_token avec durée de vie
    const token = await reply.jwtSign(
      {
        id: utilisateur.id,
        email: utilisateur.email,
        role,
        niveau_hierarchique: utilisateur.niveau_hierarchique,
      },
      { expiresIn: ACCESS_EXPIRES_IN } // Utilise la constante
    );

    // Générer le refresh_token (mêmes claims, secret différent, durée longue)
    const fastify = reply.server as any;
    const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refresh_secret";
    const refresh_token = require("jsonwebtoken").sign(
      { sub: utilisateur.id, email: utilisateur.email },
      REFRESH_SECRET,
      { expiresIn: REFRESH_EXPIRES_IN }
    );
    // Stocker le refresh_token côté serveur (in-memory)
    if (
      fastify.refreshStore &&
      typeof fastify.refreshStore.set === "function"
    ) {
      fastify.refreshStore.set(String(utilisateur.id), refresh_token);
    } else if (fastify.parent && fastify.parent.refreshStore) {
      // Si le décorateur est sur l'instance parente
      fastify.parent.refreshStore.set(String(utilisateur.id), refresh_token);
    }

    reply.send({
      user: {
        id: utilisateur.id,
        email: utilisateur.email,
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        niveau_hierarchique: utilisateur.niveau_hierarchique,
        projet_id: projet_id,
        localite_id: utilisateur.localite_id,
        localite: utilisateur.localites || null,
        role: {
          id:
            utilisateur.utilisateur_roles &&
            utilisateur.utilisateur_roles.length > 0
              ? utilisateur.utilisateur_roles[0].roles.id
              : null,
          nom: role,
          niveau_hierarchique:
            utilisateur.utilisateur_roles &&
            utilisateur.utilisateur_roles.length > 0
              ? utilisateur.utilisateur_roles[0].roles.niveau_hierarchique
              : null,
          description:
            utilisateur.utilisateur_roles &&
            utilisateur.utilisateur_roles.length > 0
              ? utilisateur.utilisateur_roles[0].roles.description
              : null,
        },
        etape_courante: etape_courante
          ? { nom: etape_courante.nom, ordre: etape_courante.ordre }
          : null,
        niveau_etape: niveau_etape,
      },
      access_token: token,
      refresh_token,
    });
  } catch (error) {
    console.error("[LOGIN] Erreur serveur:", error); // <-- ici
    reply.status(500).send({ error: "Erreur serveur" });
  }
};

export const createUserHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const requestBody = request.body as any;

  // Validation stricte des paramètres
  const allowedFields = [
    "nom",
    "prenom",
    "email",
    "mot_de_passe",
    "localite",
    "est_superviseur",
    "role_id",
    "role_nom",
  ];
  const requiredFields = ["nom", "prenom", "email", "mot_de_passe"];

  // Vérifier qu'aucun champ non autorisé n'est envoyé
  const receivedFields = Object.keys(requestBody);
  const invalidFields = receivedFields.filter(
    (field) => !allowedFields.includes(field)
  );

  if (invalidFields.length > 0) {
    return reply.status(400).send({
      error: `Champs non autorisés: ${invalidFields.join(
        ", "
      )}. Champs autorisés: ${allowedFields.join(", ")}`,
    });
  }

  // Vérifier qu'un rôle est spécifié (soit role_id soit role_nom)
  if (!requestBody.role_id && !requestBody.role_nom) {
    return reply.status(400).send({
      error: "Un rôle doit être spécifié (role_id ou role_nom)",
    });
  }

  // Vérifier qu'un seul des deux champs de rôle est fourni
  if (requestBody.role_id && requestBody.role_nom) {
    return reply.status(400).send({
      error: "Spécifiez soit role_id soit role_nom, pas les deux",
    });
  }

  // Vérifier que tous les champs obligatoires sont présents
  const missingFields = requiredFields.filter(
    (field) => !requestBody[field] || requestBody[field] === ""
  );

  if (missingFields.length > 0) {
    return reply.status(400).send({
      error: `Champs obligatoires manquants: ${missingFields.join(", ")}`,
    });
  }

  const {
    nom,
    prenom,
    email,
    mot_de_passe,
    localite,
    est_superviseur,
    role_id,
    role_nom,
  } = requestBody;

  // Validation des types de données
  if (
    typeof nom !== "string" ||
    typeof prenom !== "string" ||
    typeof email !== "string" ||
    typeof mot_de_passe !== "string"
  ) {
    return reply.status(400).send({
      error:
        "Les champs nom, prenom, email et mot_de_passe doivent être des chaînes de caractères",
    });
  }

  if (
    role_id !== undefined &&
    typeof role_id !== "number" &&
    !Number.isInteger(Number(role_id))
  ) {
    return reply.status(400).send({
      error: "Le champ role_id doit être un nombre entier",
    });
  }

  if (role_nom !== undefined && typeof role_nom !== "string") {
    return reply.status(400).send({
      error: "Le champ role_nom doit être une chaîne de caractères",
    });
  }

  if (est_superviseur !== undefined && typeof est_superviseur !== "boolean") {
    return reply.status(400).send({
      error: "Le champ est_superviseur doit être un booléen (true/false)",
    });
  }

  // Validation de l'email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return reply.status(400).send({
      error: "Format d'email invalide",
    });
  }

  // Validation de la longueur du mot de passe
  if (mot_de_passe.length < 6) {
    return reply.status(400).send({
      error: "Le mot de passe doit contenir au moins 6 caractères",
    });
  }

  // Vérifier que le rôle existe et récupérer son ID
  let roleToUse;
  let finalRoleId;

  if (role_id) {
    // Recherche par ID
    roleToUse = await prisma.roles.findUnique({
      where: { id: Number(role_id) },
    });

    if (!roleToUse) {
      return reply
        .status(400)
        .send({ error: "Le rôle avec cet ID n'existe pas" });
    }

    finalRoleId = Number(role_id);
  } else {
    // Recherche par nom
    roleToUse = await prisma.roles.findFirst({
      where: { nom: role_nom },
    });

    if (!roleToUse) {
      return reply
        .status(400)
        .send({ error: "Le rôle avec ce nom n'existe pas" });
    }

    finalRoleId = roleToUse.id;
  }

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
    // Validation stricte de la localité si fournie
    let localiteObj = localite;
    if (localite) {
      // Recherche par nom (valeur) et éventuellement type
      const found = await prisma.localites.findFirst({
        where:
          typeof localite === "string"
            ? { valeur: localite }
            : localite.valeur
            ? { valeur: localite.valeur }
            : undefined,
      });
      if (!found) {
        return reply.status(400).send({ error: "Localité inconnue" });
      }
      // On force l'objet localite à l'objet complet trouvé
      localiteObj = { id: found.id, type: found.type, valeur: found.valeur };
    }
    // Créer l'utilisateur et son association avec le rôle
    const utilisateur = await prisma.$transaction(async (prisma) => {
      const newUser = await prisma.utilisateurs.create({
        data: {
          nom,
          prenom,
          email,
          mot_de_passe: hashedPassword,
          niveau_hierarchique,
          localite_id: localiteObj?.id,
        },
      });

      // Créer l'association utilisateur-rôle
      await prisma.utilisateur_roles.create({
        data: {
          utilisateur_id: newUser.id,
          role_id: finalRoleId,
        },
      });

      return newUser;
    });

    // Assigner automatiquement un workflow si le rôle est lié à un projet
    if (roleToUse.projet_id) {
      try {
        const workflow = await workflowService.assignWorkflowToUser(
          utilisateur.id,
          roleToUse.projet_id,
          roleToUse.niveau_hierarchique || undefined
        );

        if (workflow) {
          console.log(
            `[CREATE_USER] Workflow automatiquement assigné à l'utilisateur ${utilisateur.id} pour le projet ${roleToUse.projet_id}`
          );
        }
      } catch (workflowError) {
        console.warn(
          `[CREATE_USER] Impossible d'assigner automatiquement un workflow à l'utilisateur ${utilisateur.id}:`,
          workflowError
        );
        // On ne fait pas échouer la création de l'utilisateur si l'assignation du workflow échoue
      }
    }

    // On retourne la réponse formatée comme dans la doc
    reply.status(201).send({
      id: utilisateur.id,
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      email: utilisateur.email,
      niveau_hierarchique: utilisateur.niveau_hierarchique,
      localite: localiteObj,
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
    // On mappe pour renvoyer le nom de la localité au lieu de l'id
    const usersWithLocalite = utilisateurs.map((u: any) => ({
      id: u.id,
      nom: u.nom,
      prenom: u.prenom,
      email: u.email,
      niveau_hierarchique: u.niveau_hierarchique,
      localite: u.localites
        ? {
            type: u.localites.type,
            valeur: u.localites.valeur,
          }
        : null,
    }));
    reply.send(usersWithLocalite);
  } catch (error) {
    reply.status(500).send({ error: "Erreur serveur" });
  }
};
