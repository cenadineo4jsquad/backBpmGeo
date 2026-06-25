import axios from 'axios';
import { FastifyRequest, FastifyReply } from 'fastify';

const FLASK_API_URL = process.env.FLASK_API_URL || 'http://localhost:5000/flask/extraction';

export const updateExtractionData = async (data: any) => {
    try {
        const response = await axios.post(`${FLASK_API_URL}/update`, data);
        return response.data;
    } catch (error: any) {
        throw new Error(`Error communicating with Flask API: ${error.message}`);
    }
};

export const proxyFlaskUpdate = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
        const response = await axios.post(`${FLASK_API_URL}/update`, req.body);
        reply.status(response.status).send(response.data);
    } catch (error: any) {
        reply.status(500).send({ error: `Error communicating with Flask API: ${error.message}` });
    }
};
