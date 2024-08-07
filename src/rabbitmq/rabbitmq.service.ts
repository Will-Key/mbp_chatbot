import { Inject, Injectable, Logger } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import {
  WHAPI_SENT_QUEUE_NAME,
  WHAPI_RECEIVED_QUEUE_NAME,
  OCR_SENT_QUEUE_NAME,
} from './constants'
import { SendMessageDto } from '../external-api/dto/send-message.dto'
import { firstValueFrom } from 'rxjs'
import { NewMessageWebhookDto } from '../webhook/dto/new-message-webhook.dto'
import { ConversationService } from '../conversation/conversation.service'
import {
  Conversation,
  DocumentFile,
  DocumentSide,
  DocumentType,
  StepBadResponseMessageErrorType,
  StepExpectedResponseType,
} from '@prisma/client'
import { StepService } from '../step/step.service'
import { CreateConversationDto } from '../conversation/dto/create-conversation.dto'
import { DriverPersonnalInfoService } from '../driver-personnal-info/driver-personnal-info.service'
import { CreateDocumentFileDto } from '../document-file/dto/create-document-file.dto'
import { DocumentFileService } from '../document-file/document-file.service'
import { WhapiService } from '../external-api/whapi.service'
import { GetOcrResponseDto } from '../external-api/dto/get-ocr-response.dto'
import { OcrSpaceService } from '../external-api/ocr-space.service'
import { ConversationType } from '../shared/types'

@Injectable()
export class RabbitmqService {
  private readonly logger = new Logger(RabbitmqService.name)

  constructor(
    @Inject('WHAPI_RECEIVED_SERVICE')
    private readonly whapiReceivedQueueClient: ClientProxy,
    @Inject('WHAPI_SENT_SERVICE')
    private readonly whapiSentQueueClient: ClientProxy,
    private readonly conversationService: ConversationService,
    private readonly stepService: StepService,
    private readonly driverService: DriverPersonnalInfoService,
    private readonly documentFileService: DocumentFileService,
    private readonly whapiService: WhapiService,
    private readonly ocrSpaceService: OcrSpaceService,
  ) { }

  onModuleInit() {
    this.whapiReceivedQueueClient.connect()
    this.whapiSentQueueClient.connect()
  }

  onModuleDestroy() {
    this.whapiReceivedQueueClient.close()
    this.whapiSentQueueClient.close()
  }

  async pushMessageReceived(message: NewMessageWebhookDto) {
    try {
      await firstValueFrom(
        this.whapiReceivedQueueClient.emit(WHAPI_RECEIVED_QUEUE_NAME, message),
      )
      this.logger.log(
        `Push received message to queue: ${JSON.stringify(message)}`,
      )
    } catch (error) {
      this.logger.error(`Error during push of received message: ${error}`)
    }
  }

  async handleMessageReceived(message: NewMessageWebhookDto) {
    await this.newMessage(message)
  }

  async newMessage(newMessage: NewMessageWebhookDto) {
    const conversations =
      await this.conversationService.findManyByWhaPhoneNumber(
        newMessage.messages[0].from,
      )
    const lastConversation = conversations?.[0]

    if (lastConversation) {
      await this.handleExistingConversation(
        lastConversation,
        newMessage,
        conversations,
      )
    } else {
      await this.handleNewConversation(newMessage)
    }
  }

  private async handleNewConversation(newMessage: NewMessageWebhookDto) {
    const initialStep = await this.stepService.findOneByLevel(0)
    await this.saveMessage({
      whaPhoneNumber: newMessage.messages[0].from,
      convMessage: newMessage.messages[0].text.body,
      nextMessage: initialStep.message,
      stepId: initialStep.id,
    })
  }

  private async handleExistingConversation(
    lastConversation: ConversationType,
    newMessage: NewMessageWebhookDto,
    conversations: Conversation[],
  ) {
    if (lastConversation.step.level === 0) {
      if (newMessage.messages[0].text.body.includes('1')) {
        await this.startFlow(newMessage, 1)
      } else if (newMessage.messages[0].text.body.includes('2')) {
        await this.startFlow(newMessage, 2)
      } else {
        const errorMessage = this.getErrorMessage(
          lastConversation,
          'incorrectChoice',
        )
        await this.updateMessage(lastConversation, errorMessage)
      }
    } else if (lastConversation.step.flowId === 1) {
      await this.getFirstFlowSteps(lastConversation, newMessage, conversations)
    } else if (lastConversation.step.flowId === 2) {
      await this.getSecondFlowSteps(lastConversation, newMessage, conversations)
    }
  }

  private async startFlow(newMessage: NewMessageWebhookDto, flowId: number) {
    const nextStep = await this.stepService.findOneBylevelAndFlowId(1, flowId)
    await this.saveMessage({
      whaPhoneNumber: newMessage.messages[0].from,
      convMessage: newMessage.messages[0].text.body,
      nextMessage: nextStep.message,
      stepId: nextStep.id,
    })
  }

