/*
  Warnings:

  - You are about to drop the column `medialUrl` on the `Step` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Step" DROP COLUMN "medialUrl",
ADD COLUMN     "mediaUrl" TEXT;
