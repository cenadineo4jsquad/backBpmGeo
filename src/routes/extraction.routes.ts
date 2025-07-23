import { FastifyInstance } from "fastify";
import extractionController from "../controllers/extraction.controller";
import { authenticate } from "../middlewares/authenticate";
import { restrictToFirstUser } from "../middlewares/restrictToFirstUser";

export default async function (fastify: FastifyInstance) {
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
}
