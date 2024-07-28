import { Module } from '@nestjs/common'
import { WebhookService } from './webhook.service'
import { WebhookController } from './webhook.controller'
import { PrismaService } from '../../prisma/prisma.service'
import { ConversationService } from '../conversation/conversation.service'
import { StepService } from '../step/step.service'
import { DriverPersonnalInfoService } from '../driver-personnal-info/driver-personnal-info.service'
import { DocumentFileService } from '../document-file/document-file.service'

@Module({
  controllers: [WebhookController],
  providers: [
    WebhookService,
    PrismaService,
    ConversationService,
    StepService,
    DriverPersonnalInfoService,
    DocumentFileService,
  ],
})
export class WebhookModule {}
