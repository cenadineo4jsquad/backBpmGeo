-- AlterTable
ALTER TABLE "projets" ADD COLUMN     "localite_id" INTEGER;

-- AlterTable
ALTER TABLE "titres_fonciers" ADD COLUMN     "localite" TEXT,
ADD COLUMN     "perimetre_m" DECIMAL,
ADD COLUMN     "surface_m2" DECIMAL;

-- AddForeignKey
ALTER TABLE "projets" ADD CONSTRAINT "projets_localite_id_fkey" FOREIGN KEY ("localite_id") REFERENCES "localites"("id") ON DELETE SET NULL ON UPDATE CASCADE;
