import { Module } from '@nestjs/common'
import { RabbitmqModule } from 'src/rabbitmq/rabbitmq.module'
import { AppParameterModule } from '../app-parameter/app-parameter.module'
import { MetaSignatureGuard } from './meta-signature.guard'
import { WebhookController } from './webhook.controller'
import { WebhookService } from './webhook.service'

@Module({
  imports: [RabbitmqModule, AppParameterModule],
  controllers: [WebhookController],
  providers: [WebhookService, MetaSignatureGuard],
})
export class WebhookModule {}
