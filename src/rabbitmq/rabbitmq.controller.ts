import { Controller, Logger } from '@nestjs/common'
import { RabbitmqService } from './rabbitmq.service'
import {
  CREATE_YANGO_CAR_SENT_QUEUE_NAME,
  CREATE_YANGO_PROFILE_SENT_QUEUE_NAME,
  OCR_SENT_QUEUE_NAME,
  UPDATE_YANGO_DRIVER_INFO_SENT_QUEUE_NAME,
  WHAPI_RECEIVED_QUEUE_NAME,
  WHAPI_SENT_QUEUE_NAME,
} from './constants'
import { EventPattern, Payload } from '@nestjs/microservices'
import { SendMessageDto } from '../external-api/dto/send-message.dto'
import { NewMessageWebhookDto } from '../webhook/dto/new-message-webhook.dto'
import { DocumentFile } from '@prisma/client'
import { CreateYangoProfileDto } from '../external-api/dto/create-yango-profile.dto'
import { CreateYangoCarDto } from 'src/external-api/dto/create-yango-car.dto'

@Controller()
export class RabbitmqController {
  private readonly logger = new Logger(RabbitmqController.name)
  constructor(private readonly rabbitmqService: RabbitmqService) {}

  @EventPattern(WHAPI_RECEIVED_QUEUE_NAME)
  async handleMessageReceived(@Payload() data: NewMessageWebhookDto) {
    try {
      //this.logger.log(`New message received: ${JSON.stringify(data)}`)
      if (!data.messages[0].from_me)
        await this.rabbitmqService.handleMessageReceived(data)
    } catch (error) {
      this.logger.error(`Error processing message received: ${error}`)
    }
  }

  @EventPattern(WHAPI_SENT_QUEUE_NAME)
  async handleAlert(@Payload() data: SendMessageDto) {
    try {
      this.logger.log(`New message to send: ${data}`)
      await this.rabbitmqService.handleMessageToSent(data)
    } catch (error) {
      this.logger.error(`Error processing message to sent: ${error}`)
    }
  }

  @EventPattern(OCR_SENT_QUEUE_NAME)
  async handleToFile(@Payload() data: DocumentFile) {
    try {
      this.logger.log(`New message to send: ${data}`)
      await this.rabbitmqService.handleDocumentPushed(data)
    } catch (error) {
      this.logger.error(`Error processing message to sent: ${error}`)
    }
  }

  @EventPattern(CREATE_YANGO_PROFILE_SENT_QUEUE_NAME)
  async createYangoProfile(@Payload() data: CreateYangoProfileDto) {
    try {
      this.logger.log(`Create yango profile: ${data}`)
      await this.rabbitmqService.handleCreateYangoProfile(data)
    } catch (error) {
      this.logger.error(`Error processing during yango profile creation: ${error}`)
    }
  }

  @EventPattern(CREATE_YANGO_CAR_SENT_QUEUE_NAME)
  async createYangoCar(@Payload() data: CreateYangoCarDto) {
    try {
      this.logger.log(`Create Yango car: ${data}`)
      await this.rabbitmqService.handleCreateYangoCar(data)
    } catch (error) {
      this.logger.error(`Error processing yango car creation: ${error}`)
    }
  }

  @EventPattern(UPDATE_YANGO_DRIVER_INFO_SENT_QUEUE_NAME)
  async updateYangoDriverInfo(@Payload() data: DocumentFile) {
    try {
      this.logger.log(`New message to send: ${data}`)
      await this.rabbitmqService.handleDocumentPushed(data)
    } catch (error) {
      this.logger.error(`Error processing message to sent: ${error}`)
    }
  }
}
