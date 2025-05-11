import { Module } from '@nestjs/common'
import { WhapiService } from './whapi.service'
import { HttpModule } from '@nestjs/axios'
import { RequestLogModule } from '../request-log/request-log.module'
import { OcrSpaceService } from './ocr-space.service'
import { ConversationService } from '../conversation/conversation.service'
import { DriverPersonalInfoService } from '../driver-Personal-info/driver-Personal-info.service'
import { DriverLicenseInfoService } from '../driver-license-info/driver-license-info.service'
import { CarInfoService } from '../car-info/car-info.service'
import { PrismaService } from 'prisma/prisma.service'
import { YangoService } from './yango.service'
import { OtpService } from './otp.service'
import { VerifyOtpVerificationDto } from '../otp-verification/dto/verify-otp-verification.dto'

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
    OtpService,
    ConversationService,
    DriverPersonalInfoService,
    DriverLicenseInfoService,
    CarInfoService,
    VerifyOtpVerificationDto,
    PrismaService,
  ],
  exports: [WhapiService, OcrSpaceService, YangoService, OtpService],
})
export class ExternalApiModule { }
