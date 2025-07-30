import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.localites.upsert({
  where: { id: 1 },
  update: { type: 'administration', valeur: 'administration_centrale' },
  create: { id: 1, type: 'administration', valeur: 'administration_centrale' },
});
}
main().finally(() => prisma.$disconnect());