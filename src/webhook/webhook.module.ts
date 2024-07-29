import { Module } from '@nestjs/common'
import { WebhookService } from './webhook.service'
import { WebhookController } from './webhook.controller'
import { RabbitmqModule } from 'src/rabbitmq/rabbitmq.module'

@Module({
  imports: [RabbitmqModule],
  controllers: [WebhookController],
  providers: [WebhookService],
})
export class WebhookModule {}
