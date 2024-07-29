import { Module } from '@nestjs/common'
import { RabbitmqService } from './rabbitmq.service'
import { RabbitmqController } from './rabbitmq.controller'
import { ClientsModule } from '@nestjs/microservices'
import {
  queueConfig,
  WHAPI_SENT_QUEUE_NAME,
  WHAPI_RECEIVED_QUEUE_NAME,
} from './constants'
import { ExternalApiModule } from '../external-api/external-api.module'
import { PrismaService } from '../../prisma/prisma.service'
import { ConversationService } from '../conversation/conversation.service'
import { StepService } from '../step/step.service'
import { DriverPersonnalInfoService } from '../driver-personnal-info/driver-personnal-info.service'
import { DocumentFileService } from '../document-file/document-file.service'

@Module({
  imports: [
    ClientsModule.register([
      { ...queueConfig(WHAPI_SENT_QUEUE_NAME) },
      { ...queueConfig(WHAPI_RECEIVED_QUEUE_NAME) },
    ]),
    ExternalApiModule,
  ],
  controllers: [RabbitmqController],
  providers: [
    RabbitmqService,
    PrismaService,
    ConversationService,
    StepService,
    DriverPersonnalInfoService,
    DocumentFileService,
  ],
  exports: [RabbitmqService],
})
export class RabbitmqModule {}
