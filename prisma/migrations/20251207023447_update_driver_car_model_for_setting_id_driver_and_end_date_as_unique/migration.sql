/*
  Warnings:

  - The `endDate` column on the `DriverCar` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[idDriver,endDate]` on the table `DriverCar` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "DriverCar_idDriver_key";

-- AlterTable
ALTER TABLE "DriverCar" DROP COLUMN "endDate",
ADD COLUMN     "endDate" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "DriverCar_idDriver_createdAt_idx" ON "DriverCar"("idDriver", "createdAt");

-- CreateIndex
CREATE INDEX "DriverCar_idCar_createdAt_idx" ON "DriverCar"("idCar", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DriverCar_idDriver_endDate_key" ON "DriverCar"("idDriver", "endDate");
