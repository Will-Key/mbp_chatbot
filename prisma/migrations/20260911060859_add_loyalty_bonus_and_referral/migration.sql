-- CreateEnum
CREATE TYPE "LoyaltyBonusStatus" AS ENUM ('NOT_ELIGIBLE', 'PENDING', 'CREDITED', 'FAILED');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('PENDING_REGISTRATION', 'REGISTERED', 'ACTIVATED');

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
CREATE TABLE "ReferralCode" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "code" TEXT NOT NULL,
    "driverPersonnalInfoId" INTEGER NOT NULL,

    CONSTRAINT "ReferralCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "referralCodeId" INTEGER NOT NULL,
    "referredPhoneNumber" TEXT NOT NULL,
    "referredDriverId" INTEGER,
    "status" "ReferralStatus" NOT NULL DEFAULT 'PENDING_REGISTRATION',

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyBonus_driverPersonnalInfoId_periodFrom_periodTo_key" ON "LoyaltyBonus"("driverPersonnalInfoId", "periodFrom", "periodTo");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralCode_code_key" ON "ReferralCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralCode_driverPersonnalInfoId_key" ON "ReferralCode"("driverPersonnalInfoId");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_referredPhoneNumber_key" ON "Referral"("referredPhoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_referredDriverId_key" ON "Referral"("referredDriverId");

-- AddForeignKey
ALTER TABLE "LoyaltyBonus" ADD CONSTRAINT "LoyaltyBonus_driverPersonnalInfoId_fkey" FOREIGN KEY ("driverPersonnalInfoId") REFERENCES "DriverPersonnalInfo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralCode" ADD CONSTRAINT "ReferralCode_driverPersonnalInfoId_fkey" FOREIGN KEY ("driverPersonnalInfoId") REFERENCES "DriverPersonnalInfo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referralCodeId_fkey" FOREIGN KEY ("referralCodeId") REFERENCES "ReferralCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referredDriverId_fkey" FOREIGN KEY ("referredDriverId") REFERENCES "DriverPersonnalInfo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

