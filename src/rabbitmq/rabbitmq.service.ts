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
import { CreateYangoProfileDto } from '../external-api/dto/create-yango-profile.dto'
import { DriverLicenseInfoService } from '../driver-license-info/driver-license-info.service'
import { YangoService } from '../external-api/yango.service'

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
    private readonly driverPersonnalInfoService: DriverPersonnalInfoService,
    private readonly driverLicenseInfoService: DriverLicenseInfoService,
    private readonly documentFileService: DocumentFileService,
    private readonly whapiService: WhapiService,
    private readonly ocrSpaceService: OcrSpaceService,
    private readonly yangoService: YangoService
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
      await this.getFirstFlowSteps(lastConversation, newMessage)
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
  ) {
    switch (lastConversation.step.level) {
      case 1:
        await this.handlePhoneNumberStep(lastConversation, newMessage)
        break
      case 2:
        await this.handleDriverLicenseFrontUpload(lastConversation, newMessage)
        break
      case 3:
        await this.handleDriverLicenseBackUpload(lastConversation, newMessage)
        break
      case 4:
        await this.handleCarRegistrationUpload(lastConversation, newMessage)
        break
      default:
        this.updateMessage(lastConversation, newMessage.messages[0].text.body)
    }
  }

  private async handlePhoneNumberStep(
    lastConversation: ConversationType,
    newMessage: NewMessageWebhookDto,
  ) {
    const flowId = 1
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
      await this.driverPersonnalInfoService.findDriverPersonnalInfoByPhoneNumber(
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
      convMessage: `225${incomingMessage}`,//newMessage.messages[0].text.body,
      nextMessage: nextStep.message,
      stepId: nextStep.id,
    })
  }

  private async handleDriverLicenseFrontUpload(
    lastConversation: ConversationType,
    newMessage: NewMessageWebhookDto
  ) {
    const flowId = 1
    const checkImageValidityResponse = await this.checkImageValidity(lastConversation, newMessage)
    if (checkImageValidityResponse === 0) return

    const createDocumentFile: CreateDocumentFileDto = {
      dataImageUrl: newMessage.messages[0].image.link,
      documentSide: 'FRONT',
      documentType: 'DRIVER_LICENSE',
      whaPhoneNumber: newMessage.messages[0].from,
    }
    const doc = await this.documentFileService.create(createDocumentFile)
    const ocrResponse = await this.ocrSpaceService.sendFile(doc)
    if (ocrResponse === 0) {
      const errorMessage = "Le numéro n'a pas pu être récupérer.\nRéessayer."
      //{...lastConversation, badResponseCount: 5}
      await this.updateMessage(lastConversation, errorMessage)
      return
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
  ) {
    const flowId = 1
    const checkImageValidityResponse = await this.checkImageValidity(lastConversation, newMessage)
    console.log('checkingImageValidityResponse', checkImageValidityResponse)
    if (checkImageValidityResponse === 0) return

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
  ) {
    const flowId = 1
    const checkImageValidityResponse = await this.checkImageValidity(lastConversation, newMessage)
    console.log('checkingImageValidityResponse', checkImageValidityResponse)
    if (checkImageValidityResponse === 0) return

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
      19,
      flowId,
    )
    await this.saveMessage({
      whaPhoneNumber: newMessage.messages[0].from,
      convMessage: newMessage.messages[0].image.link,
      nextMessage: nextStep.message,
      stepId: nextStep.id,
    })

    // TODO: Add a cron for send data to yango 
    // Or do it when we are on the last step
    //await this.sendDataToYango(newMessage)
  }

  private async checkImageValidity(lastConversation: ConversationType, newMessage: NewMessageWebhookDto) {

    const regex = /^(http|https):\/\/[^ "]+$/
    if (newMessage.messages[0].type !== StepExpectedResponseType.image ||
      !newMessage.messages[0].image.link || !regex.test(newMessage.messages[0].image.link) ||
      !newMessage.messages[0].image.preview.includes('data:image')) {
      const errorMessage = this.getErrorMessage(lastConversation, 'incorrectChoice')
      await this.updateMessage(lastConversation, errorMessage)
      return 0
    }

    if (newMessage.messages[0].image.file_size > 1000000) {
      const errorMessage = this.getErrorMessage(lastConversation, 'maxSize')
      await this.updateMessage(lastConversation, errorMessage)
      return 0
    }

    return 1
  }

  private async sendDataToYango(
    newMessage: NewMessageWebhookDto,
  ) {
    //const nextStep = await this.stepService.findOneBylevelAndFlowId(19, 1)
    const whaPhoneNumber = newMessage.messages[0].from

    const phoneNumber = (await this.conversationService.findOneByStepLevelAndWhaPhoneNumber(1, 1, whaPhoneNumber)).message

    const driverPersonnalInfo = await this.driverPersonnalInfoService.findDriverPersonnalInfoByPhoneNumber(phoneNumber)
    const driverLicenseInfo = await this.driverLicenseInfoService.findLicenseInfoByPhoneNumber(phoneNumber)

    // Push conversation to yango queue for 
    const createYangoDto: CreateYangoProfileDto = {
      order_provider: {
        partner: true,
        platform: true
      },
      person: {
        contact_info: {
          phone: phoneNumber
        }
      },
      driver_license: {
        country: 'civ',
        expiry_date: driverLicenseInfo.expiryDate.toISOString(),
        issue_date: driverLicenseInfo.deliveryDate.toISOString(),
        number: driverPersonnalInfo.licenseNumber,
      },
      full_name: {
        first_name: driverPersonnalInfo.firstName,
        last_name: driverPersonnalInfo.lastName
      },
      profile: {
        hire_date: new Date().toISOString()
      }
    }

    const createYangoP = await this.yangoService.createProfile(createYangoDto)

    const { nextMessage, stepId } = createYangoP === 1 ? {
      nextMessage: 'Votre inscription a été effectué avec succès.',
      stepId: 20
    } : {
      nextMessage: 'Votre inscription a échoué.',
      stepId: 24
    }
    await this.saveMessage({
      whaPhoneNumber,
      convMessage: newMessage.messages[0].text.body,
      nextMessage,
      stepId,
    })
  }

  private async getSecondFlowSteps(
    lastConversation: ConversationType,
    newMessage: NewMessageWebhookDto,
    conversations: Conversation[],
  ) {
    switch (conversations.length) {
      case 2:
        await this.handlePhoneNumberStep(lastConversation, newMessage)
        break
      case 3:
      case 7:
        await this.handleSecondFlowFinalStep(newMessage, 2)
        break
      default:
        this.updateMessage(lastConversation, newMessage.messages[0].text.body)
    }
  }

  private async handleSecondFlowFinalStep(
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
      await this.deleteAllConversations(conversation)
      const errorStep = await this.stepService.findOneByLevel(15)
      // Push message to whapi queue to demand to driver to go on MBP local
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

  private async deleteAllConversations(conversation: Conversation) {
    await this.conversationService.removeAllByPhoneNumber(
      conversation.whaPhoneNumber,
    )
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
