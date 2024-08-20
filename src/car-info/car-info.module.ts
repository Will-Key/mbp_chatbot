import { Module } from '@nestjs/common'
import { CarInfoService } from './car-info.service'
//import { CarInfoController } from './car-info.controller'
import { PrismaService } from 'prisma/prisma.service'

@Module({
  //controllers: [CarInfoController],
  providers: [CarInfoService, PrismaService],
})
export class CarInfoModule { }
