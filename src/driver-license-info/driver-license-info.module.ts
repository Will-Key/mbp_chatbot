import { Module } from '@nestjs/common'
import { DriverLicenseInfoService } from './driver-license-info.service'
//import { DriverLicenseInfoController } from './driver-license-info.controller'
import { PrismaService } from 'prisma/prisma.service'

@Module({
  //controllers: [DriverLicenseInfoController],
  providers: [DriverLicenseInfoService, PrismaService],
})
export class DriverLicenseInfoModule { }
