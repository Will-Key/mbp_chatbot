import { Module, OnModuleInit } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { FlowModule } from './flow/flow.module'
import { StepModule } from './step/step.module'
import { ConversationModule } from './conversation/conversation.module'
import { RequestLogModule } from './request-log/request-log.module'
import { DocumentFileModule } from './document-file/document-file.module'
import { DriverPersonnalInfoModule } from './driver-personnal-info/driver-personnal-info.module'
import { DriverLicenseInfoModule } from './driver-license-info/driver-license-info.module'
import { CarInfoModule } from './car-info/car-info.module'
import { DriverCarModule } from './driver-car/driver-car.module'
import { SeederModule } from './seeder/seeder.module'
import { SeederService } from './seeder/seeder.service'
import { PrismaService } from '../prisma/prisma.service'
import { WebhookModule } from './webhook/webhook.module'
import { RabbitmqModule } from './rabbitmq/rabbitmq.module'
import { ExternalApiModule } from './external-api/external-api.module';

@Module({
  imports: [
    SeederModule,
    FlowModule,
    StepModule,
    ConversationModule,
    RequestLogModule,
    DocumentFileModule,
    DriverPersonnalInfoModule,
    DriverLicenseInfoModule,
    CarInfoModule,
    DriverCarModule,
    WebhookModule,
    RabbitmqModule,
    ExternalApiModule,
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
