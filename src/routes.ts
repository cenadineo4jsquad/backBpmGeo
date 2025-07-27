import { FastifyInstance } from "fastify";

import auditRoutes from "./routes/audit.routes";
import adminRoutes from "./routes/admin.routes";
import etapesRoutes from "./routes/etapes.routes";
import extractionRoutes from "./routes/extraction.routes";
import flaskProxyRoutes from "./routes/flaskProxy.routes";
import localitesRoutes from "./routes/localites.routes";
import projetsRoutes from "./routes/projets.routes";
import rolesRoutes from "./routes/roles.routes";
import titresFoncierRoutes from "./routes/titresFoncier.routes";
import utilisateursRoutes from "./routes/utilisateurs.routes";
import workflowsRoutes from "./routes/workflows.routes";

const routes: Array<(fastify: FastifyInstance) => Promise<void> | void> = [
  auditRoutes,
  adminRoutes,
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
