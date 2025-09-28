/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `Step` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Step" DROP COLUMN "imageUrl",
ADD COLUMN     "medialUrl" TEXT;
