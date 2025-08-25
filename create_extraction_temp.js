const axios = require('axios');
const FormData = require('form-data');

const API_URL = 'http://localhost:3000/api';
const ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsImVtYWlsIjoic3RlZXZlQGdtYWlsLmNvbSIsInJvbGUiOiJFeHRyYWN0ZXVyX3Rlc3QiLCJuaXZlYXVfaGllcmFyY2hpcXVlIjoxLCJpYXQiOjE3NTU5MDI4ODMsImV4cCI6MTc1NTkwNjQ4M30.EUsRQU3WQpKpW50LvBvTvkQpE3r8mUrC4uN78nSvyWA';
const PROJET_ID = 12;
const LOCALITE = {"id":57,"type":"arrondissement","valeur":"Soa"};

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
