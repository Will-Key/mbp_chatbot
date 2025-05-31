-- AlterEnum
ALTER TYPE "StepBadResponseMessageErrorType" ADD VALUE 'isExpire';

-- CreateTable
CREATE TABLE "OtpVerification" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "otpCode" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "OtpVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OtpVerification_phoneNumber_otpCode_idx" ON "OtpVerification"("phoneNumber", "otpCode");
