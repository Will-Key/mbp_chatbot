/*
  Warnings:

  - Added the required column `model` to the `CarInfo` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CarInfo" ADD COLUMN     "model" TEXT NOT NULL;