  private async getFirstFlowSteps(
    lastConversation: ConversationType,
    newMessage: NewMessageWebhookDto,
    conversations: Conversation[],
  ) {
    switch (lastConversation.step.level) {
      case 1:
        await this.handlePhoneNumberStep(lastConversation, newMessage, 1)
        break
      case 2:
        await this.handleDriverLicenseFrontUpload(lastConversation, newMessage, 1)
        break
      case 3:
        await this.handleDriverLicenseBackUpload(lastConversation, newMessage, 1)
        break
      case 4:
        await this.handleCarRegistrationUpload(lastConversation, newMessage, 1)
        break
      case 5:
        await this.handleFinalStep(newMessage, 1)
        break
      default:
        this.updateMessage(lastConversation, newMessage.messages[0].text.body)
    }
  }

  private async handlePhoneNumberStep(
    lastConversation: ConversationType,
    newMessage: NewMessageWebhookDto,
    flowId: number,
  ) {
    const incomingMessage = newMessage.messages[0].text.body.trim()

    if (incomingMessage.length !== 10) {
      const errorMessage = this.getErrorMessage(
        lastConversation,
        'incorrectChoice',
      )
      await this.updateMessage(lastConversation, errorMessage)
      return
    }
    const driver =
      await this.driverService.findDriverPersonnalInfoByPhoneNumber(
        `225${incomingMessage}`,
      )
    if (driver) {
      const errorMessage = this.getErrorMessage(lastConversation, 'isExist')
      await this.updateMessage(lastConversation, errorMessage)
      return
    }

    const nextStep = await this.stepService.findOneBylevelAndFlowId(
      lastConversation.step.level + 1,
      flowId,
    )

    await this.saveMessage({
      whaPhoneNumber: newMessage.messages[0].from,
      convMessage: newMessage.messages[0].text.body,
      nextMessage: `225${incomingMessage}`,
      stepId: nextStep.id,
    })
  }

  private async handleDriverLicenseFrontUpload(
    lastConversation: ConversationType,
    newMessage: NewMessageWebhookDto,
    flowId: number) {
    const checkingResponse = await this.checkImageValidity(lastConversation, newMessage)
    if (!checkingResponse) return

    const createDocumentFile: CreateDocumentFileDto = {
      dataImageUrl: newMessage.messages[0].image.link,
      documentSide: 'FRONT',
      documentType: 'DRIVER_LICENSE',
      whaPhoneNumber: newMessage.messages[0].from,
    }
    const doc = await this.documentFileService.create(createDocumentFile)
    const ocrResponse = await this.ocrSpaceService.sendFile(doc)

    if (ocrResponse === 0) {
      const errorMessage = "Le numéro n'a pas pu être récupérer."
      await this.updateMessage(lastConversation, errorMessage)
    }

    const nextStep = await this.stepService.findOneBylevelAndFlowId(
      lastConversation.step.level + 1,
      flowId,
    )
    await this.saveMessage({
      whaPhoneNumber: newMessage.messages[0].from,
      convMessage: newMessage.messages[0].image.link,
      nextMessage: nextStep.message,
      stepId: nextStep.id,
    })
  }

  private async handleDriverLicenseBackUpload(
    lastConversation: ConversationType,
    newMessage: NewMessageWebhookDto,
    flowId: number
  ) {
    const checkingResponse = await this.checkImageValidity(lastConversation, newMessage)
    if (!checkingResponse) return

    const createDocumentFile: CreateDocumentFileDto = {
      dataImageUrl: newMessage.messages[0].image.link,
      documentSide: 'BACK',
      documentType: 'DRIVER_LICENSE',
      whaPhoneNumber: newMessage.messages[0].from,
    }
    const doc = await this.documentFileService.create(createDocumentFile)
    const ocrResponse = await this.ocrSpaceService.sendFile(doc)

    if (ocrResponse === 0) {
      const errorMessage = "Une erreur s'est produite lors de la récupération."
      await this.updateMessage(lastConversation, errorMessage)
    }

    const nextStep = await this.stepService.findOneBylevelAndFlowId(
      lastConversation.step.level + 1,
      flowId,
    )
    await this.saveMessage({
      whaPhoneNumber: newMessage.messages[0].from,
      convMessage: newMessage.messages[0].image.link,
      nextMessage: nextStep.message,
      stepId: nextStep.id,
    })
  }

  private async handleCarRegistrationUpload(
    lastConversation: ConversationType,
    newMessage: NewMessageWebhookDto,
    flowId: number
  ) {
    const checkingResponse = await this.checkImageValidity(lastConversation, newMessage)
    if (!checkingResponse) return

    const createDocumentFile: CreateDocumentFileDto = {
      dataImageUrl: newMessage.messages[0].image.link,
      documentSide: 'FRONT',
      documentType: 'CAR_REGISTRATION',
      whaPhoneNumber: newMessage.messages[0].from,
    }
    const doc = await this.documentFileService.create(createDocumentFile)
    const ocrResponse = await this.ocrSpaceService.sendFile(doc)
    if (ocrResponse === 0) {
      const errorMessage = "Une erreur s'est produite lors de la récupération."
      await this.updateMessage(lastConversation, errorMessage)
    }

    const nextStep = await this.stepService.findOneBylevelAndFlowId(
      lastConversation.step.level + 1,
      flowId,
    )
    await this.saveMessage({
      whaPhoneNumber: newMessage.messages[0].from,
      convMessage: newMessage.messages[0].image.link,
      nextMessage: nextStep.message,
      stepId: nextStep.id,
    })
  }

