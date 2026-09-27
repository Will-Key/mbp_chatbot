import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { PrismaService } from 'prisma/prisma.service'
import { DriverCarService } from 'src/driver-car/driver-car.service'
import { FlowService } from 'src/flow/flow.service'
import { CarInfoService } from '../car-info/car-info.service'
import { ConversationService } from '../conversation/conversation.service'
import { DriverLicenseInfoService } from '../driver-license-info/driver-license-info.service'
import { DriverPersonalInfoService } from '../driver-personal-info/driver-personal-info.service'
import { OtpVerificationService } from '../otp-verification/otp-verification.service'
import { RequestLogModule } from '../request-log/request-log.module'
import { OcrSpaceService } from './ocr-space.service'
import { OpenAIService } from './openai.service'
import { OtpService } from './otp.service'
import { WhapiService } from './whapi.service'
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
    OtpService,
    ConversationService,
    DriverPersonalInfoService,
    DriverLicenseInfoService,
    CarInfoService,
    OtpVerificationService,
    PrismaService,
    OpenAIService,
    DriverCarService,
    FlowService,
  ],
  exports: [
    WhapiService,
    OcrSpaceService,
    YangoService,
    OtpService,
    OpenAIService,
    OtpVerificationService,
  ],
})
export class ExternalApiModule {}
