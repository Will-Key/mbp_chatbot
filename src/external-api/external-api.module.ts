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
import { OpenAIService } from './openai.service'
import { OtpVerificationService } from '../otp-verification/otp-verification.service'

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
    OtpVerificationService,
    PrismaService,
    OpenAIService,
  ],
  exports: [
    WhapiService,
    OcrSpaceService,
    YangoService,
    OtpService,
    OpenAIService,
    OtpVerificationService
  ],
})
export class ExternalApiModule { }
