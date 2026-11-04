-- CreateEnum
CREATE TYPE "LoyaltyBonusStatus" AS ENUM ('NOT_ELIGIBLE', 'PENDING', 'CREDITED', 'FAILED');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('REGISTERED', 'CREDITED', 'NOT_ELIGIBLE', 'FAILED');

-- CreateTable
CREATE TABLE "LoyaltyBonus" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "driverPersonnalInfoId" INTEGER NOT NULL,
    "periodFrom" TIMESTAMP(3) NOT NULL,
    "periodTo" TIMESTAMP(3) NOT NULL,
    "ridesCount" INTEGER NOT NULL,
    "bonusAmount" INTEGER NOT NULL,
    "status" "LoyaltyBonusStatus" NOT NULL DEFAULT 'NOT_ELIGIBLE',
    "yangoTransactionId" TEXT,
    "failureReason" TEXT,

    CONSTRAINT "LoyaltyBonus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sponsorDriverId" INTEGER NOT NULL,
    "referredDriverId" INTEGER NOT NULL,
    "campaignId" INTEGER,
    "status" "ReferralStatus" NOT NULL DEFAULT 'REGISTERED',
    "bonusAmount" INTEGER NOT NULL,
    "yangoTransactionId" TEXT,
    "failureReason" TEXT,
    "creditedAt" TIMESTAMP(3),

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralCampaign" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "bonusAmount" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ReferralCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyBonusTier" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "minRides" INTEGER NOT NULL,
    "bonusAmount" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "LoyaltyBonusTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppParameter" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "AppParameter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyBonus_driverPersonnalInfoId_periodFrom_periodTo_key" ON "LoyaltyBonus"("driverPersonnalInfoId", "periodFrom", "periodTo");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_referredDriverId_key" ON "Referral"("referredDriverId");

-- CreateIndex
CREATE INDEX "Referral_sponsorDriverId_idx" ON "Referral"("sponsorDriverId");

-- CreateIndex
CREATE INDEX "Referral_status_idx" ON "Referral"("status");

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyBonusTier_minRides_key" ON "LoyaltyBonusTier"("minRides");

-- CreateIndex
CREATE UNIQUE INDEX "AppParameter_key_key" ON "AppParameter"("key");

-- AddForeignKey
ALTER TABLE "LoyaltyBonus" ADD CONSTRAINT "LoyaltyBonus_driverPersonnalInfoId_fkey" FOREIGN KEY ("driverPersonnalInfoId") REFERENCES "DriverPersonnalInfo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_sponsorDriverId_fkey" FOREIGN KEY ("sponsorDriverId") REFERENCES "DriverPersonnalInfo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referredDriverId_fkey" FOREIGN KEY ("referredDriverId") REFERENCES "DriverPersonnalInfo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "ReferralCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

