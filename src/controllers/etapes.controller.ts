import { FastifyRequest, FastifyReply } from "fastify";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const createEtape = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { projet_id, nom, ordre, description, type_validation } =
    request.body as any;

  // Validation des champs requis
  if (!projet_id || !nom || ordre === undefined) {
    return reply.status(400).send({
      error: "Les champs projet_id, nom et ordre sont obligatoires",
    });
  }

  try {
    // Vérifier que le projet existe et récupérer ses étapes
    const projet = await prisma.projets.findUnique({
      where: {
        id: Number(projet_id),
      },
      include: {
        etapes_workflow: true,
      },
    });

    if (!projet) {
      return reply.status(404).send({ error: "Projet non trouvé" });
    }

    // Vérifier le nombre maximum d'étapes (pour éviter un trop grand nombre d'étapes)
    const MAX_ETAPES = 10; // Limite arbitraire, à ajuster selon les besoins
    if (projet.etapes_workflow.length >= MAX_ETAPES) {
      return reply.status(400).send({
        error: `Le projet ne peut pas avoir plus de ${MAX_ETAPES} étapes`,
      });
    }

    // Vérifier que l'ordre est cohérent
    if (ordre > projet.etapes_workflow.length + 1) {
      return reply.status(400).send({
        error: `L'ordre de l'étape ne peut pas être supérieur à ${
          projet.etapes_workflow.length + 1
        }`,
      });
    }

    // Vérifier que l'ordre est unique pour ce projet
    const etapeExistante = await prisma.etapes_workflow.findFirst({
      where: {
        projet_id: Number(projet_id),
        ordre: Number(ordre),
      },
    });

    if (etapeExistante) {
      return reply.status(400).send({
        error: "Une étape avec cet ordre existe déjà pour ce projet",
      });
    }

    // Créer l'étape
    const newEtape = await prisma.etapes_workflow.create({
      data: {
        projet_id: Number(projet_id),
        nom,
        ordre: Number(ordre),
        description,
        type_validation,
      },
      include: {
        projets: true,
      },
    });

    // Créer automatiquement un workflow template pour cette étape
    // Ce workflow servira de modèle et peut être assigné aux utilisateurs plus tard
    try {
      await prisma.workflows.create({
        data: {
          projet_id: Number(projet_id),
          etape_nom: nom,
          ordre: Number(ordre),
          // utilisateur_id est null car c'est un workflow template
          utilisateur_id: null,
          date_debut: null, // Sera défini quand assigné à un utilisateur
        },
      });

      console.log(
        `[CREATE_ETAPE] Workflow template créé pour l'étape "${nom}" (ordre: ${ordre})`
      );
    } catch (workflowError) {
      console.warn(
        `[CREATE_ETAPE] Impossible de créer le workflow template pour l'étape "${nom}":`,
        workflowError
      );
      // On ne fait pas échouer la création de l'étape si le workflow template échoue
    }

    reply.status(201).send(newEtape);
  } catch (error) {
    console.error("[CREATE_ETAPE] Erreur:", error);
    reply.status(500).send({ error: "Erreur lors de la création de l'étape" });
  }
};

export const updateEtape = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { id } = request.params as any;
  const { nom, ordre, description, type_validation } = request.body as any;

  try {
    // Vérifier que l'étape existe
    const etapeExistante = await prisma.etapes_workflow.findUnique({
      where: { id: Number(id) },
    });

    if (!etapeExistante) {
      return reply.status(404).send({ error: "Étape non trouvée" });
    }

    // Si l'ordre change, vérifier qu'il n'existe pas déjà pour ce projet
    if (ordre !== undefined && ordre !== etapeExistante.ordre) {
      const conflit = await prisma.etapes_workflow.findFirst({
        where: {
          projet_id: etapeExistante.projet_id,
          ordre: Number(ordre),
          id: { not: Number(id) },
        },
      });

      if (conflit) {
        return reply.status(400).send({
          error: "Une étape avec cet ordre existe déjà pour ce projet",
        });
      }
    }

    // Mettre à jour l'étape
    const updatedEtape = await prisma.etapes_workflow.update({
      where: { id: Number(id) },
      data: {
        nom,
        ordre: ordre ? Number(ordre) : undefined,
        description,
        type_validation,
      },
      include: {
        projets: true,
      },
    });

    reply.send(updatedEtape);
  } catch (error) {
    console.error("[UPDATE_ETAPE] Erreur:", error);
    reply
      .status(500)
      .send({ error: "Erreur lors de la mise à jour de l'étape" });
  }
};

export const deleteEtape = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { id } = request.params as any;

  try {
    // Vérifier que l'étape existe
    const etapeExistante = await prisma.etapes_workflow.findUnique({
      where: { id: Number(id) },
    });

    if (!etapeExistante) {
      return reply.status(404).send({ error: "Étape non trouvée" });
    }

    // Vérifier s'il y a des rôles liés à cette étape
    const rolesLies = await prisma.roles.findMany({
      where: {
        permissions: {
          some: {
            action: { contains: `ETAPE_${id}` },
          },
        },
      },
    });

    if (rolesLies.length > 0) {
      return reply.status(400).send({
        error:
          "Impossible de supprimer l'étape car elle est utilisée par des rôles",
      });
    }

    await prisma.etapes_workflow.delete({
      where: { id: Number(id) },
    });

    reply.status(204).send();
  } catch (error) {
    console.error("[DELETE_ETAPE] Erreur:", error);
    reply
      .status(500)
      .send({ error: "Erreur lors de la suppression de l'étape" });
  }
};

export const getEtapesByProjet = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { projet_id } = request.params as any;

  try {
    // Vérifier que le projet existe
    const projet = await prisma.projets.findUnique({
      where: { id: Number(projet_id) },
    });

    if (!projet) {
      return reply.status(404).send({ error: "Projet non trouvé" });
    }

    const etapes = await prisma.etapes_workflow.findMany({
      where: { projet_id: Number(projet_id) },
      include: {
        projets: true,
      },
      orderBy: { ordre: "asc" },
    });

    reply.send(etapes);
  } catch (error) {
    console.error("[GET_ETAPES] Erreur:", error);
    reply
      .status(500)
      .send({ error: "Erreur lors de la récupération des étapes" });
  }
};
