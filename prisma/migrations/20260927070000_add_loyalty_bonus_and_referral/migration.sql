-- CreateEnum
CREATE TYPE "LoyaltyBonusStatus" AS ENUM ('NOT_ELIGIBLE', 'PENDING', 'CREDITED', 'FAILED');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('REGISTERED', 'CREDITED', 'FAILED');

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
    "status" "ReferralStatus" NOT NULL DEFAULT 'REGISTERED',
    "bonusAmount" INTEGER NOT NULL,
    "yangoTransactionId" TEXT,
    "failureReason" TEXT,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyBonus_driverPersonnalInfoId_periodFrom_periodTo_key" ON "LoyaltyBonus"("driverPersonnalInfoId", "periodFrom", "periodTo");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_referredDriverId_key" ON "Referral"("referredDriverId");

-- CreateIndex
CREATE INDEX "Referral_sponsorDriverId_idx" ON "Referral"("sponsorDriverId");

-- AddForeignKey
ALTER TABLE "LoyaltyBonus" ADD CONSTRAINT "LoyaltyBonus_driverPersonnalInfoId_fkey" FOREIGN KEY ("driverPersonnalInfoId") REFERENCES "DriverPersonnalInfo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_sponsorDriverId_fkey" FOREIGN KEY ("sponsorDriverId") REFERENCES "DriverPersonnalInfo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referredDriverId_fkey" FOREIGN KEY ("referredDriverId") REFERENCES "DriverPersonnalInfo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

