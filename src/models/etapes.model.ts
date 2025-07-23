import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config';

class Etape extends Model {
  static async createEtape(data: any) {
    return await Etape.create(data);
  }

  static async updateEtape(id: number, data: any) {
    const etape = await Etape.findByPk(id);
    if (!etape) return null;
    await etape.update(data);
    return etape;
  }

  static async deleteEtape(id: number) {
    const etape = await Etape.findByPk(id);
    if (!etape) return null;
    await etape.destroy();
    return etape;
  }

  static async findByProjet(projet_id: number) {
    return await Etape.findAll({ where: { projet_id } });
  }
import { Etape } from '@prisma/client';
export type { Etape };