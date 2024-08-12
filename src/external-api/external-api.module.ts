import { Module } from '@nestjs/common'
import { WhapiService } from './whapi.service'
import { HttpModule } from '@nestjs/axios'
import { RequestLogModule } from '../request-log/request-log.module'
import { OcrSpaceService } from './ocr-space.service'
import { ConversationService } from '../conversation/conversation.service'
import { DriverPersonnalInfoService } from '../driver-personnal-info/driver-personnal-info.service'
import { DriverLicenseInfoService } from '../driver-license-info/driver-license-info.service'
import { CarInfoService } from '../car-info/car-info.service'
import { PrismaService } from '../../prisma/prisma.service'
import { YangoService } from './yango.service'

@Module({
  imports: [
    HttpModule.register({
      timeout: 20000,
      maxRedirects: 5,
    }),
    RequestLogModule,
  ],
  providers: [
    WhapiService,
    OcrSpaceService,
    YangoService,
    ConversationService,
    DriverPersonnalInfoService,
    DriverLicenseInfoService,
    CarInfoService,
    PrismaService,
  ],
  exports: [WhapiService, OcrSpaceService, YangoService],
})
export class ExternalApiModule { }
