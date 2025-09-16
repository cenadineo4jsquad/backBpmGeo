// Validation ou rejet d'un workflow (avancer ou reculer l'étape)
export const validerWorkflowHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { id } = request.params as any;
  const { statut, commentaire } = request.body as any;
  const user = request.user as any;

  if (!statut || (statut === "rejeté" && !commentaire)) {
    return reply.status(400).send({ error: "Un commentaire est requis pour le rejet" });
  }

  try {
    // Récupérer le workflow courant
    const workflow = await prisma.workflows.findUnique({ where: { id: Number(id) } });
    if (!workflow) {
      return reply.status(404).send({ error: "Workflow non trouvé" });
    }
    const { titre_foncier_id, projet_id, ordre } = workflow;
    if (!titre_foncier_id || !projet_id || !ordre) {
      return reply.status(400).send({ error: "Données du workflow incomplètes" });
    }

    if (statut === "approuvé") {
      // Chercher l'étape suivante
      const nextEtape = await prisma.etapes_workflow.findFirst({
        where: { projet_id, ordre: { gt: ordre } },
        orderBy: { ordre: "asc" },
      });
      if (!nextEtape) {
        return reply.status(400).send({ error: "Déjà à la dernière étape du workflow" });
      }
      // Terminer le workflow courant
      await prisma.workflows.update({ where: { id: workflow.id }, data: { date_fin: new Date() } });
      // Créer le nouveau workflow pour l'étape suivante
      const newWorkflow = await prisma.workflows.create({
        data: {
          titre_foncier_id,
          projet_id,
          etape_nom: nextEtape.nom,
          ordre: nextEtape.ordre,
          date_debut: new Date(),
          utilisateur_id: user.id,
        },
      });
      return reply.status(200).send(newWorkflow);
    } else if (statut === "rejeté") {
      // Chercher l'étape précédente
      const prevEtape = await prisma.etapes_workflow.findFirst({
        where: { projet_id, ordre: { lt: ordre } },
        orderBy: { ordre: "desc" },
      });
      if (!prevEtape) {
        return reply.status(400).send({ error: "Déjà à la première étape du workflow" });
      }
      // Terminer le workflow courant
      await prisma.workflows.update({ where: { id: workflow.id }, data: { date_fin: new Date() } });
      // Créer le nouveau workflow pour l'étape précédente
      const newWorkflow = await prisma.workflows.create({
        data: {
          titre_foncier_id,
          projet_id,
          etape_nom: prevEtape.nom,
          ordre: prevEtape.ordre,
          date_debut: new Date(),
          utilisateur_id: user.id,
        },
      });
      // Historiser le commentaire de rejet (dans la table validations si besoin)
      await prisma.validations.create({
        data: {
          utilisateur_id: user.id,
          statut: "rejeté",
          commentaire,
          date_validation: new Date(),
        },
      });
      return reply.status(200).send(newWorkflow);
    } else {
      return reply.status(400).send({ error: "Statut invalide" });
    }
  } catch (error) {
    reply.status(500).send({ error: "Erreur lors de la validation/rejet du workflow" });
  }
};
import { FastifyRequest, FastifyReply } from "fastify";
import { getWorkflows, createWorkflow, submitToNextStage, validateTask } from "../services/workflow.service";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export const getWorkflowsHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const user = request.user as any;
    const { projet_id, titre_foncier_id, statut } = request.query as any;
    // Pour niveaux 1-2, filtrer par localite
    let localite = undefined;
    if (user.niveau_hierarchique === 1 || user.niveau_hierarchique === 2) {
      localite = user.localite?.valeur;
    }
    const workflows = await getWorkflows({
      projet_id,
      titre_foncier_id,
      statut,
      localite,
      niveau_hierarchique: user.niveau_hierarchique,
    });
    reply.status(200).send(workflows);
  } catch (error) {
    reply
      .status(500)
      .send({ error: "Erreur lors de la récupération des workflows" });
  }
};

