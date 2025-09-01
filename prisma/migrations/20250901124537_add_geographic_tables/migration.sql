-- DropForeignKey
ALTER TABLE "public"."workflows" DROP CONSTRAINT "workflows_titre_foncier_id_fkey";

-- AlterTable
ALTER TABLE "public"."titres_fonciers" ADD COLUMN     "statut" VARCHAR(50);

-- CreateTable
CREATE TABLE "public"."regions" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,

    CONSTRAINT "regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."departements" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "region_id" INTEGER NOT NULL,

    CONSTRAINT "departements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."arrondissements" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "departement_id" INTEGER NOT NULL,

    CONSTRAINT "arrondissements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "regions_nom_key" ON "public"."regions"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "departements_nom_key" ON "public"."departements"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "arrondissements_nom_key" ON "public"."arrondissements"("nom");

-- AddForeignKey
ALTER TABLE "public"."workflows" ADD CONSTRAINT "workflows_titre_foncier_id_fkey" FOREIGN KEY ("titre_foncier_id") REFERENCES "public"."titres_fonciers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."departements" ADD CONSTRAINT "departements_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."arrondissements" ADD CONSTRAINT "arrondissements_departement_id_fkey" FOREIGN KEY ("departement_id") REFERENCES "public"."departements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
