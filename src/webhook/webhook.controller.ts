import { Controller, Post, Body } from '@nestjs/common'
import { WebhookService } from './webhook.service'
import { NewMessageWebhookDto } from './dto/new-message-webhook.dto'

@Controller('webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post()
  newMessage(@Body() createWebhookDto: NewMessageWebhookDto) {
    return this.webhookService.create(createWebhookDto)
  }
}