  private async checkImageValidity(lastConversation: ConversationType, newMessage: NewMessageWebhookDto) {
    if (newMessage.messages[0].type !== StepExpectedResponseType.image ||
      newMessage.messages[0].image.preview.includes('data:image')) {
      const errorMessage = this.getErrorMessage(lastConversation, 'incorrectChoice')
      await this.updateMessage(lastConversation, errorMessage)
      return 0
    }

    if (newMessage.messages[0].image) {
      const errorMessage = this.getErrorMessage(lastConversation, 'maxSize')
      await this.updateMessage(lastConversation, errorMessage)
      return 0
    }
  }

  private async handleFinalStep(
    newMessage: NewMessageWebhookDto,
    flowId: number,
  ) {
    const nextStep = await this.stepService.findOneBylevelAndFlowId(19, flowId)
    await this.saveMessage({
      whaPhoneNumber: newMessage.messages[0].from,
      convMessage: newMessage.messages[0].text.body,
      nextMessage: nextStep.message,
      stepId: nextStep.id,
    })
  }

  private async getSecondFlowSteps(
    lastConversation: ConversationType,
    newMessage: NewMessageWebhookDto,
    conversations: Conversation[],
  ) {
    switch (conversations.length) {
      case 2:
        await this.handlePhoneNumberStep(lastConversation, newMessage, 2)
        break
      case 3:
      case 7:
        await this.handleFinalStep(newMessage, 2)
        break
      default:
        this.updateMessage(lastConversation, newMessage.messages[0].text.body)
    }
  }

  private async saveMessage({
    whaPhoneNumber,
    convMessage,
    nextMessage,
    stepId,
  }: {
    whaPhoneNumber: string
    convMessage: string
    nextMessage: string
    stepId: number
  }) {
    const newConv: CreateConversationDto = {
      whaPhoneNumber,
      message: convMessage,
      stepId,
    }
    const conv = await this.conversationService.create(newConv)
    this.logger.log('conv', conv)
    if (conv)
      await this.pushMessageToSent({
        to: whaPhoneNumber,
        body: nextMessage,
        typing_time: 5,
      })
  }

  private async updateMessage(conversation: Conversation, message: string) {
    const updatedConversation = await this.conversationService.update(
      conversation.id,
      {
        message,
        badResponseCount: conversation.badResponseCount + 1,
      },
    )
    if (updatedConversation.badResponseCount >= 2) {
      const errorStep = await this.stepService.findOneByLevel(15)
      // Push message to whapi queue to demand to driver to go on MBP local
      await this.conversationService.removeAllByPhoneNumber(
        conversation.whaPhoneNumber,
      )
      this.handleMessageToSent({
        to: conversation.whaPhoneNumber,
        body: errorStep.message,
        typing_time: 5,
      })
      return
    }
    this.handleMessageToSent({
      to: conversation.whaPhoneNumber,
      body: message,
      typing_time: 5,
    })
  }

  private getErrorMessage(
    lastConversation: ConversationType,
    errorType: StepBadResponseMessageErrorType,
  ): string {
    return lastConversation.step.stepBadResponseMessage.find(
      (sbrm) => sbrm.errorType === errorType,
    ).message
  }

  async pushMessageToSent(message: SendMessageDto) {
    try {
      await firstValueFrom(
        this.whapiSentQueueClient.emit(WHAPI_SENT_QUEUE_NAME, message),
      )
      this.logger.log(`Emitting message to queue: ${JSON.stringify(message)}`)
    } catch (error) {
      this.logger.error(`Error emitting message: ${error}`)
    }
  }

  async handleMessageToSent(message: SendMessageDto) {
    this.logger.log(`sent message to whapi: ${JSON.stringify(message)}`)
    await this.whapiService.sendMessage({
      ...message,
      to: `${message.to}@s.whatsapp.net`,
    })
  }

  async pushDocument(doc: DocumentFile) {
    try {
      await firstValueFrom(
        this.whapiSentQueueClient.emit(OCR_SENT_QUEUE_NAME, doc),
      )
      this.logger.log(`Emitting doc to queue: ${JSON.stringify(doc)}`)
    } catch (error) {
      this.logger.error(`Error on emitting doc: ${error}`)
    }
  }

  async handleDocumentPushed(data: DocumentFile) {
    await this.ocrSpaceService.sendFile(data)
  }

  async pushOcrResponseToQueue(ocrResponse: GetOcrResponseDto) {
    try {
      await firstValueFrom(
        this.whapiSentQueueClient.emit(OCR_SENT_QUEUE_NAME, ocrResponse),
      )
      this.logger.log(`Emitting doc to queue: ${JSON.stringify(ocrResponse)}`)
    } catch (error) {
      this.logger.error(`Error on emitting doc: ${error}`)
    }
  }

  async handleOcrResponsePushedQueue() { }
}
