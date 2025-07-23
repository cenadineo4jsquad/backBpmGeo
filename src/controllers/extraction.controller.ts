import { FastifyRequest, FastifyReply } from "fastify";
import { ExtractionService } from "../services/extraction.service";

class ExtractionController {
  private extractionService: ExtractionService;

  constructor() {
    this.extractionService = new ExtractionService();
  }

  public async uploadExtraction(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { projet_id, localite } = request.body as any;
      const file = (request as any).file;

      if (!file) {
        reply.status(400).send({ error: "Fichier requis" });
        return;
      }

      const extractionResult = await this.extractionService.uploadExtraction(
        file,
        projet_id,
        localite
      );
      reply.status(201).send(extractionResult);
    } catch (error) {
      reply
        .status(500)
        .send({ error: "Erreur lors de l'extraction des données" });
    }
  }

  public async correctExtraction(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { id } = request.params as any;
      const correctionData = request.body as any;

      const updatedExtraction = await this.extractionService.correctExtraction(
        id,
        correctionData
      );
      reply.status(200).send(updatedExtraction);
    } catch (error) {
      reply
        .status(500)
        .send({ error: "Erreur lors de la correction de l'extraction" });
    }
  }

  public async submitToNextStage(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { workflow_id } = request.body as any;
      const user = request.user as { id?: number };
      if (typeof user.id !== "number") {
        reply.status(401).send({ error: "Utilisateur non authentifié" });
        return;
      }
      const submissionResult = await this.extractionService.submitToNextStage(
        workflow_id,
        user.id
      );
      reply.status(200).send(submissionResult);
    } catch (error) {
      reply
        .status(500)
        .send({ error: "Erreur lors de la soumission à l'étape suivante" });
    }
  }
}

export default new ExtractionController();
