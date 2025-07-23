import { FastifyRequest, FastifyReply } from 'fastify';
import axios from 'axios';

export const proxyToFlask = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const response = await axios.post('http://flask-api/extraction/update', request.body);
    reply.send(response.data);
  } catch (error) {
    reply.code(500).send({ error: 'Erreur lors de la communication avec l’API Flask' });
  }
};