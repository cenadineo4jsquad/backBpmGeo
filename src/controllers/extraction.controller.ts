import { FastifyRequest, FastifyReply } from "fastify";
import { ExtractionService } from "../services/extraction.service";
// import { MockExtractionService } from "../services/extraction.service.mock";

class ExtractionController {
  private extractionService: ExtractionService;

  constructor() {
    // TEMPORAIRE: Désactiver le mock pour éviter les erreurs TypeScript
    // const USE_MOCK = process.env.USE_MOCK_FLASK === 'true' || true; // Force le mock pour debug
    this.extractionService = new ExtractionService();
  }

  // Validation d'une extraction (niveau 1-3)
  public validerExtraction = async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    try {
      const { id } = request.params as any;
      const { commentaire } = request.body as any;
      const user = request.user as any;
      if (
        !user ||
        !user.niveau_hierarchique ||
        ![1, 2, 3].includes(user.niveau_hierarchique)
      ) {
        return reply.status(403).send({ error: "Accès interdit" });
      }
      await this.extractionService.validerExtraction(id);
      reply.send({ success: true, message: "Extraction validée" });
    } catch (error) {
      reply
        .status(500)
        .send({ error: "Erreur lors de la validation de l'extraction" });
    }
  };

  // Rejet d'une extraction
  public rejeterExtraction = async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    try {
      const { id } = request.params as any;
      const { commentaire } = request.body as any;
      const user = request.user as any;
      if (
        !user ||
        !user.niveau_hierarchique ||
        ![1, 2, 3].includes(user.niveau_hierarchique)
      ) {
        return reply.status(403).send({ error: "Accès interdit" });
      }
      await this.extractionService.rejeterExtraction(id);
      reply.send({ success: true, message: "Extraction rejetée" });
    } catch (error) {
      reply.status(500).send({ error: "Erreur lors du rejet de l'extraction" });
    }
  };

  // Liste toutes les extractions (filtrable par projet, statut, utilisateur)
  public getExtractions = async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    try {
      const { projet_id, statut, utilisateur_id } = request.query as any;
      const user = request.user as any;
      if (!user) {
        return reply.status(401).send({ error: "Non autorisé" });
      }

      // Récupérer toutes les extractions
      let rows = await this.extractionService.getExtractions({
        projet_id: projet_id ? parseInt(projet_id) : undefined,
        statut,
        utilisateur_id: utilisateur_id ? parseInt(utilisateur_id) : undefined,
      });

      // Filtrage localité pour niveaux 1-2
      if ([1, 2].includes(user.niveau_hierarchique)) {
        if (!user.localites || !user.localites.type || !user.localites.valeur) {
          return reply.status(403).send({ error: "Accès interdit" });
        }
        rows = rows.filter((extraction: any) => {
          // Si l'extraction a été créée par l'utilisateur actuel, l'autoriser
          if (extraction.utilisateur_id === user.id) {
            return true;
          }

          // Sinon, vérifier la localité dans les données extraites
          if (
            !extraction.donnees_extraites ||
            !extraction.donnees_extraites.localite
          ) {
            // Si pas de localité dans les données extraites, rejeter
            return false;
          }

          return (
            extraction.donnees_extraites.localite.type ===
              user.localites.type &&
            extraction.donnees_extraites.localite.valeur ===
              user.localites.valeur
          );
        });
      }

      // Format strict de la réponse
      const formatted = rows.map((row: any) => ({
        id: row.id,
        projet_id: row.projet_id,
        utilisateur_id: row.utilisateur_id,
        fichier: row.fichier,
        donnees_extraites: row.donnees_extraites,
        seuil_confiance: row.seuil_confiance,
        statut: row.statut,
        date_extraction:
          row.date_extraction instanceof Date
            ? row.date_extraction.toISOString()
            : row.date_extraction,
        // titre_foncier_id retiré car non présent dans le type
      }));
      reply.send(formatted);
    } catch (error) {
      reply
        .status(500)
        .send({ error: "Erreur lors de la récupération des extractions" });
    }
  };

  // Détail d'une extraction
  public getExtractionById = async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    try {
      const { id } = request.params as any;
      const user = request.user as any;
      if (!user) {
        return reply.status(401).send({ error: "Non autorisé" });
      }
      const extraction = await this.extractionService.getExtractionById(id);
      if (!extraction) {
        return reply.status(404).send({ error: "Extraction non trouvée" });
      }
      // RBAC : seul l'utilisateur assigné ou niveau 3/4
      if (
        user.niveau_hierarchique !== 3 &&
        user.niveau_hierarchique !== 4 &&
        extraction.utilisateur_id !== user.id
      ) {
        return reply.status(403).send({ error: "Accès interdit" });
      }
      // Format strict de la réponse
      const formatted = {
        id: extraction.id,
        projet_id: extraction.projet_id,
        utilisateur_id: extraction.utilisateur_id,
        fichier: extraction.fichier,
        donnees_extraites: extraction.donnees_extraites,
        seuil_confiance: extraction.seuil_confiance,
        statut: extraction.statut,
        date_extraction:
          extraction.date_extraction instanceof Date
            ? extraction.date_extraction.toISOString()
            : extraction.date_extraction,
        // titre_foncier_id retiré car non présent dans le type
      };
      reply.send(formatted);
    } catch (error) {
      reply
        .status(500)
        .send({ error: "Erreur lors de la récupération de l'extraction" });
    }
  };

  // Suppression d'une extraction
  public deleteExtraction = async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    try {
      const { id } = request.params as any;
      await this.extractionService.deleteExtraction(id);
      reply.send({ success: true });
    } catch (error) {
      reply
        .status(500)
        .send({ error: "Erreur lors de la suppression de l'extraction" });
    }
  };

  public uploadExtraction = async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    try {
      console.log("[DEBUG] uploadExtraction: Début du traitement");
      const user = request.user as any;

      // Parser tous les parts du multipart form-data
      const parts = request.parts();
      let fileData = null;
      let projet_id = null;
      let localite = null;

      // Traiter chaque part
      for await (const part of parts) {
        console.log("[DEBUG] uploadExtraction: Part détectée:", {
          fieldname: part.fieldname,
          type: part.type,
          filename: part.type === "file" ? (part as any).filename : "N/A",
        });

        if (part.type === "file") {
          // C'est le fichier - on doit le convertir en Buffer
          console.log(
            "[DEBUG] uploadExtraction: Conversion du fichier en Buffer..."
          );

          const chunks: Buffer[] = [];
          for await (const chunk of part.file) {
            chunks.push(chunk);
          }
          const fileBuffer = Buffer.concat(chunks);

          fileData = {
            buffer: fileBuffer,
            filename: (part as any).filename,
            mimetype: (part as any).mimetype,
            fieldname: part.fieldname,
          };

          console.log("[DEBUG] uploadExtraction: Fichier converti:", {
            fieldname: part.fieldname,
            filename: (part as any).filename,
            mimetype: (part as any).mimetype,
            size: fileBuffer.length + " bytes",
          });
        } else {
          // C'est un champ de formulaire
          const value = part.value;
          console.log("[DEBUG] uploadExtraction: Champ trouvé:", {
            fieldname: part.fieldname,
            value: value,
          });

          if (part.fieldname === "projet_id") {
            projet_id = value;
          } else if (part.fieldname === "localite") {
            try {
              localite = typeof value === "string" ? JSON.parse(value) : value;
            } catch (e) {
              console.log(
                "[DEBUG] uploadExtraction: Erreur parsing localite:",
                e
              );
              return reply
                .status(400)
                .send({ error: "Format localite invalide" });
            }
          }
        }
      }

      console.log("[DEBUG] uploadExtraction: Données finales parsées:", {
        hasFile: !!fileData,
        projet_id: projet_id,
        localite: localite,
      });

      // Vérifications
      if (!fileData) {
        console.log("[DEBUG] uploadExtraction: Aucun fichier trouvé");
        return reply.status(400).send({ error: "Fichier manquant" });
      }

      if (!projet_id || !localite) {
        console.log("[DEBUG] uploadExtraction: projet_id ou localite manquant");
        return reply
          .status(400)
          .send({ error: "projet_id ou localite manquant" });
      }
      // Vérification type fichier
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "image/webp",
        "application/pdf",
      ];
      if (!allowedTypes.includes((fileData as any).mimetype)) {
        return reply
          .status(400)
          .send({ error: "Type de fichier non supporté" });
      }
      // Supprimons les vérifications de taille pour simplifier

      // Vérification localité autorisée (si niveau 1 ou 2)
      if ([1, 2].includes(user.niveau_hierarchique)) {
        if (!user.localites || !user.localites.type || !user.localites.valeur) {
          return reply.status(403).send({ error: "Localité non autorisée" });
        }
        if (
          user.localites.type !== localite.type ||
          user.localites.valeur !== localite.valeur
        ) {
          return reply.status(403).send({ error: "Localité non autorisée" });
        }
      }
      // TODO: Vérification permission individuelle (permissions_upload)

      // Appel Flask avec gestion améliorée des réponses
      console.log("[DEBUG] uploadExtraction: Appel du service Flask...");
      console.log("[DEBUG] uploadExtraction: Timeout configuré à 5 minutes");
      const flaskStartTime = Date.now();

      const flaskResult = await this.extractionService.uploadExtractionToFlask(
        fileData as any,
        parseInt(projet_id as string)
      );

      const flaskEndTime = Date.now();
      const flaskDuration = flaskEndTime - flaskStartTime;
      console.log(
        `[DEBUG] uploadExtraction: Réponse du service Flask reçue en ${Math.round(
          flaskDuration / 1000
        )} secondes`,
        flaskResult
      );

      // Gestion des différents types de réponses Flask
      if (flaskResult && flaskResult.error) {
        console.log(
          "[DEBUG] uploadExtraction: Erreur Flask détectée:",
          flaskResult.error
        );

        // Retourner une réponse d'erreur détaillée au frontend
        return reply.status(500).send({
          error: "Erreur du service d'extraction",
          details: flaskResult.error,
          flask_status: flaskResult.status,
          type: flaskResult.timeout
            ? "timeout"
            : flaskResult.flask_unreachable
            ? "unreachable"
            : "processing_error",
          message: flaskResult.timeout
            ? "Le service d'extraction prend plus de 5 minutes à répondre. Votre fichier est peut-être en cours de traitement."
            : flaskResult.flask_unreachable
            ? "Le service d'extraction n'est pas disponible actuellement."
            : "Erreur lors du traitement de votre fichier.",
          suggestion: flaskResult.timeout
            ? "Veuillez réessayer dans quelques minutes ou contactez l'administrateur."
            : "Contactez l'administrateur si le problème persiste.",
        });
      }

      console.log(
        "[DEBUG] uploadExtraction: Succès Flask, sauvegarde en base de données..."
      );

      // Debug: Afficher la structure complète de flaskResult
      console.log("[DEBUG] uploadExtraction: Structure Flask complète:", {
        keys: Object.keys(flaskResult),
        hasResults: !!flaskResult.results,
        hasFilename: !!flaskResult.filename,
        results: flaskResult.results,
      });

      // Préparer les données à sauvegarder en base
      const donneesExtraites =
        flaskResult.results ||
        flaskResult.donnees_extraites ||
        flaskResult.donnees ||
        {};

      // Ajouter la localité aux données extraites pour le filtrage futur
      const donneesAvecLocalite = {
        ...donneesExtraites,
        localite: localite,
      };

      // Sauvegarder en base de données
      console.log("[DEBUG] uploadExtraction: Sauvegarde en base...");
      const extractionSauvegardee =
        await this.extractionService.createExtraction({
          projet_id: Number(projet_id),
          utilisateur_id: user.id,
          fichier: flaskResult.filename || (fileData as any).filename,
          donnees_extraites: donneesAvecLocalite,
          seuil_confiance: flaskResult.seuil_confiance || 90.0,
          statut: flaskResult.status === "success" ? "Extrait" : "Extrait",
        });

      console.log(
        "[DEBUG] uploadExtraction: Extraction sauvegardée avec ID:",
        extractionSauvegardee.id
      );

      // Construction de la réponse finale
      const response = {
        id: extractionSauvegardee.id,
        projet_id: extractionSauvegardee.projet_id,
        utilisateur_id: extractionSauvegardee.utilisateur_id,
        fichier: extractionSauvegardee.fichier,
        donnees_extraites: extractionSauvegardee.donnees_extraites,
        seuil_confiance: extractionSauvegardee.seuil_confiance,
        statut: extractionSauvegardee.statut,
        date_extraction:
          extractionSauvegardee.date_extraction instanceof Date
            ? extractionSauvegardee.date_extraction.toISOString()
            : extractionSauvegardee.date_extraction,
        flask_processing_time: Math.round(flaskDuration / 1000) + "s",
        success: true,
      };

      console.log(
        "[DEBUG] uploadExtraction: Envoi de la réponse au frontend:",
        response
      );
      reply.status(201).send(response);
    } catch (error: any) {
      console.log(
        "[DEBUG] uploadExtraction: Erreur capturée dans le catch principal:",
        error
      );
      console.log("[DEBUG] uploadExtraction: Type d'erreur:", typeof error);
      console.log("[DEBUG] uploadExtraction: Message d'erreur:", error.message);
      console.log("[DEBUG] uploadExtraction: Stack trace:", error.stack);

      request.log &&
        request.log.error(error, "[DEBUG] Erreur lors de l'extraction");

      // Retourner une erreur plus détaillée
      reply.status(500).send({
        error: "Erreur lors du traitement de l'upload",
        details: error.message || error.toString(),
        type: "backend_error",
        timestamp: new Date().toISOString(),
      });
    }
  };

  public async correctExtraction(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { id } = request.params as any;
      const user = request.user as any;
      if (!user) {
        return reply.status(401).send({ error: "Non autorisé" });
      }
      const extraction = await this.extractionService.getExtractionById(id);
      if (!extraction) {
        return reply.status(404).send({ error: "Extraction non trouvée" });
      }
      // RBAC : seul l'utilisateur assigné ou niveau 3/4
      if (
        user.niveau_hierarchique !== 3 &&
        user.niveau_hierarchique !== 4 &&
        extraction.utilisateur_id !== user.id
      ) {
        return reply.status(403).send({ error: "Accès interdit" });
      }
      const { donnees_extraites, statut } = request.body as any;
      if (!donnees_extraites || typeof donnees_extraites !== "object") {
        return reply.status(400).send({ error: "Données invalides" });
      }
      // Mise à jour
      const updated = await this.extractionService.correctExtraction(id, {
        donnees_extraites,
        statut: statut || "Corrigé",
      });
      // Format strict de la réponse
      const formatted = {
        id: updated.id,
        projet_id: updated.projet_id,
        utilisateur_id: updated.utilisateur_id,
        fichier: updated.fichier,
        donnees_extraites: updated.donnees_extraites,
        seuil_confiance: updated.seuil_confiance,
        statut: updated.statut,
        date_extraction:
          updated.date_extraction instanceof Date
            ? updated.date_extraction.toISOString()
            : updated.date_extraction,
        // titre_foncier_id retiré car non présent dans le type
      };
      reply.status(200).send(formatted);
    } catch (error) {
      reply
        .status(500)
        .send({ error: "Erreur lors de la correction de l'extraction" });
    }
  }

  public submitToNextStage = async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    try {
      console.log("[SUBMIT] Début submitToNextStage");
      const { workflow_id } = request.body as any;
      const user = request.user as { id?: number };

      console.log("[SUBMIT] Données reçues:", {
        workflow_id,
        user_id: user.id,
      });

      if (typeof user.id !== "number") {
        console.log("[SUBMIT] Utilisateur non authentifié");
        reply.status(401).send({ error: "Utilisateur non authentifié" });
        return;
      }

      console.log("[SUBMIT] Appel du service submitToNextStage...");
      const submissionResult = await this.extractionService.submitToNextStage(
        workflow_id,
        user.id
      );

      console.log("[SUBMIT] Résultat du service:", submissionResult);
      reply.status(200).send(submissionResult);
    } catch (error: any) {
      console.error("[SUBMIT] Erreur détaillée:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      reply.status(500).send({
        error: "Erreur lors de la soumission à l'étape suivante",
        details: error.message,
      });
    }
  };
}

export default new ExtractionController();
