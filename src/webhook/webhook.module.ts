import { Module } from '@nestjs/common'
import { WebhookService } from './webhook.service'
import { WebhookController } from './webhook.controller'
import { RabbitmqModule } from '../rabbitmq/rabbitmq.module'
import { PrismaService } from '../../prisma/prisma.service'
import { ManualQueueService } from '../manual-queue/manual-queue.service'
import { ConversationService } from '../conversation/conversation.service'
import { DocumentFileService } from '../document-file/document-file.service'
import { DriverLicenseInfoService } from '../driver-license-info/driver-license-info.service'
import { DriverPersonnalInfoService } from '../driver-personnal-info/driver-personnal-info.service'
import { HistoryConversationService } from '../history-conversation/history-conversation.service'
import { StepService } from '../step/step.service'
import { ExternalApiModule } from 'src/external-api/external-api.module'

@Module({
  imports: [RabbitmqModule, ExternalApiModule],
  controllers: [WebhookController],
  providers: [
    WebhookService,
    PrismaService,
    ManualQueueService,
    ConversationService,
    StepService,
    DriverPersonnalInfoService,
    DriverLicenseInfoService,
    DocumentFileService,
    HistoryConversationService,
  ],
})
export class WebhookModule { }
