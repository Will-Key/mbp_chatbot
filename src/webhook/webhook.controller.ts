import { Controller, Post, Body } from '@nestjs/common'
import { WebhookService } from './webhook.service'
import { NewMessageWebhookDto } from './dto/new-message-webhook.dto'

@Controller('webhook')
export class WebhookController {
  constructor(
    private readonly webhookService: WebhookService,
  ) { }

  @Post()
  async newMessage(@Body() message: NewMessageWebhookDto) {
    if (message.messages[0].from_me === false) {
      console.log('newMessage from me', message)
      await this.webhookService.handleReceivedMessage(message)
    }
    //return this.queueService.pushMessageToQueue(message)
  }
}