export const createWorkflowHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { projet_id, titre_foncier_id } = request.body as any;
    const user = request.user as any; // Get the user from the request
    if (!user || !user.id) { // Add a check for the user
        return reply.status(401).send({ error: "Utilisateur non authentifié" });
    }
    const workflow = await createWorkflow(
      projet_id,
      titre_foncier_id,
      user.id // Pass the user's ID
    );
    reply.status(201).send(workflow);
  } catch (error) {
    reply.status(500).send({ error: "Erreur lors de la création du workflow" });
  }
};

export const submitToNextStageHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { workflow_id } = request.body as any;
    const user = request.user as any;

    const currentWorkflow = await prisma.workflows.findUnique({
      where: { id: workflow_id },
    });

    if (!currentWorkflow) {
      return reply.status(404).send({ error: "Workflow non trouvé" });
    }

    // Si pas de titre foncier, tenter de le créer à partir de l'extraction liée
    let titreFoncierId = currentWorkflow.titre_foncier_id;
    if (!titreFoncierId) {
      // Chercher l'extraction liée (par projet/utilisateur)
      const extraction = await prisma.extractions.findFirst({
        where: {
          projet_id: currentWorkflow.projet_id,
          utilisateur_id: currentWorkflow.utilisateur_id,
        },
        orderBy: { date_extraction: "desc" },
      });
      if (!extraction) {
        return reply.status(400).send({ error: "Aucune extraction liée au workflow." });
      }
      // Vérifier qu'on a les données nécessaires
      let d: any = extraction.donnees_extraites;
      if (typeof d === "string") {
        try {
          d = JSON.parse(d);
        } catch (e) {
          return reply.status(400).send({ error: "Impossible de parser les données d'extraction." });
        }
      }
      if (!d || typeof d !== "object" || !d.owner_name || !d.Coordonnees || !Array.isArray(d.Coordonnees) || !d.Coordonnees.length) {
        return reply.status(400).send({ error: "Impossible de créer le titre foncier : données d'extraction incomplètes." });
      }
      // Créer le titre foncier
      const titreData = {
        projet_id: extraction.projet_id,
        proprietaire: d.owner_name,
        coordonnees_gps: d.Coordonnees,
        superficie: d.area_value,
        perimetre: d.polygon && d.polygon.perimeter,
        localite: (d.localite && d.localite.valeur) || d.arrondissement_name || d.department_name,
      };
  const { TitreFoncierService } = require("../services/titreFoncier.service");
  const titreFoncierService = new TitreFoncierService();
  const titre = await titreFoncierService.createTitreFoncier(titreData, user.id);
      // Lier le titre au workflow
      await prisma.workflows.update({
        where: { id: workflow_id },
        data: { titre_foncier_id: titre.id },
      });
      titreFoncierId = titre.id;
    }

    if (!currentWorkflow.projet_id) {
      return reply
        .status(400)
        .send({ error: "Le workflow n'est pas lié à un projet." });
    }

    if (!titreFoncierId) {
      return reply.status(400).send({ error: "Impossible de déterminer ou créer le titre foncier." });
    }
    const result = await submitToNextStage(
      titreFoncierId,
      currentWorkflow.projet_id,
      user.id
    );
    reply.send(result);
  } catch (error) {
    console.error("[WORKFLOW][submitToNextStageHandler]", error);
    reply
      .status(500)
      .send({ error: "Erreur lors de la soumission à l’étape suivante", details: (error as any)?.message || String(error) });
  }
};

export const validateTaskHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params as any;
    const { statut, commentaire, piece_jointe } = request.body as any;
    const result = await validateTask(
      id,
      statut,
      commentaire,
      piece_jointe
    );
    reply.send(result);
  } catch (error) {
    reply
      .status(500)
      .send({ error: "Erreur lors de la validation de la tâche" });
  }
};
