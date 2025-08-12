const fetch = require("node-fetch");
const FormData = require("form-data");
const fs = require("fs");

const API_URL = "http://localhost:3000/api/extraction/upload";
const JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjIsImVtYWlsIjoiYWxpY2VAZXhlbXBsZS5jb20iLCJyb2xlIjoidXNlckV4dHJhY3QiLCJuaXZlYXVfaGllcmFyY2hpcXVlIjoxLCJpYXQiOjE3NTQ5MTQ3MTUsImV4cCI6MTc1NDkxODMxNX0.6xHlGwGfcng373YKjqbq8dxHwhzUHQdfkbbzneOomMs";
const FILE_PATH = "/Users/Cenadi-Squad/Pictures/";
const PROJET_ID = 29;
const LOCALITE = { type: "arrondissement", valeur: "Nkolafamba" };

async function main() {
  const form = new FormData();
  form.append("projet_id", PROJET_ID);
  form.append("localite", JSON.stringify(LOCALITE));
  form.append("file", fs.createReadStream(FILE_PATH));

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${JWT}`,
      ...form.getHeaders(),
    },
    body: form,
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  console.log("Fichier utilisé:", FILE_PATH, fs.existsSync(FILE_PATH));
  console.log("Status:", res.status);
  console.log("Réponse:", data);
}

main().catch(console.error);
