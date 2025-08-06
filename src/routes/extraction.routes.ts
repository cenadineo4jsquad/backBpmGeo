import { FastifyInstance } from "fastify";
import { rbac } from "../middlewares/rbac";
import extractionController from "../controllers/extraction.controller";
import { authenticate } from "../middlewares/authenticate";
import { restrictToFirstUser } from "../middlewares/restrictToFirstUser";
import { validateUpload } from "../middlewares/upload";
import { validateTask } from "../middlewares/validateTask";

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
    preHandler: [authenticate, rbac(4)],
    handler: extractionController.deleteExtraction,
  });

  fastify.post("/api/extraction/upload", {
    preHandler: [authenticate, restrictToFirstUser, validateUpload],
    handler: extractionController.uploadExtraction,
  });
  fastify.put("/api/extraction/:id", {
    preHandler: [authenticate, rbac(3)],
    handler: extractionController.correctExtraction,
  });
  fastify.post("/api/extraction/submit", {
    preHandler: [authenticate, rbac(2)],
    handler: extractionController.submitToNextStage,
  });

  // Ajout des routes de validation et rejet d'extraction
  fastify.post("/api/extractions/:id/valider", {
    preHandler: [authenticate, rbac(2), validateTask],
    handler: extractionController.validerExtraction,
  });
  fastify.post("/api/extractions/:id/rejeter", {
    preHandler: [authenticate, rbac(2), validateTask],
    handler: extractionController.rejeterExtraction,
  });
}
