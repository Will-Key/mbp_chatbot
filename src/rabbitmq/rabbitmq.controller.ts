import { Controller, Logger } from '@nestjs/common'
import { RabbitmqService } from './rabbitmq.service'
import {
  OCR_SENT_QUEUE_NAME,
  WHAPI_RECEIVED_QUEUE_NAME,
  WHAPI_SENT_QUEUE_NAME,
} from './constants'
import { Ctx, MessagePattern, Payload, RmqContext } from '@nestjs/microservices'
import { SendMessageDto } from '../external-api/dto/send-message.dto'
import { NewMessageWebhookDto } from '../webhook/dto/new-message-webhook.dto'
import { DocumentFile } from '@prisma/client'

@Controller()
export class RabbitmqController {
  // private readonly logger = new Logger(RabbitmqController.name)
  // constructor(private readonly rabbitmqService: RabbitmqService) { }

  // @MessagePattern(WHAPI_RECEIVED_QUEUE_NAME)
  // async handleMessageReceived(@Payload() data: NewMessageWebhookDto, @Ctx() ctx: RmqContext) {
  //   try {
  //     this.logger.log(`New message received: ${!data.messages[0].from_me}`)
  //     if (!data.messages[0].from_me)
  //       await this.rabbitmqService.handleMessageReceived(data, ctx)
  //     else this.logger.error('Message sent by the bot')
  //   } catch (error) {
  //     this.logger.error(`Error processing message received: ${error}`)
  //   }
  // }

  // @MessagePattern(WHAPI_SENT_QUEUE_NAME)
  // async handleMessageToSent(@Payload() data: SendMessageDto) {
  //   try {
  //     this.logger.log(`New message to send: ${data}`)
  //     await this.rabbitmqService.handleMessageToSent(data)
  //   } catch (error) {
  //     this.logger.error(`Error processing message to sent: ${error}`)
  //   }
  // }

  // @MessagePattern(OCR_SENT_QUEUE_NAME)
  // async handleToFile(@Payload() data: DocumentFile) {
  //   try {
  //     this.logger.log(`New message to send: ${data}`)
  //     await this.rabbitmqService.handleDocumentPushed(data)
  //   } catch (error) {
  //     this.logger.error(`Error processing message to sent: ${error}`)
  //   }
  // }
}
