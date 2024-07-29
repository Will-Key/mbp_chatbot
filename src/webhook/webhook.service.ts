import { Injectable } from '@nestjs/common'
import { NewMessageWebhookDto } from './dto/new-message-webhook.dto'
import { RabbitmqService } from '../rabbitmq/rabbitmq.service'

@Injectable()
export class WebhookService {
  constructor(private readonly rabbitmqService: RabbitmqService) {}

  async handleReceivedMessage(message: NewMessageWebhookDto) {
    await this.rabbitmqService.pushMessageReceived(message)
  }
}
