import { Module } from '@nestjs/common'
import { DriverCarService } from './driver-car.service'
//import { DriverCarController } from './driver-car.controller'
import { PrismaService } from 'prisma/prisma.service'

@Module({
  //controllers: [DriverCarController],
  providers: [DriverCarService, PrismaService],
})
export class DriverCarModule {}
