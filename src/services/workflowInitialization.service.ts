import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export class WorkflowInitializationService {
  /**
   * Initialize or update workflow for a project based on its steps
   * Creates workflow entries for all project steps with proper user assignment
   */
  static async initializeProjectWorkflow(projetId: number) {
    try {
      // Get project with all steps
      const projet = await prisma.projets.findUnique({
        where: { id: projetId },
        include: {
          etapes_workflow: {
            orderBy: { ordre: "asc" },
          },
        },
      });

      if (!projet) {
        throw new Error(`Projet ${projetId} non trouvé`);
      }

      const etapes = projet.etapes_workflow;

      // Get users associated with this project through roles
      const projectUsers = await prisma.utilisateurs.findMany({
        where: {
          utilisateur_roles: {
            some: {
              roles: {
                projet_id: projetId,
              },
            },
          },
        },
      });

      // For each user, create or update their workflow
      for (const user of projectUsers) {
        await this.createOrUpdateUserWorkflow(user.id, projetId, etapes);
      }

      console.log(
        `[WORKFLOW_INIT] Workflow initialisé pour projet ${projetId} avec ${etapes.length} étapes`
      );
    } catch (error) {
      console.error("[WORKFLOW_INIT] Erreur:", error);
      throw error;
    }
  }

  /**
   * Create or update workflow for a specific user on a project
   */
  static async createOrUpdateUserWorkflow(
    utilisateurId: number,
    projetId: number,
    etapes: any[]
  ) {
    try {
      // Check if user already has workflows for this project
      const existingWorkflows = await prisma.workflows.findMany({
        where: {
          utilisateur_id: utilisateurId,
          projet_id: projetId,
        },
        orderBy: { ordre: "asc" },
      });

      // Delete existing workflows
      await prisma.workflows.deleteMany({
        where: {
          utilisateur_id: utilisateurId,
          projet_id: projetId,
        },
      });

      // Create new workflows for all steps
      for (const etape of etapes) {
        await prisma.workflows.create({
          data: {
            utilisateur_id: utilisateurId,
            projet_id: projetId,
            etape_nom: etape.nom,
            ordre: etape.ordre,
            date_debut: null,
            date_fin: null,
          },
        });
      }
    } catch (error) {
      console.error("[WORKFLOW_USER] Erreur:", error);
      throw error;
    }
  }

  /**
   * Initialize workflows for all users on a project
   * Useful for retroactive workflow creation
   */
  static async initializeAllProjectWorkflows(projetId: number) {
    try {
      const projet = await prisma.projets.findUnique({
        where: { id: projetId },
        include: {
          etapes_workflow: {
            orderBy: { ordre: "asc" },
          },
        },
      });

      if (!projet) {
        throw new Error(`Projet ${projetId} non trouvé`);
      }

      // Get users associated with this project through roles
      const projectUsers = await prisma.utilisateurs.findMany({
        where: {
          utilisateur_roles: {
            some: {
              roles: {
                projet_id: projetId,
              },
            },
          },
        },
      });

      for (const user of projectUsers) {
        await this.createOrUpdateUserWorkflow(
          user.id,
          projetId,
          projet.etapes_workflow
        );
      }
    } catch (error) {
      console.error("[WORKFLOW_ALL] Erreur:", error);
      throw error;
    }
  }
}

// Export standalone function for backward compatibility
export async function initializeProjectWorkflow(projetId: number) {
  return WorkflowInitializationService.initializeProjectWorkflow(projetId);
}
