import { FastifyInstance } from "fastify";
import { proxyToFlask } from "../controllers/flaskProxy.controller";
import { authenticate } from "../middlewares/authenticate";

const flaskProxyRoutes = async (app: FastifyInstance) => {
  app.post("/api/extraction/update_external", {
    preHandler: [authenticate],
    handler: proxyToFlask,
  });
};

export default flaskProxyRoutes;
