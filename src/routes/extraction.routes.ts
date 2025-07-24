import { FastifyInstance } from "fastify";
import extractionController from "../controllers/extraction.controller";
import { authenticate } from "../middlewares/authenticate";
import { restrictToFirstUser } from "../middlewares/restrictToFirstUser";

export default async function (fastify: FastifyInstance) {
  fastify.get("/api/extractions", {
    preHandler: [authenticate],
    handler: extractionController.getExtractions,
  });
  fastify.get("/api/extractions/:id", {
    preHandler: [authenticate],
    handler: extractionController.getExtractionById,
  });
  fastify.delete("/api/extractions/:id", {
    preHandler: [authenticate],
    handler: extractionController.deleteExtraction,
  });

  fastify.post("/api/extraction/upload", {
    preHandler: [authenticate, restrictToFirstUser],
    handler: extractionController.uploadExtraction,
  });
  fastify.put("/api/extraction/:id", {
    preHandler: [authenticate],
    handler: extractionController.correctExtraction,
  });
  fastify.post("/api/extraction/submit", {
    preHandler: [authenticate],
    handler: extractionController.submitToNextStage,
  });

  // Ajout des routes de validation et rejet d'extraction
  fastify.post("/api/extractions/:id/valider", {
    preHandler: [authenticate],
    handler: extractionController.validerExtraction,
  });
  fastify.post("/api/extractions/:id/rejeter", {
    preHandler: [authenticate],
    handler: extractionController.rejeterExtraction,
  });
}
