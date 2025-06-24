/*
  Warnings:

  - The values [isExpire] on the enum `StepBadResponseMessageErrorType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "StepBadResponseMessageErrorType_new" AS ENUM ('minSize', 'maxSize', 'minLength', 'maxLength', 'equalLength', 'isExist', 'isNotExist', 'incorrectChoice', 'isDate', 'isExpired', 'incorrectCode');
ALTER TABLE "StepBadResponseMessage" ALTER COLUMN "errorType" TYPE "StepBadResponseMessageErrorType_new" USING ("errorType"::text::"StepBadResponseMessageErrorType_new");
ALTER TYPE "StepBadResponseMessageErrorType" RENAME TO "StepBadResponseMessageErrorType_old";
ALTER TYPE "StepBadResponseMessageErrorType_new" RENAME TO "StepBadResponseMessageErrorType";
DROP TYPE "StepBadResponseMessageErrorType_old";
COMMIT;
