-- AlterTable
ALTER TABLE "DocumentFile" ADD COLUMN     "idDriver" INTEGER;

-- AddForeignKey
ALTER TABLE "DocumentFile" ADD CONSTRAINT "DocumentFile_idDriver_fkey" FOREIGN KEY ("idDriver") REFERENCES "DriverPersonnalInfo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
