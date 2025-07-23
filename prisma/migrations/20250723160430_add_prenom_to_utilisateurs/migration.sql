-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "utilisateur_id" INTEGER,
    "action" VARCHAR(100) NOT NULL,
    "projet_id" INTEGER,
    "details" JSONB,
    "date_action" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "etapes_workflow" (
    "id" SERIAL NOT NULL,
    "projet_id" INTEGER,
    "nom" VARCHAR(100) NOT NULL,
    "ordre" INTEGER NOT NULL,
    "description" TEXT,
    "type_validation" VARCHAR(50),

    CONSTRAINT "etapes_workflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "extractions" (
    "id" SERIAL NOT NULL,
    "projet_id" INTEGER,
    "utilisateur_id" INTEGER,
    "fichier" VARCHAR(255) NOT NULL,
    "donnees_extraites" JSONB,
    "seuil_confiance" DECIMAL(5,2),
    "statut" VARCHAR(20),
    "date_extraction" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "workflow_initiated" BOOLEAN DEFAULT false,

    CONSTRAINT "extractions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "localites" (
    "id" SERIAL NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "valeur" VARCHAR(255) NOT NULL,

    CONSTRAINT "localites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" SERIAL NOT NULL,
    "role_id" INTEGER,
    "action" VARCHAR(100) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projets" (
    "id" SERIAL NOT NULL,
    "nom" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "date_creation" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "nom" VARCHAR(50) NOT NULL,
    "description" TEXT,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "titres_extractions" (
    "titre_id" INTEGER NOT NULL,
    "extraction_id" INTEGER NOT NULL,

    CONSTRAINT "titres_extractions_pkey" PRIMARY KEY ("titre_id","extraction_id")
);

-- CreateTable
CREATE TABLE "titres_fonciers" (
    "id" SERIAL NOT NULL,
    "projet_id" INTEGER,
    "proprietaire" VARCHAR(150),
    "superficie" DECIMAL(10,2),
    "perimetre" DECIMAL(10,2),
    "coordonnees_gps" JSONB,
    "centroide" JSONB,
    "date_ajout" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "titres_fonciers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "utilisateur_roles" (
    "utilisateur_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,

    CONSTRAINT "utilisateur_roles_pkey" PRIMARY KEY ("utilisateur_id","role_id")
);

-- CreateTable
CREATE TABLE "utilisateurs" (
    "id" SERIAL NOT NULL,
    "nom" VARCHAR(100) NOT NULL,
    "prenom" VARCHAR(100) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "mot_de_passe" VARCHAR(255) NOT NULL,
    "niveau_hierarchique" INTEGER NOT NULL,
    "date_creation" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "utilisateurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "validations" (
    "id" SERIAL NOT NULL,
    "extraction_id" INTEGER,
    "utilisateur_id" INTEGER,
    "statut" VARCHAR(20),
    "commentaire" TEXT,
    "date_validation" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "validations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflows" (
    "id" SERIAL NOT NULL,
    "titre_foncier_id" INTEGER,
    "projet_id" INTEGER,
    "etape_nom" VARCHAR(100),
    "ordre" INTEGER,
    "utilisateur_id" INTEGER,
    "date_debut" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "date_fin" TIMESTAMP(6),

    CONSTRAINT "workflows_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_extractions_date" ON "extractions"("date_extraction");

-- CreateIndex
CREATE INDEX "idx_extractions_statut" ON "extractions"("statut");

-- CreateIndex
CREATE UNIQUE INDEX "localites_type_valeur_key" ON "localites"("type", "valeur");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_role_id_action_key" ON "permissions"("role_id", "action");

-- CreateIndex
CREATE UNIQUE INDEX "roles_nom_key" ON "roles"("nom");

-- CreateIndex
CREATE INDEX "idx_titres_projet" ON "titres_fonciers"("projet_id");

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_email_key" ON "utilisateurs"("email");

-- CreateIndex
CREATE INDEX "idx_utilisateurs_email" ON "utilisateurs"("email");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_projet_id_fkey" FOREIGN KEY ("projet_id") REFERENCES "projets"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "etapes_workflow" ADD CONSTRAINT "etapes_workflow_projet_id_fkey" FOREIGN KEY ("projet_id") REFERENCES "projets"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "extractions" ADD CONSTRAINT "extractions_projet_id_fkey" FOREIGN KEY ("projet_id") REFERENCES "projets"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "extractions" ADD CONSTRAINT "extractions_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "titres_extractions" ADD CONSTRAINT "titres_extractions_extraction_id_fkey" FOREIGN KEY ("extraction_id") REFERENCES "extractions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "titres_extractions" ADD CONSTRAINT "titres_extractions_titre_id_fkey" FOREIGN KEY ("titre_id") REFERENCES "titres_fonciers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "titres_fonciers" ADD CONSTRAINT "titres_fonciers_projet_id_fkey" FOREIGN KEY ("projet_id") REFERENCES "projets"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "utilisateur_roles" ADD CONSTRAINT "utilisateur_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "utilisateur_roles" ADD CONSTRAINT "utilisateur_roles_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "validations" ADD CONSTRAINT "validations_extraction_id_fkey" FOREIGN KEY ("extraction_id") REFERENCES "extractions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "validations" ADD CONSTRAINT "validations_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_projet_id_fkey" FOREIGN KEY ("projet_id") REFERENCES "projets"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_titre_foncier_id_fkey" FOREIGN KEY ("titre_foncier_id") REFERENCES "extractions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
