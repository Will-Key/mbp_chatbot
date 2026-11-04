import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Logger,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { isMetaWebhook, MetaWebhookDto } from './dto/meta-webhook.dto'
import { NewMessageWebhookDto } from './dto/new-message-webhook.dto'
import { mapMetaWebhook } from './meta-webhook.mapper'
import { MetaSignatureGuard } from './meta-signature.guard'
import { WebhookService } from './webhook.service'

@Controller('webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name)

  constructor(private readonly webhookService: WebhookService) {}

  /**
   * Meta calls this once when the callback URL is registered, and expects the
   * challenge echoed back as plain text.
   */
  @Get()
  verify(@Query() query: Record<string, string>) {
    const mode = query['hub.mode']
    const token = query['hub.verify_token']
    const challenge = query['hub.challenge']

    if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
      this.logger.log('Meta webhook verification succeeded')
      return challenge
    }

    this.logger.warn('Meta webhook verification failed: bad mode or token')
    throw new ForbiddenException()
  }

  @UseGuards(MetaSignatureGuard)
  @Post()
  async newMessage(@Body() payload: NewMessageWebhookDto | MetaWebhookDto) {
    // Always answer 200: Meta retries any non-2xx, which would duplicate
    // messages already pushed to the queue.
    try {
      const message = isMetaWebhook(payload)
        ? mapMetaWebhook(payload)
        : (payload as NewMessageWebhookDto)

      // Delivery receipts and other non-message events map to null.
      if (!message?.messages?.length) return { received: true }

      await this.webhookService.handleReceivedMessage(message)
    } catch (error) {
      this.logger.error(`Error handling webhook payload: ${error}`)
    }
    return { received: true }
  }
}
