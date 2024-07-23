import { Module } from '@nestjs/common';
import { DriverLicenseInfoService } from './driver-license-info.service';
import { DriverLicenseInfoController } from './driver-license-info.controller';

@Module({
  controllers: [DriverLicenseInfoController],
  providers: [DriverLicenseInfoService],
})
export class DriverLicenseInfoModule {}
