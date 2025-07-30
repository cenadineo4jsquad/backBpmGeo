-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "projet_id" INTEGER;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_projet_id_fkey" FOREIGN KEY ("projet_id") REFERENCES "projets"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
