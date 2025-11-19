/*
  Warnings:

  - You are about to drop the column `name` on the `Flow` table. All the data in the column will be lost.
  - You are about to drop the column `flowName` on the `Step` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[idFlow]` on the table `Flow` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `idFlow` to the `Flow` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Step" DROP CONSTRAINT "Step_flowName_fkey";

-- DropIndex
DROP INDEX "Flow_name_key";

-- AlterTable
ALTER TABLE "Flow" DROP COLUMN "name",
ADD COLUMN     "idFlow" TEXT NOT NULL,
ADD COLUMN     "label" TEXT;

-- AlterTable
ALTER TABLE "Step" DROP COLUMN "flowName",
ADD COLUMN     "idFlow" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Flow_idFlow_key" ON "Flow"("idFlow");

-- AddForeignKey
ALTER TABLE "Step" ADD CONSTRAINT "Step_idFlow_fkey" FOREIGN KEY ("idFlow") REFERENCES "Flow"("idFlow") ON DELETE SET NULL ON UPDATE CASCADE;
