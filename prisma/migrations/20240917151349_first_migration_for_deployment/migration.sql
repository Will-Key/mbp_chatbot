-- CreateEnum
CREATE TYPE "RequestDirection" AS ENUM ('IN', 'OUT');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('SUCCESS', 'FAIL');

-- CreateEnum
CREATE TYPE "RequestInitiator" AS ENUM ('MBP', 'WHAPI', 'YANGO', 'OCR_SPACE');

-- CreateEnum
CREATE TYPE "CollectMethod" AS ENUM ('OCR', 'CHAT');

-- CreateEnum
CREATE TYPE "DocumentSide" AS ENUM ('FRONT', 'BACK');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('DRIVER_LICENSE', 'CAR_REGISTRATION');

-- CreateEnum
CREATE TYPE "CarStatus" AS ENUM ('unknown', 'working', 'not_working', 'repairing', 'no_driver', 'pending');

-- CreateEnum
CREATE TYPE "StepExpectedResponseType" AS ENUM ('text', 'image', 'date', 'url');

-- CreateEnum
CREATE TYPE "StepBadResponseMessageErrorType" AS ENUM ('minSize', 'maxSize', 'minLength', 'maxLength', 'equalLength', 'isExist', 'isNotExist', 'incorrectChoice', 'isDate');

-- CreateEnum
CREATE TYPE "HistoryConversationStatus" AS ENUM ('IN_PROGRESS', 'FAIL', 'SUCCEEDED');

-- CreateEnum
CREATE TYPE "HistoryConversationReasonForEnding" AS ENUM ('ERROR', 'TIME_LIMIT_REACHED', 'NORMAL_FINISH');

-- CreateTable
CREATE TABLE "Flow" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Flow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Step" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "level" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "expectedResponse" TEXT,
    "expectedResponseType" "StepExpectedResponseType" NOT NULL DEFAULT 'text',
    "timeDelay" INTEGER NOT NULL DEFAULT 2,
    "flowId" INTEGER,

    CONSTRAINT "Step_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StepBadResponseMessage" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "message" TEXT NOT NULL,
    "errorType" "StepBadResponseMessageErrorType" NOT NULL,
    "stepId" INTEGER NOT NULL,

    CONSTRAINT "StepBadResponseMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "whaPhoneNumber" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "badResponseCount" INTEGER NOT NULL DEFAULT 0,
    "stepId" INTEGER NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestLog" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "direction" "RequestDirection" NOT NULL,
    "initiator" "RequestInitiator" NOT NULL,
    "data" TEXT NOT NULL,
    "response" TEXT,
    "status" "RequestStatus" NOT NULL,

    CONSTRAINT "RequestLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentFile" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dataImageUrl" TEXT NOT NULL,
    "documentSide" "DocumentSide" NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "whaPhoneNumber" TEXT NOT NULL,

    CONSTRAINT "DocumentFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverPersonnalInfo" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastName" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "whaPhoneNumber" TEXT NOT NULL,
    "address" TEXT,
    "collectMethod" "CollectMethod",
    "yangoProfileId" TEXT,

    CONSTRAINT "DriverPersonnalInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverLicenseInfo" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "driverPhoneNumber" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "deliveryDate" TIMESTAMP(3) NOT NULL,
    "idDriverPersInfo" INTEGER,

    CONSTRAINT "DriverLicenseInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarInfo" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "brand" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "plateNumber" TEXT NOT NULL,
    "status" "CarStatus" NOT NULL,
    "code" TEXT NOT NULL,
    "driverPhoneNumber" TEXT NOT NULL,
    "yangoCarId" TEXT,

    CONSTRAINT "CarInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverCar" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "idDriver" INTEGER NOT NULL,
    "idCar" INTEGER NOT NULL,

    CONSTRAINT "DriverCar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoryConversation" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "whaPhoneNumber" TEXT NOT NULL,
    "stepId" INTEGER,
    "status" "HistoryConversationStatus" NOT NULL,
    "reason" "HistoryConversationReasonForEnding",

    CONSTRAINT "HistoryConversation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DriverPersonnalInfo_licenseNumber_key" ON "DriverPersonnalInfo"("licenseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "DriverPersonnalInfo_phoneNumber_key" ON "DriverPersonnalInfo"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "DriverPersonnalInfo_whaPhoneNumber_key" ON "DriverPersonnalInfo"("whaPhoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "DriverPersonnalInfo_yangoProfileId_key" ON "DriverPersonnalInfo"("yangoProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "DriverLicenseInfo_driverPhoneNumber_key" ON "DriverLicenseInfo"("driverPhoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "DriverLicenseInfo_idDriverPersInfo_key" ON "DriverLicenseInfo"("idDriverPersInfo");

-- CreateIndex
CREATE UNIQUE INDEX "CarInfo_plateNumber_key" ON "CarInfo"("plateNumber");

-- CreateIndex
CREATE UNIQUE INDEX "CarInfo_driverPhoneNumber_key" ON "CarInfo"("driverPhoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "CarInfo_yangoCarId_key" ON "CarInfo"("yangoCarId");

-- CreateIndex
CREATE UNIQUE INDEX "DriverCar_idDriver_key" ON "DriverCar"("idDriver");

-- CreateIndex
CREATE UNIQUE INDEX "DriverCar_idCar_key" ON "DriverCar"("idCar");

-- AddForeignKey
ALTER TABLE "Step" ADD CONSTRAINT "Step_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "Flow"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StepBadResponseMessage" ADD CONSTRAINT "StepBadResponseMessage_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "Step"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "Step"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverLicenseInfo" ADD CONSTRAINT "DriverLicenseInfo_idDriverPersInfo_fkey" FOREIGN KEY ("idDriverPersInfo") REFERENCES "DriverPersonnalInfo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoryConversation" ADD CONSTRAINT "HistoryConversation_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "Step"("id") ON DELETE SET NULL ON UPDATE CASCADE;
