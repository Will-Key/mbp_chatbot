import { Module, OnModuleInit } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { PrismaService } from '../prisma/prisma.service'
import { AppController } from './app.controller'
import { AppParameterModule } from './app-parameter/app-parameter.module'
import { AppService } from './app.service'
import { CarInfoModule } from './car-info/car-info.module'
import { ConversationModule } from './conversation/conversation.module'
import { DocumentFileModule } from './document-file/document-file.module'
import { DriverCarModule } from './driver-car/driver-car.module'
import { DriverLicenseInfoModule } from './driver-license-info/driver-license-info.module'
import { DriverOrderModule } from './driver-order/driver-order.module'
import { DriverPersonalInfoModule } from './driver-personal-info/driver-personal-info.module'
import { ExternalApiModule } from './external-api/external-api.module'
import { FlowModule } from './flow/flow.module'
import { HistoryConversationModule } from './history-conversation/history-conversation.module'
import { LoyaltyBonusModule } from './loyalty-bonus/loyalty-bonus.module'
import { OtpVerificationModule } from './otp-verification/otp-verification.module'
import { RabbitmqModule } from './rabbitmq/rabbitmq.module'
import { ReferralModule } from './referral/referral.module'
import { RequestLogModule } from './request-log/request-log.module'
import { SeederModule } from './seeder/seeder.module'
import { SeederService } from './seeder/seeder.service'
import { StepBadResponseMessageModule } from './step-bad-response-message/step-bad-response-message.module'
import { StepModule } from './step/step.module'
import { SyncJobLogModule } from './sync-job-log/sync-job-log.module'
import { UserModule } from './user/user.module'
import { WebhookModule } from './webhook/webhook.module'

@Module({
  imports: [
    SeederModule,
    FlowModule,
    StepModule,
    ConversationModule,
    RequestLogModule,
    DocumentFileModule,
    DriverPersonalInfoModule,
    DriverLicenseInfoModule,
    CarInfoModule,
    DriverCarModule,
    DriverOrderModule,
    WebhookModule,
    RabbitmqModule,
    ExternalApiModule,
    StepBadResponseMessageModule,
    HistoryConversationModule,
    ScheduleModule.forRoot(),
    SyncJobLogModule,
    OtpVerificationModule,
    UserModule,
    LoyaltyBonusModule,
    ReferralModule,
    AppParameterModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly seederService: SeederService) {}

  async onModuleInit() {
    await this.seederService.seed()
  }
}
