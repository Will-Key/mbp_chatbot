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
  HistoryConversationReasonForEnding,
  HistoryConversationStatus,
  StepBadResponseMessageErrorType,
  StepExpectedResponseType,
} from '@prisma/client'
import { StepService } from '../step/step.service'
import { CreateConversationDto } from '../conversation/dto/create-conversation.dto'
import { DriverPersonalInfoService } from '../driver-personal-info/driver-personal-info.service'
import { CreateDocumentFileDto } from '../document-file/dto/create-document-file.dto'
import { DocumentFileService } from '../document-file/document-file.service'
import { WhapiService } from '../external-api/whapi.service'
import { GetOcrResponseDto } from '../external-api/dto/get-ocr-response.dto'
import { OcrSpaceService } from '../external-api/ocr-space.service'
import { ConversationType } from '../shared/types'
import { CreateYangoProfileDto } from '../external-api/dto/create-yango-profile.dto'
import { DriverLicenseInfoService } from '../driver-license-info/driver-license-info.service'
import { YangoService } from '../external-api/yango.service'
import { CreateHistoryConversationDto } from '../history-conversation/dto/create-history-conversation.dto'
import { HistoryConversationService } from '../history-conversation/history-conversation.service'
import { Cron, CronExpression } from '@nestjs/schedule'
import { subMinutes } from 'date-fns'
import { OtpService } from '../external-api/otp.service'

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
    private readonly driverPersonalInfoService: DriverPersonalInfoService,
    private readonly driverLicenseInfoService: DriverLicenseInfoService,
    private readonly documentFileService: DocumentFileService,
    private readonly whapiService: WhapiService,
    private readonly ocrSpaceService: OcrSpaceService,
    private readonly yangoService: YangoService,
    private readonly historyConversationService: HistoryConversationService,
    private readonly otpService: OtpService
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
          'equalLength',
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
        await this.handleOtpVerification(lastConversation, newMessage)
        break
      case 3:
        await this.handleDriverLicenseFrontUpload(lastConversation, newMessage)
        break
      // case 4:
      //   await this.handleDriverLicenseBackUpload(lastConversation, newMessage)
      //   break
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
    try {
      const flowId = 1
      const phoneNumber = newMessage.messages[0].text.body.trim()
      if (phoneNumber.length !== 10) {
        const errorMessage = this.getErrorMessage(
          lastConversation,
          'equalLength',
        )
        await this.updateMessage(lastConversation, errorMessage)
        return
      }
      const driver =
        await this.driverPersonalInfoService.findDriverPersonalInfoByPhoneNumber(
          `225${phoneNumber}`,
        )
      if (driver) {
        const errorMessage = this.getErrorMessage(lastConversation, 'isExist')
        await this.updateMessage(lastConversation, errorMessage)
        return
      }

      await this.otpService.generateAndSendOtp(phoneNumber)

      const nextStep = await this.stepService.findOneBylevelAndFlowId(
        lastConversation.step.level + 1,
        flowId,
      )
      await this.saveMessage({
        whaPhoneNumber: newMessage.messages[0].from,
        convMessage: `225${phoneNumber}`,//newMessage.messages[0].text.body,
        nextMessage: nextStep.message,
        stepId: nextStep.id,
      })
    } catch (error) {
      let errorMessage = error.message
      if (errorMessage != "OTP envoyé avec succès") 
        errorMessage = "Erreur lors de l'envoie du OTP.\nVeuillez reéssayer."
      
      await this.updateMessage(lastConversation, errorMessage)
      return
    }
  }

  private async handleOtpVerification(
    lastConversation: ConversationType,
    newMessage: NewMessageWebhookDto,
  ) {
    const flowId = 1
    const whaPhoneNumber = newMessage.messages[0].from
    const otpEnter = newMessage.messages[0].text.body.trim()

    const phoneNumber = (await this.conversationService.findPhoneNumberLastConversation(whaPhoneNumber)).message

    const isVerified = this.otpService.verifyOtp(phoneNumber, otpEnter)

    if (!isVerified) {
      const errorMessage = "Code incorrect"
      await this.updateMessage(lastConversation, errorMessage)
      return
    }

    const nextStep = await this.stepService.findOneBylevelAndFlowId(
      lastConversation.step.level + 1,
      flowId,
    )
    await this.saveMessage({
      whaPhoneNumber: newMessage.messages[0].from,
      convMessage: `225${phoneNumber}`,//newMessage.messages[0].text.body,
      nextMessage: nextStep.message,
      stepId: nextStep.id,
    })
  }

  private async handleDocumentUpload(
    lastConversation: ConversationType,
    newMessage: NewMessageWebhookDto,
    documentSide: 'FRONT' | 'BACK',
    documentType: 'DRIVER_LICENSE' | 'CAR_REGISTRATION',
    nextStepLevel: number,
    flowId: number = 1
  ) {
    const whaPhoneNumber = newMessage.messages[0].from;

    const checkImageValidityResponse = await this.checkImageValidity(lastConversation, newMessage);
    if (checkImageValidityResponse === 0) return;

    const link = newMessage.messages[0].image.link
    this.logger.log(`${documentType} ${documentSide} link`, link);

    const createDocumentFile: CreateDocumentFileDto = {
      dataImageUrl: link,
      documentSide,
      documentType,
      whaPhoneNumber,
    };

    const doc = await this.documentFileService.create(createDocumentFile);
    if (!doc) {
      const errorMessage = "L'image n'a pas pu être traitée.\nVeuillez réessayer.";
      await this.updateMessage(lastConversation, errorMessage);
      return;
    }

    const ocrResponse = await this.ocrSpaceService.sendFile(doc);
    if (ocrResponse === 0) {
      const errorMessage = "L'image n'a pas pu être traitée.\nVeuillez réessayer.";
      await this.updateMessage(lastConversation, errorMessage);
      return;
    }

    const nextStep = await this.stepService.findOneBylevelAndFlowId(
      nextStepLevel,
      flowId,
    );

    await this.saveMessage({
      whaPhoneNumber,
      convMessage: newMessage.messages[0].image.link,
      nextMessage: nextStep.message,
      stepId: nextStep.id,
    });
  }

  private async handleDriverLicenseFrontUpload(
    lastConversation: ConversationType,
    newMessage: NewMessageWebhookDto
  ) {
    await this.handleDocumentUpload(
      lastConversation,
      newMessage,
      'FRONT',
      'DRIVER_LICENSE',
      lastConversation.step.level + 1
    );
  }

  private async handleDriverLicenseBackUpload(
    lastConversation: ConversationType,
    newMessage: NewMessageWebhookDto
  ) {
    await this.handleDocumentUpload(
      lastConversation,
      newMessage,
      'BACK',
      'DRIVER_LICENSE',
      lastConversation.step.level + 1
    );
  }

  private async handleCarRegistrationUpload(
    lastConversation: ConversationType,
    newMessage: NewMessageWebhookDto
  ) {
    await this.handleDocumentUpload(
      lastConversation,
      newMessage,
      'FRONT',
      'CAR_REGISTRATION',
      19
    );
    // TODO: Add a cron for sending data to Yango 
    // Or do it when we are on the last step
    await this.sendDataToYango(newMessage);
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

    const driverPersonalInfo = await this.driverPersonalInfoService.findDriverPersonalInfoByPhoneNumber(phoneNumber)
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
        number: driverPersonalInfo.licenseNumber,
      },
      full_name: {
        first_name: driverPersonalInfo.firstName,
        last_name: driverPersonalInfo.lastName
      },
      profile: {
        hire_date: new Date().toISOString()
      }
    }

    // const createYangoP = await this.yangoService.createProfile(createYangoDto)

    // const { nextMessage, stepId } = createYangoP === 1 ? {
    //   nextMessage: 'Votre inscription a été effectué avec succès.',
    //   stepId: 20
    // } : {
    //   nextMessage: 'Votre inscription a échoué.',
    //   stepId: 24
    // }
    console.log('createYangoDto', createYangoDto)
    await this.saveMessage({
      whaPhoneNumber,
      convMessage: newMessage.messages[0].text.body,
      nextMessage: JSON.stringify(createYangoDto),
      stepId: 20,
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
    if (conv) {
      await this.editHistoryConversation({
        whaPhoneNumber: conv.whaPhoneNumber,
        status: HistoryConversationStatus.IN_PROGRESS,
        stepId: conv.stepId
      })
      await this.pushMessageToSent({
        to: whaPhoneNumber,
        body: nextMessage,
        typing_time: 5,
      })
    }
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
      await this.editHistoryConversation({
        whaPhoneNumber: conversation.whaPhoneNumber,
        status: HistoryConversationStatus.FAIL,
        reason: HistoryConversationReasonForEnding.ERROR,
        stepId: conversation.stepId
      })
      await this.deleteAllConversations(conversation)
      await this.deleteInfoCollected(conversation)
      const errorStep = await this.stepService.findOneByLevel(15)
      // Push message to whapi queue to demand to driver to go on MBP local
      await this.handleMessageToSent({
        to: conversation.whaPhoneNumber,
        body: errorStep.message,
        typing_time: 5,
      })
      return
    }
    await this.editHistoryConversation({
      whaPhoneNumber: conversation.whaPhoneNumber,
      status: HistoryConversationStatus.IN_PROGRESS,
      reason: HistoryConversationReasonForEnding.ERROR,
      stepId: conversation.stepId
    })
    this.handleMessageToSent({
      to: conversation.whaPhoneNumber,
      body: message,
      typing_time: 5,
    })
  }

  private async editHistoryConversation(payload: CreateHistoryConversationDto) {
    console.log('historyConvPayload', payload)
    if (payload.stepId === 1) {
      await this.historyConversationService.create(payload)
    } else {
      const stepId = (payload.reason === HistoryConversationReasonForEnding.ERROR ||
        payload.reason === HistoryConversationReasonForEnding.TIME_LIMIT_REACHED
      )
        ? payload.stepId : payload.stepId - 1
      const history = await this.historyConversationService.findOneByWhaPhoneNumberAndStepId(
        payload.whaPhoneNumber,
        stepId
      )
      console.log('history', history)
      if (history) await this.historyConversationService.update(history?.id, payload)
    }
  }

  private async deleteAllConversations(conversation: Conversation) {
    await this.conversationService.removeAllByPhoneNumber(
      conversation.whaPhoneNumber,
    )
  }

  private async deleteInfoCollected(conversation: Conversation) {
    const PersonalInfo = await this.driverPersonalInfoService.deleteByWhaPhoneNumber(conversation.whaPhoneNumber)
    await this.driverLicenseInfoService.deleteByPhoneNumber(PersonalInfo.phoneNumber)
  }

  private getErrorMessage(
    lastConversation: ConversationType,
    errorType: StepBadResponseMessageErrorType,
  ): string {
    return lastConversation.step.stepBadResponseMessage.find(
      (sbrm) => sbrm.errorType === errorType,
    )?.message
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

  @Cron(CronExpression.EVERY_MINUTE)
  async deleteOldConversations() {
    this.logger.log("I'am the old conversations undertaker")
    const fiveMinutesAgo = subMinutes(new Date(), 5);

    const phoneNumbers = await this.conversationService.getPhoneNumbers();
    console.log('phoneNumbers', phoneNumbers)
    for (const { whaPhoneNumber } of phoneNumbers) {
      const lastConversation = await this.conversationService.findPhoneNumberLastConversation(whaPhoneNumber);
      console.log('lastConversation', lastConversation)
      if (lastConversation && lastConversation.updatedAt < fiveMinutesAgo) {
        await this.conversationService.removeAllByPhoneNumber(whaPhoneNumber);
        this.logger.log(`Conversations deleted for phone number: ${whaPhoneNumber}`);
        await this.editHistoryConversation({
          whaPhoneNumber,
          status: HistoryConversationStatus.FAIL,
          reason: HistoryConversationReasonForEnding.TIME_LIMIT_REACHED,
          stepId: lastConversation.stepId
        })
      }
    }
  }
}
