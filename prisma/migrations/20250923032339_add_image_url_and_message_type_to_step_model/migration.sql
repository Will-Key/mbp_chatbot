-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'IMAGE', 'VIDEO', 'IMAGE_TEXT', 'VIDEO_TEXT');

-- AlterTable
ALTER TABLE "CarInfo" ALTER COLUMN "status" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'working';

-- AlterTable
ALTER TABLE "DriverCar" ADD COLUMN     "endDate" TEXT DEFAULT '9999-12-31';

-- AlterTable
ALTER TABLE "Step" ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "messageType" "MessageType" DEFAULT 'TEXT';
