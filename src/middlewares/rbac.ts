import { FastifyRequest, FastifyReply } from 'fastify';

const rbac = (requiredRole: number) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user;

    if (!user || user.niveau_hierarchique < requiredRole) {
      return reply.code(403).send({ error: 'Accès non autorisé' });
    }
  };
};

export default rbac;