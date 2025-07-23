import { FastifyRequest, FastifyReply } from "fastify";
import { Projet } from "../models/projets.model";
import { AuditService } from "../services/audit.service";

export const createProject = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { nom, description } = request.body as any;
  const user = request.user as { id: number };
  try {
    const newProject = await Projet.create(nom, description);
    const auditService = new AuditService();
    await auditService.logAction(user.id, "create_project", newProject.id, {
      nom,
      description,
    });
    reply.status(201).send(newProject);
  } catch (error) {
    reply.status(500).send({ error: "Erreur lors de la création du projet" });
  }
};

export const updateProject = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { id } = request.params as any;
  const { nom, description } = request.body as any;
  const user = request.user as { id: number };
  try {
    const updatedProject = await Projet.update(Number(id), nom, description);
    const auditService = new AuditService();
    await auditService.logAction(user.id, "update_project", Number(id), {
      nom,
      description,
    });
    reply.status(200).send(updatedProject);
  } catch (error) {
    reply
      .status(500)
      .send({ error: "Erreur lors de la mise à jour du projet" });
  }
};

export const deleteProject = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { id } = request.params as any;
  const user = request.user as { id: number };
  try {
    await Projet.delete(Number(id));
    const auditService = new AuditService();
    await auditService.logAction(user.id, "delete_project", Number(id), {});
    reply.status(204).send();
  } catch (error) {
    reply
      .status(500)
      .send({ error: "Erreur lors de la suppression du projet" });
  }
};

export const getAllProjects = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const projects = await Projet.findAll();
    reply.status(200).send(projects);
  } catch (error) {
    reply
      .status(500)
      .send({ error: "Erreur lors de la récupération des projets" });
  }
};

export const getProjectById = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { id } = request.params as any;
  try {
    const project = await Projet.findById(Number(id));
    if (!project) {
      return reply.status(404).send({ error: "Projet non trouvé" });
    }
    reply.status(200).send(project);
  } catch (error) {
    reply
      .status(500)
      .send({ error: "Erreur lors de la récupération du projet" });
  }
};
