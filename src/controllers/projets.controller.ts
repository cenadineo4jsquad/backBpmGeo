import { FastifyRequest, FastifyReply } from "fastify";
import { Projet } from "../models/projets.model";
import { AuditService } from "../services/audit.service";

export const createProject = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { nom, description } = request.body as any;
  const userRaw = request.user;
  if (!userRaw || typeof userRaw !== "object") {
    return reply.status(401).send({ error: "Non autorisé" });
  }
  const user = userRaw as { id: number; niveau_hierarchique: number };
  if (user.niveau_hierarchique !== 4) {
    return reply.status(403).send({ error: "Réservé aux administrateurs" });
  }
  if (!nom || nom.trim() === "") {
    return reply.status(400).send({ error: "Nom de projet requis" });
  }
  try {
    const newProject = await Projet.create(nom, description);
    const auditService = new AuditService();
    await auditService.logAction(user.id, "create_project", newProject.id, {
      nom,
      description,
    });
    // Formatage de la réponse comme dans la doc
    reply.status(201).send({
      id: newProject.id,
      nom: newProject.nom,
      description: newProject.description,
      date_creation: newProject.date_creation,
    });
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
  const userRaw = request.user;
  if (!userRaw || typeof userRaw !== "object") {
    return reply.status(401).send({ error: "Non autorisé" });
  }
  const user = userRaw as { id: number; niveau_hierarchique: number };
  if (user.niveau_hierarchique !== 4) {
    return reply.status(403).send({ error: "Réservé aux administrateurs" });
  }
  if (!nom || nom.trim() === "") {
    return reply.status(400).send({ error: "Nom de projet requis" });
  }
  try {
    // Vérifier que le projet existe
    const existing = await Projet.findById(Number(id));
    if (!existing) {
      return reply.status(404).send({ error: "Projet non trouvé" });
    }
    const updatedProject = await Projet.update(Number(id), nom, description);
    const auditService = new AuditService();
    await auditService.logAction(user.id, "update_project", Number(id), {
      nom,
      description,
    });
    // Formatage de la réponse comme dans la doc
    reply.status(200).send({
      id: updatedProject.id,
      nom: updatedProject.nom,
      description: updatedProject.description,
      date_creation: updatedProject.date_creation,
    });
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
  const userRaw = request.user;
  if (!userRaw || typeof userRaw !== "object") {
    return reply.status(401).send({ error: "Non autorisé" });
  }
  const user = userRaw as { id: number; niveau_hierarchique: number };
  if (user.niveau_hierarchique !== 4) {
    return reply.status(403).send({ error: "Réservé aux administrateurs" });
  }
  try {
    // Vérifier que le projet existe
    const existing = await Projet.findById(Number(id));
    if (!existing) {
      return reply.status(404).send({ error: "Projet non trouvé" });
    }
    await Projet.delete(Number(id));
    const auditService = new AuditService();
    await auditService.logAction(user.id, "delete_project", Number(id), {});
    reply.status(200).send({ success: true });
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
  const userRaw = request.user;
  if (!userRaw || typeof userRaw !== "object") {
    return reply.status(401).send({ error: "Non autorisé" });
  }
  const user = userRaw as {
    niveau_hierarchique: number;
    localite?: { type: string; valeur: string };
  };
  try {
    let projects;
    if (user.niveau_hierarchique === 1 || user.niveau_hierarchique === 2) {
      // Filtrage par localité pour les niveaux 1 et 2
      projects = await Projet.findAllByLocalite(user.localite);
    } else {
      projects = await Projet.findAll();
    }
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
  const userRaw = request.user;
  if (!userRaw || typeof userRaw !== "object") {
    return reply.status(401).send({ error: "Non autorisé" });
  }
  const user = userRaw as {
    niveau_hierarchique: number;
    localite?: { type: string; valeur: string };
  };
  try {
    let project: any = null;
    if (user.niveau_hierarchique === 1 || user.niveau_hierarchique === 2) {
      // Filtrer par localité pour niveaux 1-2
      const projets = await Projet.findAllByLocalite(user.localite);
      project = projets.find((p: any) => p.id === Number(id));
    } else {
      project = await Projet.findById(Number(id));
    }
    if (!project) {
      return reply.status(404).send({ error: "Projet non trouvé" });
    }
    // Formatage de la réponse comme dans la doc
    reply.status(200).send({
      id: project.id,
      nom: project.nom,
      description: project.description,
      date_creation: project.date_creation,
    });
  } catch (error) {
    reply
      .status(500)
      .send({ error: "Erreur lors de la récupération du projet" });
  }
};
