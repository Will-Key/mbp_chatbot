import { Module } from '@nestjs/common'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { PrismaService } from 'prisma/prisma.service'
import { CarInfoService } from '../car-info/car-info.service'
import { ConversationService } from '../conversation/conversation.service'
import { DocumentFileService } from '../document-file/document-file.service'
import { DriverCarService } from '../driver-car/driver-car.service'
import { DriverLicenseInfoService } from '../driver-license-info/driver-license-info.service'
import { DriverPersonalInfoService } from '../driver-personal-info/driver-personal-info.service'
import { ExternalApiModule } from '../external-api/external-api.module'
import { HistoryConversationService } from '../history-conversation/history-conversation.service'
import { baseUrl, rabbitmqPort } from '../shared/constants'
import { StepService } from '../step/step.service'
import {
  CREATE_YANGO_CAR_SENT_QUEUE_NAME,
  CREATE_YANGO_PROFILE_SENT_QUEUE_NAME,
  OCR_RECEIVED_QUEUE_NAME,
  OCR_SENT_QUEUE_NAME,
  UPDATE_YANGO_DRIVER_INFO_SENT_QUEUE_NAME,
  WHAPI_RECEIVED_QUEUE_NAME,
  WHAPI_SENT_IMAGE_QUEUE_NAME,
  WHAPI_SENT_QUEUE_NAME,
} from './constants'
import { RabbitmqController } from './rabbitmq.controller'
import { RabbitmqService } from './rabbitmq.service'

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
        name: 'WHAPI_SENT_IMAGE_QUEUE_NAME',
        transport: Transport.RMQ,
        options: {
          urls: [`amqp://${baseUrl}:${rabbitmqPort}`],
          queue: WHAPI_SENT_IMAGE_QUEUE_NAME,
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
      {
        name: 'CREATE_YANGO_PROFILE_SENT_QUEUE_NAME',
        transport: Transport.RMQ,
        options: {
          urls: [`amqp://${baseUrl}:${rabbitmqPort}`],
          queue: CREATE_YANGO_PROFILE_SENT_QUEUE_NAME,
          queueOptions: {
            durable: true,
          },
        },
      },
      {
        name: 'CREATE_YANGO_CAR_SENT_QUEUE_NAME',
        transport: Transport.RMQ,
        options: {
          urls: [`amqp://${baseUrl}:${rabbitmqPort}`],
          queue: CREATE_YANGO_CAR_SENT_QUEUE_NAME,
          queueOptions: {
            durable: true,
          },
        },
      },
      {
        name: 'UPDATE_YANGO_DRIVER_INFO_SENT_QUEUE_NAME',
        transport: Transport.RMQ,
        options: {
          urls: [`amqp://${baseUrl}:${rabbitmqPort}`],
          queue: UPDATE_YANGO_DRIVER_INFO_SENT_QUEUE_NAME,
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
    DriverCarService,
    CarInfoService,
    DocumentFileService,
    HistoryConversationService,
  ],
  exports: [RabbitmqService],
})
export class RabbitmqModule {}
