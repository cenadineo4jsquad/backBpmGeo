import { FastifyRequest, FastifyReply } from "fastify";
import { ExtractionService } from "../services/extraction.service";

class ExtractionController {
  private extractionService: ExtractionService;

  constructor() {
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
        projetId: projet_id,
        statut,
        utilisateurId: utilisateur_id,
      });

      // Filtrage localité pour niveaux 1-2
      if ([1, 2].includes(user.niveau_hierarchique)) {
        if (!user.localites || !user.localites.type || !user.localites.valeur) {
          return reply.status(403).send({ error: "Accès interdit" });
        }
        rows = rows.filter((extraction: any) => {
          if (
            !extraction.donnees_extraites ||
            !extraction.donnees_extraites.localite
          )
            return false;
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
      const user = request.user as any;
      const data = await (request as any).file();
      // Vérification fichier présent
      if (!data) {
        return reply
          .status(400)
          .send({ error: "Fichier, projet_id ou localite manquant" });
      }
      // Vérification type fichier
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "image/webp",
        "application/pdf",
      ];
      if (!allowedTypes.includes(data.mimetype)) {
        return reply
          .status(400)
          .send({ error: "Type de fichier non supporté" });
      }
      // Vérification taille fichier (10 Mo max)
      if (data.file && data.file.truncated) {
        return reply
          .status(400)
          .send({ error: "Taille de fichier excède 10 Mo" });
      }
      if (
        data.file &&
        data.file._readableState &&
        data.file._readableState.length > 10 * 1024 * 1024
      ) {
        return reply
          .status(400)
          .send({ error: "Taille de fichier excède 10 Mo" });
      }
      // Extraction projet_id et localite
      let projet_id = undefined;
      let localite = undefined;
      if (data.fields && data.fields.projet_id) {
        projet_id = data.fields.projet_id.value || data.fields.projet_id;
      }
      if (data.fields && data.fields.localite) {
        try {
          localite =
            typeof data.fields.localite.value === "string"
              ? JSON.parse(data.fields.localite.value)
              : data.fields.localite;
        } catch (e) {
          return reply
            .status(400)
            .send({ error: "Fichier, projet_id ou localite manquant" });
        }
      }
      if (!projet_id || !localite) {
        return reply
          .status(400)
          .send({ error: "Fichier, projet_id ou localite manquant" });
      }
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
      // Appel Flask
      const flaskResult = await this.extractionService.uploadExtractionToFlask(
        data,
        projet_id
      );
      if (flaskResult && flaskResult.error) {
        return reply.status(500).send({ error: flaskResult.error });
      }
      // Construction de la réponse enrichie (mock si besoin)
      // On suppose que flaskResult contient les champs extraits attendus
      const now = new Date();
      const response = {
        id: flaskResult.id || 1,
        projet_id: Number(projet_id),
        utilisateur_id: user.id,
        fichier: flaskResult.fichier || data.filename,
        donnees_extraites:
          flaskResult.donnees_extraites || flaskResult.donnees || {},
        seuil_confiance: flaskResult.seuil_confiance || 90.0,
        statut: flaskResult.statut || "Extrait",
        date_extraction: flaskResult.date_extraction || now.toISOString(),
        // titre_foncier_id retiré car non présent dans le type
        workflow_id: flaskResult.workflow_id || 1,
      };
      reply.status(201).send(response);
    } catch (error) {
      request.log &&
        request.log.error(error, "[DEBUG] Erreur lors de l'extraction");
      reply.status(500).send({ error: "Erreur serveur" });
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

  public async submitToNextStage(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { workflow_id } = request.body as any;
      const user = request.user as { id?: number };
      if (typeof user.id !== "number") {
        reply.status(401).send({ error: "Utilisateur non authentifié" });
        return;
      }
      const submissionResult = await this.extractionService.submitToNextStage(
        workflow_id,
        user.id
      );
      reply.status(200).send(submissionResult);
    } catch (error) {
      reply
        .status(500)
        .send({ error: "Erreur lors de la soumission à l'étape suivante" });
    }
  }
}

export default new ExtractionController();
