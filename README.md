# BPM Extraction Backend

## Description
This project is a custom Business Process Management (BPM) system designed for the automatic extraction and structuring of geospatial data from digitized land titles. It utilizes Fastify.js for the backend and PostgreSQL as the database. The system integrates Optical Character Recognition (OCR) using Tesseract and fuzzy matching with fuzzywuzzy to handle text extraction with a focus on accuracy.

## Features
- **User Management**: Hierarchical user roles with permissions for administrators and users.
- **Data Extraction**: Upload and extract data from images of land titles.
- **Workflow Management**: Structured workflows for data validation and approval.
- **Integration**: Communicates with an external Flask API for data updates.
- **Audit Logging**: Tracks actions for accountability and traceability.
- **Geospatial Data Handling**: Utilizes PostGIS for spatial data management.

## Project Structure
- **src/**: Contains the main application code.
  - **app.ts**: Entry point of the application.
  - **server.ts**: Server configuration and initialization.
  - **config/**: Configuration files.
  - **controllers/**: Business logic for handling requests.
  - **routes/**: API route definitions.
  - **middlewares/**: Custom middleware for authentication and authorization.
  - **models/**: Database models and schemas.
  - **services/**: Business logic and interactions with external services.
  - **utils/**: Utility functions and helpers.
  - **types/**: Type definitions for TypeScript.

- **prisma/**: Contains the Prisma schema for database modeling.
- **package.json**: Project dependencies and scripts.
- **tsconfig.json**: TypeScript configuration.
- **.env**: Environment variables for configuration.
- **README.md**: Project documentation.

## Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd bpm-extraction-backend
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Set up the environment variables in the `.env` file.
5. Run the application:
   ```
   npm start
   ```

## Usage
- Access the API documentation to explore available endpoints.
- Ensure that the PostgreSQL database is running and properly configured.
- Use the provided endpoints for user management, data extraction, and workflow operations.

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for more details.