/*
  Warnings:

  - You are about to drop the column `flowId` on the `Step` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `Flow` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Step" DROP CONSTRAINT "Step_flowId_fkey";

-- AlterTable
ALTER TABLE "Step" DROP COLUMN "flowId",
ADD COLUMN     "flowName" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Flow_name_key" ON "Flow"("name");

-- AddForeignKey
ALTER TABLE "Step" ADD CONSTRAINT "Step_flowName_fkey" FOREIGN KEY ("flowName") REFERENCES "Flow"("name") ON DELETE SET NULL ON UPDATE CASCADE;
