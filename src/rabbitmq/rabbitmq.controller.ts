import { Controller, Logger } from '@nestjs/common'
import { RabbitmqService } from './rabbitmq.service'
import { WHAPI_RECEIVED_QUEUE_NAME, WHAPI_SENT_QUEUE_NAME } from './constants'
import { MessagePattern, Payload } from '@nestjs/microservices'
import { SendMessageDto } from './dto/send-message.dto'
import { NewMessageWebhookDto } from '../webhook/dto/new-message-webhook.dto'

@Controller()
export class RabbitmqController {
  private readonly logger = new Logger(RabbitmqController.name)
  constructor(private readonly rabbitmqService: RabbitmqService) {}

  @MessagePattern(WHAPI_RECEIVED_QUEUE_NAME)
  async handleMessageReceived(@Payload() data: NewMessageWebhookDto) {
    try {
      await this.rabbitmqService.handleMessageReceived(data)
    } catch (error) {
      this.logger.error(`Error processing message received: ${error}`)
    }
  }

  @MessagePattern(WHAPI_SENT_QUEUE_NAME)
  async handleAlert(@Payload() data: SendMessageDto) {
    try {
      await this.rabbitmqService.handleMessageToSent(data)
    } catch (error) {
      this.logger.error(`Error processing message to sent: ${error}`)
    }
  }
}
