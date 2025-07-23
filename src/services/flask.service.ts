import axios from 'axios';
import { Request, Response } from 'express';

const FLASK_API_URL = process.env.FLASK_API_URL || 'http://localhost:5000/flask/extraction';

export const updateExtractionData = async (data: any) => {
    try {
        const response = await axios.post(`${FLASK_API_URL}/update`, data);
        return response.data;
    } catch (error) {
        throw new Error(`Error communicating with Flask API: ${error.message}`);
    }
};

export const proxyFlaskUpdate = async (req: Request, res: Response) => {
    try {
        const response = await axios.post(`${FLASK_API_URL}/update`, req.body);
        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(500).json({ error: `Error communicating with Flask API: ${error.message}` });
    }
};