import { Module } from '@nestjs/common';
import { DriverPersonnalInfoService } from './driver-personnal-info.service';
import { DriverPersonnalInfoController } from './driver-personnal-info.controller';

@Module({
  controllers: [DriverPersonnalInfoController],
  providers: [DriverPersonnalInfoService],
})
export class DriverPersonnalInfoModule {}
