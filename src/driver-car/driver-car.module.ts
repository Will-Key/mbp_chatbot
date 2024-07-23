import { Module } from '@nestjs/common';
import { DriverCarService } from './driver-car.service';
import { DriverCarController } from './driver-car.controller';

@Module({
  controllers: [DriverCarController],
  providers: [DriverCarService],
})
export class DriverCarModule {}
