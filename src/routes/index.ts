import { FastifyInstance } from "fastify";
import auditRoutes from "./audit.routes";
import etapesRoutes from "./etapes.routes";
import extractionRoutes from "./extraction.routes";
import flaskProxyRoutes from "./flaskProxy.routes";
import localitesRoutes from "./localites.routes";
import projetsRoutes from "./projets.routes";
import rolesRoutes from "./roles.routes";
import titresFoncierRoutes from "./titresFoncier.routes";
import utilisateursRoutes from "./utilisateurs.routes";
import workflowsRoutes from "./workflows.routes";

const routes: Array<(fastify: FastifyInstance) => Promise<void> | void> = [
  auditRoutes,
  etapesRoutes,
  extractionRoutes,
  flaskProxyRoutes,
  localitesRoutes,
  projetsRoutes,
  rolesRoutes,
  titresFoncierRoutes,
  utilisateursRoutes,
  workflowsRoutes,
];

export default routes;
