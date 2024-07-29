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

@Module({
  imports: [
    ClientsModule.register([
      { ...queueConfig(WHAPI_SENT_QUEUE_NAME) },
      { ...queueConfig(WHAPI_RECEIVED_QUEUE_NAME) },
    ]),
    ExternalApiModule,
  ],
  controllers: [RabbitmqController],
  providers: [RabbitmqService],
  exports: [RabbitmqService],
})
export class RabbitmqModule {}
