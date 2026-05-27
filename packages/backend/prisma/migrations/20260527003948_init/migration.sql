-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'MODERATOR', 'REGIONAL_MODERATOR', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "InviteType" AS ENUM ('OPEN', 'CODE', 'QR', 'LINK', 'PASSCODE');

-- CreateEnum
CREATE TYPE "TokenType" AS ENUM ('GREEN_CREDITS', 'ECO_POINTS', 'REPUTATION_TOKENS');

-- CreateEnum
CREATE TYPE "LogLevel" AS ENUM ('DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL');

-- CreateEnum
CREATE TYPE "GardenType" AS ENUM ('VIRTUAL', 'REAL', 'HYBRID');

-- CreateEnum
CREATE TYPE "CropStatus" AS ENUM ('SEED', 'SPROUTING', 'GROWING', 'MATURE', 'HARVESTED', 'WILTED', 'DISEASED');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "SensorType" AS ENUM ('SOIL_MOISTURE', 'HUMIDITY', 'PH', 'TEMPERATURE', 'LIGHT');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('ACTIVE', 'SOLD', 'CANCELLED', 'EXPIRED');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "username" TEXT NOT NULL,
    "displayName" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isOnboarded" BOOLEAN NOT NULL DEFAULT false,
    "avatarUrl" TEXT,
    "bio" TEXT,
    "geohash" TEXT,
    "region" TEXT,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "telegramId" TEXT,
    "deviceTrustScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "experience" INTEGER NOT NULL DEFAULT 0,
    "greenCredits" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ecoPoints" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reputationTokens" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sustainabilityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "trustScore" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "marketplaceReliability" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "communityStanding" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "inviteCount" INTEGER NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastActiveAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlantSpecies" (
    "id" UUID NOT NULL,
    "commonName" TEXT NOT NULL,
    "scientificName" TEXT NOT NULL,
    "family" TEXT,
    "genus" TEXT,
    "species" TEXT,
    "imageUrl" TEXT,
    "description" TEXT,
    "growingDays" INTEGER,
    "difficulty" TEXT NOT NULL DEFAULT 'MEDIUM',
    "minTemp" DOUBLE PRECISION,
    "maxTemp" DOUBLE PRECISION,
    "waterNeeds" TEXT NOT NULL DEFAULT 'MODERATE',
    "sunlightNeeds" TEXT NOT NULL DEFAULT 'FULL_SUN',
    "soilPhMin" DOUBLE PRECISION,
    "soilPhMax" DOUBLE PRECISION,
    "matureHeightCm" DOUBLE PRECISION,
    "spacingCm" DOUBLE PRECISION,
    "seasons" TEXT[],
    "edible" BOOLEAN NOT NULL DEFAULT false,
    "medicinal" BOOLEAN NOT NULL DEFAULT false,
    "attractsPollinators" BOOLEAN NOT NULL DEFAULT false,
    "isNative" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[],
    "dataSource" TEXT NOT NULL DEFAULT 'openfarm',
    "externalId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlantSpecies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CropVariety" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "daysToMaturity" INTEGER,
    "characteristics" JSONB,
    "speciesId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CropVariety_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GardenPlan" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "difficulty" TEXT NOT NULL DEFAULT 'MEDIUM',
    "gridWidth" INTEGER NOT NULL DEFAULT 4,
    "gridHeight" INTEGER NOT NULL DEFAULT 4,
    "season" TEXT,
    "region" TEXT,
    "theme" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "imageUrl" TEXT,
    "createdBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GardenPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GardenPlanPlant" (
    "id" UUID NOT NULL,
    "plotX" INTEGER NOT NULL,
    "plotY" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "planId" UUID NOT NULL,
    "speciesId" UUID NOT NULL,

    CONSTRAINT "GardenPlanPlant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Garden" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'My Garden',
    "type" "GardenType" NOT NULL DEFAULT 'VIRTUAL',
    "description" TEXT,
    "size" INTEGER NOT NULL DEFAULT 0,
    "soilQuality" DOUBLE PRECISION NOT NULL DEFAULT 50.0,
    "irrigationLevel" DOUBLE PRECISION NOT NULL DEFAULT 50.0,
    "sunlightExposure" DOUBLE PRECISION NOT NULL DEFAULT 50.0,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "address" TEXT,
    "timezone" TEXT,
    "theme" TEXT,
    "decorations" JSONB,
    "planId" UUID,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Garden_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Crop" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "species" TEXT,
    "variety" TEXT,
    "status" "CropStatus" NOT NULL DEFAULT 'SEED',
    "growthStage" INTEGER NOT NULL DEFAULT 0,
    "health" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "hydration" DOUBLE PRECISION NOT NULL DEFAULT 50.0,
    "nutrientLevel" DOUBLE PRECISION NOT NULL DEFAULT 50.0,
    "plantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastWateredAt" TIMESTAMP(3),
    "lastFertilizedAt" TIMESTAMP(3),
    "estimatedHarvest" TIMESTAMP(3),
    "harvestedAt" TIMESTAMP(3),
    "plotX" INTEGER,
    "plotY" INTEGER,
    "weatherStressed" BOOLEAN NOT NULL DEFAULT false,
    "stressFactor" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "speciesId" UUID,
    "varietyId" UUID,
    "gardenId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Crop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inventory" (
    "id" UUID NOT NULL,
    "itemType" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "rarity" TEXT NOT NULL DEFAULT 'COMMON',
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceListing" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GREEN_CREDITS',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "status" "ListingStatus" NOT NULL DEFAULT 'ACTIVE',
    "images" JSONB,
    "location" TEXT,
    "isLocal" BOOLEAN NOT NULL DEFAULT false,
    "sellerId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "MarketplaceListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceTransaction" (
    "id" UUID NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GREEN_CREDITS',
    "listingId" UUID NOT NULL,
    "buyerId" UUID NOT NULL,
    "sellerId" UUID NOT NULL,
    "blockchainTxId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "MarketplaceTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IotDevice" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "firmwareVersion" TEXT,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "lastSeenAt" TIMESTAMP(3),
    "publicKey" TEXT,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IotDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SensorReading" (
    "id" UUID NOT NULL,
    "sensorType" "SensorType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "deviceId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SensorReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeatherRecord" (
    "id" UUID NOT NULL,
    "region" TEXT NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "humidity" DOUBLE PRECISION NOT NULL,
    "rainfall" DOUBLE PRECISION NOT NULL,
    "windSpeed" DOUBLE PRECISION NOT NULL,
    "sunlightHours" DOUBLE PRECISION NOT NULL,
    "condition" TEXT NOT NULL,
    "forecast" JSONB,
    "alerts" JSONB,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "WeatherRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isPush" BOOLEAN NOT NULL DEFAULT true,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiScan" (
    "id" UUID NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "plantName" TEXT,
    "species" TEXT,
    "healthScore" DOUBLE PRECISION,
    "diseases" JSONB,
    "recommendations" JSONB,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiScan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GovernmentAdvisory" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "url" TEXT,
    "data" JSONB,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GovernmentAdvisory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "isEncrypted" BOOLEAN NOT NULL DEFAULT true,
    "nonce" TEXT,
    "senderId" UUID NOT NULL,
    "receiverId" UUID,
    "groupId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Group" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "region" TEXT,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "iconUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupMember" (
    "id" UUID NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "groupId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invite" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "type" "InviteType" NOT NULL DEFAULT 'CODE',
    "passcode" TEXT,
    "maxUses" INTEGER NOT NULL DEFAULT 1,
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdById" UUID NOT NULL,
    "redeemedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "redeemedAt" TIMESTAMP(3),

    CONSTRAINT "Invite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TokenTransaction" (
    "id" UUID NOT NULL,
    "type" "TokenType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "balanceBefore" DOUBLE PRECISION NOT NULL,
    "balanceAfter" DOUBLE PRECISION NOT NULL,
    "action" TEXT NOT NULL,
    "referenceId" TEXT,
    "referenceType" TEXT,
    "description" TEXT,
    "metadata" JSONB,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TokenTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppLog" (
    "id" UUID NOT NULL,
    "level" "LogLevel" NOT NULL DEFAULT 'INFO',
    "message" TEXT NOT NULL,
    "context" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "traceId" TEXT,
    "spanId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'backend',
    "userId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QrSession" (
    "id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "signature" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdById" UUID NOT NULL,
    "usedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QrSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockchainTransaction" (
    "id" UUID NOT NULL,
    "txHash" TEXT,
    "contractType" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "fromAddress" TEXT,
    "toAddress" TEXT,
    "amount" TEXT,
    "tokenId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "gasUsed" TEXT,
    "blockNumber" INTEGER,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),

    CONSTRAINT "BlockchainTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReputationLog" (
    "id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "scoreChange" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReputationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationReport" (
    "id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "evidence" JSONB,
    "reporterId" UUID NOT NULL,
    "actionedById" UUID,
    "actionTaken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "ModerationReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureFlag" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "rules" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFeatureOverride" (
    "id" UUID NOT NULL,
    "featureName" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserFeatureOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "changes" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "refreshToken" TEXT,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "deviceInfo" TEXT,
    "ipAddress" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_geohash_idx" ON "User"("geohash");

-- CreateIndex
CREATE INDEX "User_region_idx" ON "User"("region");

-- CreateIndex
CREATE INDEX "User_sustainabilityScore_idx" ON "User"("sustainabilityScore");

-- CreateIndex
CREATE INDEX "User_trustScore_idx" ON "User"("trustScore");

-- CreateIndex
CREATE UNIQUE INDEX "PlantSpecies_scientificName_key" ON "PlantSpecies"("scientificName");

-- CreateIndex
CREATE INDEX "PlantSpecies_commonName_idx" ON "PlantSpecies"("commonName");

-- CreateIndex
CREATE INDEX "PlantSpecies_scientificName_idx" ON "PlantSpecies"("scientificName");

-- CreateIndex
CREATE INDEX "PlantSpecies_family_idx" ON "PlantSpecies"("family");

-- CreateIndex
CREATE INDEX "PlantSpecies_seasons_idx" ON "PlantSpecies"("seasons");

-- CreateIndex
CREATE INDEX "PlantSpecies_difficulty_idx" ON "PlantSpecies"("difficulty");

-- CreateIndex
CREATE INDEX "PlantSpecies_dataSource_idx" ON "PlantSpecies"("dataSource");

-- CreateIndex
CREATE INDEX "CropVariety_speciesId_idx" ON "CropVariety"("speciesId");

-- CreateIndex
CREATE INDEX "GardenPlan_difficulty_idx" ON "GardenPlan"("difficulty");

-- CreateIndex
CREATE INDEX "GardenPlan_season_idx" ON "GardenPlan"("season");

-- CreateIndex
CREATE INDEX "GardenPlan_isPublic_idx" ON "GardenPlan"("isPublic");

-- CreateIndex
CREATE INDEX "GardenPlanPlant_planId_idx" ON "GardenPlanPlant"("planId");

-- CreateIndex
CREATE INDEX "GardenPlanPlant_speciesId_idx" ON "GardenPlanPlant"("speciesId");

-- CreateIndex
CREATE UNIQUE INDEX "GardenPlanPlant_planId_plotX_plotY_key" ON "GardenPlanPlant"("planId", "plotX", "plotY");

-- CreateIndex
CREATE UNIQUE INDEX "Garden_userId_key" ON "Garden"("userId");

-- CreateIndex
CREATE INDEX "Crop_gardenId_idx" ON "Crop"("gardenId");

-- CreateIndex
CREATE INDEX "Crop_userId_idx" ON "Crop"("userId");

-- CreateIndex
CREATE INDEX "Crop_status_idx" ON "Crop"("status");

-- CreateIndex
CREATE INDEX "Crop_speciesId_idx" ON "Crop"("speciesId");

-- CreateIndex
CREATE INDEX "Inventory_userId_idx" ON "Inventory"("userId");

-- CreateIndex
CREATE INDEX "Inventory_itemType_idx" ON "Inventory"("itemType");

-- CreateIndex
CREATE INDEX "MarketplaceListing_sellerId_idx" ON "MarketplaceListing"("sellerId");

-- CreateIndex
CREATE INDEX "MarketplaceListing_category_idx" ON "MarketplaceListing"("category");

-- CreateIndex
CREATE INDEX "MarketplaceListing_status_idx" ON "MarketplaceListing"("status");

-- CreateIndex
CREATE INDEX "MarketplaceTransaction_listingId_idx" ON "MarketplaceTransaction"("listingId");

-- CreateIndex
CREATE INDEX "MarketplaceTransaction_buyerId_idx" ON "MarketplaceTransaction"("buyerId");

-- CreateIndex
CREATE INDEX "MarketplaceTransaction_sellerId_idx" ON "MarketplaceTransaction"("sellerId");

-- CreateIndex
CREATE INDEX "IotDevice_userId_idx" ON "IotDevice"("userId");

-- CreateIndex
CREATE INDEX "SensorReading_deviceId_idx" ON "SensorReading"("deviceId");

-- CreateIndex
CREATE INDEX "SensorReading_userId_idx" ON "SensorReading"("userId");

-- CreateIndex
CREATE INDEX "SensorReading_timestamp_idx" ON "SensorReading"("timestamp");

-- CreateIndex
CREATE INDEX "SensorReading_sensorType_idx" ON "SensorReading"("sensorType");

-- CreateIndex
CREATE INDEX "WeatherRecord_region_idx" ON "WeatherRecord"("region");

-- CreateIndex
CREATE INDEX "WeatherRecord_recordedAt_idx" ON "WeatherRecord"("recordedAt");

-- CreateIndex
CREATE INDEX "WeatherRecord_condition_idx" ON "WeatherRecord"("condition");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "AiScan_userId_idx" ON "AiScan"("userId");

-- CreateIndex
CREATE INDEX "GovernmentAdvisory_region_idx" ON "GovernmentAdvisory"("region");

-- CreateIndex
CREATE INDEX "GovernmentAdvisory_type_idx" ON "GovernmentAdvisory"("type");

-- CreateIndex
CREATE INDEX "GovernmentAdvisory_publishedAt_idx" ON "GovernmentAdvisory"("publishedAt");

-- CreateIndex
CREATE INDEX "Message_senderId_receiverId_idx" ON "Message"("senderId", "receiverId");

-- CreateIndex
CREATE INDEX "Message_groupId_idx" ON "Message"("groupId");

-- CreateIndex
CREATE INDEX "Group_region_idx" ON "Group"("region");

-- CreateIndex
CREATE INDEX "Group_type_idx" ON "Group"("type");

-- CreateIndex
CREATE UNIQUE INDEX "GroupMember_groupId_userId_key" ON "GroupMember"("groupId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Invite_code_key" ON "Invite"("code");

-- CreateIndex
CREATE INDEX "Invite_code_idx" ON "Invite"("code");

-- CreateIndex
CREATE INDEX "Invite_createdById_idx" ON "Invite"("createdById");

-- CreateIndex
CREATE INDEX "TokenTransaction_userId_idx" ON "TokenTransaction"("userId");

-- CreateIndex
CREATE INDEX "TokenTransaction_type_idx" ON "TokenTransaction"("type");

-- CreateIndex
CREATE INDEX "TokenTransaction_action_idx" ON "TokenTransaction"("action");

-- CreateIndex
CREATE INDEX "TokenTransaction_createdAt_idx" ON "TokenTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "AppLog_level_idx" ON "AppLog"("level");

-- CreateIndex
CREATE INDEX "AppLog_source_idx" ON "AppLog"("source");

-- CreateIndex
CREATE INDEX "AppLog_createdAt_idx" ON "AppLog"("createdAt");

-- CreateIndex
CREATE INDEX "AppLog_traceId_idx" ON "AppLog"("traceId");

-- CreateIndex
CREATE INDEX "QrSession_type_idx" ON "QrSession"("type");

-- CreateIndex
CREATE INDEX "QrSession_expiresAt_idx" ON "QrSession"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "BlockchainTransaction_txHash_key" ON "BlockchainTransaction"("txHash");

-- CreateIndex
CREATE INDEX "BlockchainTransaction_userId_idx" ON "BlockchainTransaction"("userId");

-- CreateIndex
CREATE INDEX "BlockchainTransaction_txHash_idx" ON "BlockchainTransaction"("txHash");

-- CreateIndex
CREATE INDEX "BlockchainTransaction_status_idx" ON "BlockchainTransaction"("status");

-- CreateIndex
CREATE INDEX "ReputationLog_userId_idx" ON "ReputationLog"("userId");

-- CreateIndex
CREATE INDEX "ReputationLog_action_idx" ON "ReputationLog"("action");

-- CreateIndex
CREATE INDEX "ModerationReport_status_idx" ON "ModerationReport"("status");

-- CreateIndex
CREATE INDEX "ModerationReport_reporterId_idx" ON "ModerationReport"("reporterId");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureFlag_name_key" ON "FeatureFlag"("name");

-- CreateIndex
CREATE INDEX "FeatureFlag_name_idx" ON "FeatureFlag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UserFeatureOverride_userId_featureName_key" ON "UserFeatureOverride"("userId", "featureName");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_entity_idx" ON "AuditLog"("entity");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_token_idx" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- AddForeignKey
ALTER TABLE "CropVariety" ADD CONSTRAINT "CropVariety_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "PlantSpecies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GardenPlanPlant" ADD CONSTRAINT "GardenPlanPlant_planId_fkey" FOREIGN KEY ("planId") REFERENCES "GardenPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GardenPlanPlant" ADD CONSTRAINT "GardenPlanPlant_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "PlantSpecies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Garden" ADD CONSTRAINT "Garden_planId_fkey" FOREIGN KEY ("planId") REFERENCES "GardenPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Garden" ADD CONSTRAINT "Garden_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Crop" ADD CONSTRAINT "Crop_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "PlantSpecies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Crop" ADD CONSTRAINT "Crop_varietyId_fkey" FOREIGN KEY ("varietyId") REFERENCES "CropVariety"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Crop" ADD CONSTRAINT "Crop_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "Garden"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Crop" ADD CONSTRAINT "Crop_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceListing" ADD CONSTRAINT "MarketplaceListing_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceTransaction" ADD CONSTRAINT "MarketplaceTransaction_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "MarketplaceListing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceTransaction" ADD CONSTRAINT "MarketplaceTransaction_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceTransaction" ADD CONSTRAINT "MarketplaceTransaction_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IotDevice" ADD CONSTRAINT "IotDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SensorReading" ADD CONSTRAINT "SensorReading_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "IotDevice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SensorReading" ADD CONSTRAINT "SensorReading_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiScan" ADD CONSTRAINT "AiScan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_redeemedById_fkey" FOREIGN KEY ("redeemedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenTransaction" ADD CONSTRAINT "TokenTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppLog" ADD CONSTRAINT "AppLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QrSession" ADD CONSTRAINT "QrSession_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QrSession" ADD CONSTRAINT "QrSession_usedById_fkey" FOREIGN KEY ("usedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockchainTransaction" ADD CONSTRAINT "BlockchainTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReputationLog" ADD CONSTRAINT "ReputationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationReport" ADD CONSTRAINT "ModerationReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationReport" ADD CONSTRAINT "ModerationReport_actionedById_fkey" FOREIGN KEY ("actionedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFeatureOverride" ADD CONSTRAINT "UserFeatureOverride_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
