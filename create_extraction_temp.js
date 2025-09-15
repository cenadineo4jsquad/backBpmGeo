const axios = require('axios');
const FormData = require('form-data');

const API_URL = 'http://localhost:3000/api';
const ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ODAsImVtYWlsIjoidXNlcjJAZXhhbXBsZS5jb20iLCJyb2xlIjoidmFsaWQiLCJuaXZlYXVfaGllcmFyY2hpcXVlIjoxLCJpYXQiOjE3NTc5NDk5NzgsImV4cCI6MTc1Nzk1MzU3OH0.bPEmwnqslOeCF8ueDUFGsS3R6NW4L0n9nXdEAa5L2us';
const PROJET_ID = 38;
const LOCALITE = {"id":926,"type":"arrondissement","valeur":"Soa"};

async function createExtraction() {
    const form = new FormData();

    // Create a dummy file buffer
    const dummyFileContent = 'This is a dummy file for extraction.';
    const dummyFileName = 'dummy_extraction.pdf';
    const dummyMimeType = 'application/pdf';

    form.append('file', Buffer.from(dummyFileContent), {
        filename: dummyFileName,
        contentType: dummyMimeType,
    });
    form.append('projet_id', PROJET_ID);
    form.append('localite', JSON.stringify(LOCALITE));

    try {
        console.log('Attempting to create extraction...');
        const response = await axios.post(`${API_URL}/extraction/upload`, form, {
            headers: {
                ...form.getHeaders(),
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
            },
            maxBodyLength: Infinity, // Important for large files
        });
        console.log('Extraction created successfully:');
        console.log(response.data);
    } catch (error) {
        console.error('Failed to create extraction:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

createExtraction();
