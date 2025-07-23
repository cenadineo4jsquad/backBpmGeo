import { FastifyRequest, FastifyReply } from "fastify";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const createEtape = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { projet_id, nom, ordre, description, type_validation } =
    request.body as any;
  try {
    const newEtape = await prisma.etapes_workflow.create({
      data: { projet_id, nom, ordre, description, type_validation },
    });
    reply.status(201).send(newEtape);
  } catch (error) {
    reply.status(500).send({ error: "Erreur lors de la création de l’étape" });
  }
};

export const updateEtape = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { id } = request.params as any;
  const { nom, ordre, description, type_validation } = request.body as any;
  try {
    const updatedEtape = await prisma.etapes_workflow.update({
      where: { id: Number(id) },
      data: { nom, ordre, description, type_validation },
    });
    reply.send(updatedEtape);
  } catch (error) {
    reply
      .status(500)
      .send({ error: "Erreur lors de la mise à jour de l’étape" });
  }
};

export const deleteEtape = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { id } = request.params as any;
  try {
    await prisma.etapes_workflow.delete({ where: { id: Number(id) } });
    reply.status(204).send();
  } catch (error) {
    reply
      .status(500)
      .send({ error: "Erreur lors de la suppression de l’étape" });
  }
};

export const getEtapesByProjet = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { projet_id } = request.params as any;
  try {
    const etapes = await prisma.etapes_workflow.findMany({
      where: { projet_id: Number(projet_id) },
    });
    reply.send(etapes);
  } catch (error) {
    reply
      .status(500)
      .send({ error: "Erreur lors de la récupération des étapes" });
  }
};
