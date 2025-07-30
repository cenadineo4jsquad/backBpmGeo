import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export class Projet {
  id: number;
  nom: string;
  description: string;
  date_creation: Date;

  constructor(
    id: number,
    nom: string,
    description: string | null,
    date_creation: Date
  ) {
    this.id = id;
    this.nom = nom;
    this.description = description ?? "";
    this.date_creation = date_creation;
  }

  static async create(nom: string, description: string): Promise<Projet> {
    const result = await prisma.projets.create({
      data: { nom, description },
    });
    return new Projet(
      result.id,
      result.nom,
      result.description,
      result.date_creation ?? new Date()
    );
  }

  static async update(
    id: number,
    nom: string,
    description: string
  ): Promise<Projet> {
    const result = await prisma.projets.update({
      where: { id },
      data: { nom, description },
    });
    return new Projet(
      result.id,
      result.nom,
      result.description,
      result.date_creation ?? new Date()
    );
  }

  static async delete(id: number): Promise<void> {
    await prisma.projets.delete({ where: { id } });
  }

  static async findById(id: number): Promise<Projet | null> {
    const result = await prisma.projets.findUnique({ where: { id } });
    if (!result) return null;
    return new Projet(
      result.id,
      result.nom,
      result.description,
      result.date_creation ?? new Date()
    );
  }

  static async findAll(): Promise<Projet[]> {
    const results = await prisma.projets.findMany();
    return results.map(
      (row) =>
        new Projet(
          row.id,
          row.nom,
          row.description ?? "",
          row.date_creation ?? new Date()
        )
    );
  }

  static async findAllByLocalite(
    localite: { type: string; valeur: string } | undefined
  ): Promise<Projet[]> {
    if (!localite) {
      return [];
    }
    // Hypothèse : la table projets a une colonne localite_type et localite_valeur (sinon à adapter)
    const results = await prisma.projets.findMany({
      where: {
        localite_id: localite ? parseInt(localite.valeur) : undefined,
      },
    });
    return results.map(
      (row) =>
        new Projet(
          row.id,
          row.nom,
          row.description ?? "",
          row.date_creation ?? new Date()
        )
    );
  }
}
