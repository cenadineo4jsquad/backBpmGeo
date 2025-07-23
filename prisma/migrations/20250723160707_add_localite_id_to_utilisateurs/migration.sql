-- AlterTable
ALTER TABLE "utilisateurs" ADD COLUMN     "localite_id" INTEGER;

-- AddForeignKey
ALTER TABLE "utilisateurs" ADD CONSTRAINT "utilisateurs_localite_id_fkey" FOREIGN KEY ("localite_id") REFERENCES "localites"("id") ON DELETE SET NULL ON UPDATE CASCADE;
