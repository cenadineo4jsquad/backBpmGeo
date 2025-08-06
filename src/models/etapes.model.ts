// Modèle pour les étapes utilisant Prisma
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class EtapeModel {
  static async createEtape(data: any) {
    return await prisma.etapes_workflow.create({ data });
  }

  static async updateEtape(id: number, data: any) {
    try {
      return await prisma.etapes_workflow.update({
        where: { id },
        data,
      });
    } catch (error) {
      return null;
    }
  }

  static async deleteEtape(id: number) {
    try {
      return await prisma.etapes_workflow.delete({
        where: { id },
      });
    } catch (error) {
      return null;
    }
  }

  static async findByProjet(projet_id: number) {
    return await prisma.etapes_workflow.findMany({
      where: { projet_id },
      orderBy: { ordre: "asc" },
    });
  }

  static async findById(id: number) {
    return await prisma.etapes_workflow.findUnique({
      where: { id },
    });
  }

  static async findAll() {
    return await prisma.etapes_workflow.findMany({
      orderBy: { ordre: "asc" },
    });
  }
}

// Export du type Prisma pour les étapes
export type Etape = {
  id: number;
  projet_id: number | null;
  nom: string;
  ordre: number;
  description: string | null;
  type_validation: string | null;
};
