import { Controller, Logger } from '@nestjs/common'
import { RabbitmqService } from './rabbitmq.service'
import { WHAPI_RECEIVED_QUEUE_NAME, WHAPI_SENT_QUEUE_NAME } from './constants'
import { EventPattern, Payload } from '@nestjs/microservices'
import { SendMessageDto } from './dto/send-message.dto'
import { NewMessageWebhookDto } from '../webhook/dto/new-message-webhook.dto'

@Controller()
export class RabbitmqController {
  private readonly logger = new Logger(RabbitmqController.name)
  constructor(private readonly rabbitmqService: RabbitmqService) {}

  @EventPattern(WHAPI_RECEIVED_QUEUE_NAME)
  async handleMessageReceived(@Payload() data: NewMessageWebhookDto) {
    try {
      this.logger.log(`New message received: ${JSON.stringify(data)}`)
      await this.rabbitmqService.handleMessageReceived(data)
    } catch (error) {
      this.logger.error(`Error processing message received: ${error}`)
    }
  }

  @EventPattern(WHAPI_SENT_QUEUE_NAME)
  async handleAlert(@Payload() data: SendMessageDto) {
    try {
      this.logger.log(`New message to sendc: ${data}`)
      await this.rabbitmqService.handleMessageToSent(data)
    } catch (error) {
      this.logger.error(`Error processing message to sent: ${error}`)
    }
  }
}
