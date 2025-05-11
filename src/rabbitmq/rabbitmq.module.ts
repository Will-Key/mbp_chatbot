import { Module } from '@nestjs/common'
import { RabbitmqService } from './rabbitmq.service'
import { RabbitmqController } from './rabbitmq.controller'
import { ClientsModule, Transport } from '@nestjs/microservices'
import {
  WHAPI_SENT_QUEUE_NAME,
  WHAPI_RECEIVED_QUEUE_NAME,
  OCR_SENT_QUEUE_NAME,
  OCR_RECEIVED_QUEUE_NAME,
} from './constants'
import { ExternalApiModule } from '../external-api/external-api.module'
import { PrismaService } from 'prisma/prisma.service'
import { ConversationService } from '../conversation/conversation.service'
import { StepService } from '../step/step.service'
import { DriverPersonalInfoService } from '../driver-Personal-info/driver-Personal-info.service'
import { DocumentFileService } from '../document-file/document-file.service'
import { DriverLicenseInfoService } from '../driver-license-info/driver-license-info.service'
import { HistoryConversationService } from '../history-conversation/history-conversation.service'
import { baseUrl, rabbitmqPort } from '../shared/constants'
import { OtpService } from '../external-api/otp.service'

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'WHAPI_RECEIVED_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [`amqp://${baseUrl}:${rabbitmqPort}`],
          queue: WHAPI_RECEIVED_QUEUE_NAME,
          queueOptions: {
            durable: true,
          },
        },
      },
      {
        name: 'WHAPI_SENT_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [`amqp://${baseUrl}:${rabbitmqPort}`],
          queue: WHAPI_SENT_QUEUE_NAME,
          queueOptions: {
            durable: true,
          },
        },
      },
      {
        name: 'OCR_SENT_QUEUE_NAME',
        transport: Transport.RMQ,
        options: {
          urls: [`amqp://${baseUrl}:${rabbitmqPort}`],
          queue: OCR_SENT_QUEUE_NAME,
          queueOptions: {
            durable: true,
          },
        },
      },
      {
        name: 'OCR_RECEIVED_QUEUE_NAME',
        transport: Transport.RMQ,
        options: {
          urls: [`amqp://${baseUrl}:${rabbitmqPort}`],
          queue: OCR_RECEIVED_QUEUE_NAME,
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
    ExternalApiModule,
  ],
  controllers: [RabbitmqController],
  providers: [
    RabbitmqService,
    PrismaService,
    ConversationService,
    StepService,
    DriverPersonalInfoService,
    DriverLicenseInfoService,
    DocumentFileService,
    HistoryConversationService,
    OtpService,
  ],
  exports: [RabbitmqService],
})
export class RabbitmqModule {}
