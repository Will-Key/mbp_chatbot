-- DropIndex
DROP INDEX "DriverCar_idDriver_endDate_key";

CREATE UNIQUE INDEX unique_active_driver ON "DriverCar" ("idDriver")
WHERE
    "endDate" IS NULL;