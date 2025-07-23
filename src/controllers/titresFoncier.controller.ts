import { FastifyRequest, FastifyReply } from "fastify";
import { TitreFoncierService } from "../services/titreFoncier.service";

const titreFoncierService = new TitreFoncierService();

export const getTitresFoncier = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { localite, niveau_hierarchique } = request.user as any;
    const titres = await titreFoncierService.getTitresFoncier(
      localite,
      niveau_hierarchique
    );
    reply.status(200).send(titres);
  } catch (error) {
    reply
      .status(500)
      .send({ error: "Erreur lors de la récupération des titres fonciers" });
  }
};

export const getTitreFoncierById = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { id } = request.params as any;
  try {
    const titre = await titreFoncierService.getTitreFoncierById(Number(id));
    if (!titre) {
      return reply.status(404).send({ error: "Titre foncier non trouvé" });
    }
    reply.status(200).send(titre);
  } catch (error) {
    reply
      .status(500)
      .send({ error: "Erreur lors de la récupération du titre foncier" });
  }
};

export const updateTitreFoncier = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { id } = request.params as any;
  const {
    proprietaire,
    coordonnees_gps,
    surface_m2,
    perimetre_m,
    projet_id,
    localite,
  } = request.body as any;
  const user = request.user as any;
  try {
    const data = {
      id: Number(id),
      projet_id: projet_id ?? null,
      proprietaire,
      coordonnees_gps,
      surface_m2,
      perimetre_m,
      localite: localite ?? null,
    };
    const updatedTitre = await titreFoncierService.updateTitreFoncier(
      Number(id),
      data,
      user.id
    );
    if (!updatedTitre) {
      return reply.status(404).send({ error: "Titre foncier non trouvé" });
    }
    reply.status(200).send(updatedTitre);
  } catch (error) {
    reply
      .status(500)
      .send({ error: "Erreur lors de la mise à jour du titre foncier" });
  }
};
