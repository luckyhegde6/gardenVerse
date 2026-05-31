-- AlterTable
ALTER TABLE "Crop" ADD COLUMN     "careStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalCareCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "PlantSpecies" ADD COLUMN     "baseYield" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "companionSpeciesIds" TEXT[],
ADD COLUMN     "growthTimeHours" INTEGER,
ADD COLUMN     "hybridRecipe" JSONB,
ADD COLUMN     "isHybrid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tokensPerHarvest" INTEGER NOT NULL DEFAULT 10;

-- CreateTable
CREATE TABLE "PlantCollection" (
    "id" UUID NOT NULL,
    "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timesPlanted" INTEGER NOT NULL DEFAULT 0,
    "timesHarvested" INTEGER NOT NULL DEFAULT 0,
    "userId" UUID NOT NULL,
    "speciesId" UUID NOT NULL,

    CONSTRAINT "PlantCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpeciesMastery" (
    "id" UUID NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "experience" INTEGER NOT NULL DEFAULT 0,
    "plantCount" INTEGER NOT NULL DEFAULT 0,
    "harvestCount" INTEGER NOT NULL DEFAULT 0,
    "perfectedAt" TIMESTAMP(3),
    "userId" UUID NOT NULL,
    "speciesId" UUID NOT NULL,

    CONSTRAINT "SpeciesMastery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlantHybrid" (
    "id" UUID NOT NULL,
    "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "parent1Id" UUID NOT NULL,
    "parent2Id" UUID NOT NULL,
    "resultSpeciesId" UUID NOT NULL,
    "discoveredById" UUID NOT NULL,

    CONSTRAINT "PlantHybrid_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlantCollection_userId_idx" ON "PlantCollection"("userId");

-- CreateIndex
CREATE INDEX "PlantCollection_speciesId_idx" ON "PlantCollection"("speciesId");

-- CreateIndex
CREATE UNIQUE INDEX "PlantCollection_userId_speciesId_key" ON "PlantCollection"("userId", "speciesId");

-- CreateIndex
CREATE INDEX "SpeciesMastery_userId_idx" ON "SpeciesMastery"("userId");

-- CreateIndex
CREATE INDEX "SpeciesMastery_speciesId_idx" ON "SpeciesMastery"("speciesId");

-- CreateIndex
CREATE UNIQUE INDEX "SpeciesMastery_userId_speciesId_key" ON "SpeciesMastery"("userId", "speciesId");

-- CreateIndex
CREATE INDEX "PlantHybrid_resultSpeciesId_idx" ON "PlantHybrid"("resultSpeciesId");

-- CreateIndex
CREATE UNIQUE INDEX "PlantHybrid_parent1Id_parent2Id_key" ON "PlantHybrid"("parent1Id", "parent2Id");

-- AddForeignKey
ALTER TABLE "PlantCollection" ADD CONSTRAINT "PlantCollection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantCollection" ADD CONSTRAINT "PlantCollection_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "PlantSpecies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeciesMastery" ADD CONSTRAINT "SpeciesMastery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeciesMastery" ADD CONSTRAINT "SpeciesMastery_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "PlantSpecies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantHybrid" ADD CONSTRAINT "PlantHybrid_parent1Id_fkey" FOREIGN KEY ("parent1Id") REFERENCES "PlantSpecies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantHybrid" ADD CONSTRAINT "PlantHybrid_parent2Id_fkey" FOREIGN KEY ("parent2Id") REFERENCES "PlantSpecies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantHybrid" ADD CONSTRAINT "PlantHybrid_resultSpeciesId_fkey" FOREIGN KEY ("resultSpeciesId") REFERENCES "PlantSpecies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantHybrid" ADD CONSTRAINT "PlantHybrid_discoveredById_fkey" FOREIGN KEY ("discoveredById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
