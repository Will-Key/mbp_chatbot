import { Module } from '@nestjs/common'
import { RabbitmqService } from './rabbitmq.service'
import { RabbitmqController } from './rabbitmq.controller'
import { ClientsModule } from '@nestjs/microservices'
import { queueConfig } from './constants'

@Module({
  imports: [ClientsModule.register([{ ...queueConfig('whapi-queue') }])],
  controllers: [RabbitmqController],
  providers: [RabbitmqService],
})
export class RabbitmqModule {}
