import { Module } from '@nestjs/common'
import { DriverPersonalInfoService } from './driver-Personal-info.service'
//import { DriverPersonalInfoController } from './driver-Personal-info.controller'
import { PrismaService } from 'prisma/prisma.service'

@Module({
  //controllers: [DriverPersonalInfoController],
  providers: [DriverPersonalInfoService, PrismaService],
})
export class DriverPersonalInfoModule { }
