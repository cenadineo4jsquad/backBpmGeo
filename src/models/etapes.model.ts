import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class EtapeModel {
  static async createEtape(data: any) {
    return await prisma.etapes_workflow.create({ data });
  }

  static async updateEtape(id: number, data: any) {
    const etape = await prisma.etapes_workflow.findUnique({ where: { id } });
    if (!etape) return null;
    return await prisma.etapes_workflow.update({ where: { id }, data });
  }

  static async deleteEtape(id: number) {
    const etape = await prisma.etapes_workflow.findUnique({ where: { id } });
    if (!etape) return null;
    await prisma.etapes_workflow.delete({ where: { id } });
    return etape;
  }

  static async findByProjet(projet_id: number) {
    return await prisma.etapes_workflow.findMany({ where: { projet_id } });
  }
}
