-- CreateEnum
CREATE TYPE "DriverOrderStatus" AS ENUM ('none', 'waiting', 'transporting', 'cancelled', 'complete', 'driving', 'failed', 'expired', 'preexpired');

-- CreateTable
CREATE TABLE "DriverOrder" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "yangoOrderId" TEXT NOT NULL,
    "shortId" INTEGER,
    "status" "DriverOrderStatus" NOT NULL,
    "orderCreatedAt" TIMESTAMP(3) NOT NULL,
    "bookedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "provider" TEXT,
    "category" TEXT,
    "addressFrom" TEXT,
    "latFrom" DOUBLE PRECISION,
    "lonFrom" DOUBLE PRECISION,
    "addressTo" TEXT,
    "latTo" DOUBLE PRECISION,
    "lonTo" DOUBLE PRECISION,
    "paymentMethod" TEXT,
    "price" TEXT,
    "driverProfileId" TEXT,
    "driverName" TEXT,
    "carId" TEXT,
    "carBrandModel" TEXT,
    "carLicenseNumber" TEXT,
    "cancellationDescription" TEXT,

    CONSTRAINT "DriverOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DriverOrder_yangoOrderId_key" ON "DriverOrder"("yangoOrderId");

-- CreateIndex
CREATE INDEX "DriverOrder_driverProfileId_idx" ON "DriverOrder"("driverProfileId");

-- CreateIndex
CREATE INDEX "DriverOrder_bookedAt_idx" ON "DriverOrder"("bookedAt");
