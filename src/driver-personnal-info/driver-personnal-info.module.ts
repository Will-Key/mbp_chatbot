import { Module } from '@nestjs/common'
import { DriverPersonnalInfoService } from './driver-personnal-info.service'
//import { DriverPersonnalInfoController } from './driver-personnal-info.controller'
import { PrismaService } from '../../prisma/prisma.service'

@Module({
  //controllers: [DriverPersonnalInfoController],
  providers: [DriverPersonnalInfoService, PrismaService],
})
export class DriverPersonnalInfoModule {}
