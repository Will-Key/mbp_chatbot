import { Module } from '@nestjs/common';
import { CarInfoService } from './car-info.service';
import { CarInfoController } from './car-info.controller';

@Module({
  controllers: [CarInfoController],
  providers: [CarInfoService],
})
export class CarInfoModule {}
