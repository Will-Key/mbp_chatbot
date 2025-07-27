import { Inject, Injectable, Logger } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { Cron, CronExpression } from '@nestjs/schedule'
import {
  Conversation,
  DocumentFile,
  HistoryConversationReasonForEnding,
  HistoryConversationStatus,
  StepBadResponseMessageErrorType,
  StepExpectedResponseType,
} from '@prisma/client'
import { subMinutes } from 'date-fns'
import { isValidPhoneNumber } from 'libphonenumber-js'
import { firstValueFrom } from 'rxjs'
import { CarInfoService } from '../car-info/car-info.service'
import { ConversationService } from '../conversation/conversation.service'
import { CreateConversationDto } from '../conversation/dto/create-conversation.dto'
import { DocumentFileService } from '../document-file/document-file.service'
import { CreateDocumentFileDto } from '../document-file/dto/create-document-file.dto'
import { DriverCarService } from '../driver-car/driver-car.service'
import { DriverLicenseInfoService } from '../driver-license-info/driver-license-info.service'
import { DriverPersonalInfoService } from '../driver-personal-info/driver-personal-info.service'
import { CreateYangoCarDto } from '../external-api/dto/create-yango-car.dto'
import { CreateYangoProfileDto } from '../external-api/dto/create-yango-profile.dto'
import { GetOcrResponseDto } from '../external-api/dto/get-ocr-response.dto'
import { SendMessageDto } from '../external-api/dto/send-message.dto'
import { OcrSpaceService } from '../external-api/ocr-space.service'
import { OtpService } from '../external-api/otp.service'
import { WhapiService } from '../external-api/whapi.service'
import { YangoService } from '../external-api/yango.service'
import { CreateHistoryConversationDto } from '../history-conversation/dto/create-history-conversation.dto'
import { HistoryConversationService } from '../history-conversation/history-conversation.service'
import { ConversationType } from '../shared/types'
import { StepService } from '../step/step.service'
import { NewMessageWebhookDto } from '../webhook/dto/new-message-webhook.dto'
import {
  CREATE_YANGO_CAR_SENT_QUEUE_NAME,
  CREATE_YANGO_PROFILE_SENT_QUEUE_NAME,
  OCR_SENT_QUEUE_NAME,
  UPDATE_YANGO_DRIVER_INFO_SENT_QUEUE_NAME,
  WHAPI_RECEIVED_QUEUE_NAME,
  WHAPI_SENT_QUEUE_NAME,
} from './constants'

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
    private readonly carInfoService: CarInfoService,
    private readonly driverCarService: DriverCarService,
    private readonly documentFileService: DocumentFileService,
    private readonly whapiService: WhapiService,
    private readonly ocrSpaceService: OcrSpaceService,
    private readonly yangoService: YangoService,
    private readonly historyConversationService: HistoryConversationService,
    private readonly otpService: OtpService,
  ) {}

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
    const message = newMessage.messages[0].text.body
    if (message.toLowerCase() === 'commencer') {
      await this.saveMessage({
        whaPhoneNumber: newMessage.messages[0].from,
        convMessage: newMessage.messages[0].text.body,
        nextMessage: initialStep.message,
        stepId: initialStep.id,
      })
    }
  }

  private async handleExistingConversation(
    lastConversation: ConversationType,
    newMessage: NewMessageWebhookDto,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _conversations: Conversation[],
  ) {
    if (lastConversation.step.level === 0) {
      if (newMessage.messages[0].text.body.includes('1')) {
        await this.startFlow(newMessage, 1)
      } else if (newMessage.messages[0].text.body.includes('2')) {
        await this.startFlow(newMessage, 2)
      } else if (newMessage.messages[0].text.body.includes('3')) {
        await this.startFlow(newMessage, 3)
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
      await this.getSecondFlowSteps(lastConversation, newMessage)
    } else if (lastConversation.step.flowId === 3) {
      await this.getThirdFlowSteps(lastConversation, newMessage)
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
      const phoneNumber = `225${this.removeAllSpaces(newMessage.messages[0].text.body)}`

      if (!isValidPhoneNumber(`+${phoneNumber}`)) {
        const errorMessage = this.getErrorMessage(
          lastConversation,
          'equalLength',
        )
        await this.updateMessage(lastConversation, errorMessage)
        return
      }
      const driver =
        await this.driverPersonalInfoService.findDriverPersonalInfoByPhoneNumber(
          phoneNumber,
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
        convMessage: phoneNumber, //newMessage.messages[0].text.body,
        nextMessage: nextStep.message,
        stepId: nextStep.id,
      })
      await this.delay(30000)
      await this.otpService.generateAndSendOtp(phoneNumber)
    } catch (error) {
      let errorMessage = error.message
      if (errorMessage != 'OTP envoyé avec succès')
        errorMessage = "Erreur lors de l'envoie du OTP.\nVeuillez reéssayer."

      await this.updateMessage(lastConversation, errorMessage)
      return
    }
  }

  private async handleOtpVerification(
    lastConversation: ConversationType,
    newMessage: NewMessageWebhookDto,
    flowId: number = 1,
  ) {
    const whaPhoneNumber = newMessage.messages[0].from
    const otpEnter = newMessage.messages[0].text.body.trim()

    const step = await this.stepService.findOneBylevelAndFlowId(flowId, flowId)

    const phoneNumber =
      flowId === 1
        ? (
            await this.conversationService.findOneByStepIdAndWhaPhoneNumber(
              step.id + 1,
              whaPhoneNumber,
            )
          ).message
        : (
            await this.conversationService.findOneByStepIdAndWhaPhoneNumber(
              step.id,
              whaPhoneNumber,
            )
          ).message

    const response = await this.otpService.verifyOtp(phoneNumber, otpEnter)
    if (['OTP_NOT_FOUND', 'OTP_EXPIRED', 'OTP_INVALID'].includes(response)) {
      const errorMessage = this.getErrorMessage(
        lastConversation,
        response === 'OTP_NOT_FOUND' || 'OTP_INVALID'
          ? 'incorrectCode'
          : 'isExpired',
      )
      if (response === 'OTP_EXPIRED')
        await this.otpService.generateAndSendOtp(phoneNumber)
      await this.updateMessage(lastConversation, errorMessage)
      return
    }

    const nextStep = await this.stepService.findOneBylevelAndFlowId(
      lastConversation.step.level + 1,
      flowId,
    )
    await this.saveMessage({
      whaPhoneNumber: newMessage.messages[0].from,
      convMessage: otpEnter, //newMessage.messages[0].text.body,
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
    flowId: number = 1,
  ) {
    const whaPhoneNumber = newMessage.messages[0].from

    const checkImageValidityResponse = await this.checkImageValidity(
      lastConversation,
      newMessage,
    )
    if (checkImageValidityResponse === 0)
      throw Error("L'élément partagé n'est pas une image")

    const link = newMessage.messages[0].image.link

    const createDocumentFile: CreateDocumentFileDto = {
      dataImageUrl: link,
      documentSide,
      documentType,
      whaPhoneNumber,
    }
    const doc = await this.documentFileService.create(createDocumentFile)
    if (!doc) {
      const errorMessage =
        documentType === 'DRIVER_LICENSE'
          ? "Veuillez vérifier l'image fournie. Elle pourrait être floue ou ne pas correspondre à un permis de conduire.\nMerci de bien vouloir la corriger ou en envoyer une nouvelle."
          : "Veuillez vérifier l'image fournie. Elle pourrait être floue ou ne pas correspondre à une carte grise.\nMerci de bien vouloir la corriger ou en envoyer une nouvelle."
      await this.updateMessage(lastConversation, errorMessage)
      throw Error("Veuillez vérifier l'image fournie.")
    }

    const ocrResponse = await this.ocrSpaceService.sendFile(doc, flowId)
    this.logger.error(`ocrResponse ${ocrResponse}`)
    if (ocrResponse === 0) {
      await this.documentFileService.remove(doc.id)
      const errorMessage =
        documentType === 'DRIVER_LICENSE'
          ? "Veuillez vérifier l'image fournie. Elle pourrait être floue ou ne pas correspondre à un permis de conduire.\nMerci de bien vouloir la corriger ou en envoyer une nouvelle."
          : "Veuillez vérifier l'image fournie. Elle pourrait être floue ou ne pas correspondre à une carte grise.\nMerci de bien vouloir la corriger ou en envoyer une nouvelle."
      await this.updateMessage(lastConversation, errorMessage)
      throw Error("Veuillez vérifier l'image fournie.")
    }

    if (ocrResponse === -1) {
      const errorMessage =
        "Vous êtes déjà associé à ce véhicule.\nMerci d'envoyer la photo de la carte grise du nouveau véhicule."
      await this.updateMessage(lastConversation, errorMessage)
      throw Error('Vous êtes déjà associé à ce véhicule')
    }

    const nextStep = await this.stepService.findOneBylevelAndFlowId(
      nextStepLevel,
      flowId,
    )

    await this.saveMessage({
      whaPhoneNumber,
      convMessage: newMessage.messages[0].image.link,
      nextMessage: nextStep.message,
      stepId: nextStep.id,
    })
  }

  private async handleDriverLicenseFrontUpload(
    lastConversation: ConversationType,
    newMessage: NewMessageWebhookDto,
  ) {
    await this.handleDocumentUpload(
      lastConversation,
      newMessage,
      'FRONT',
      'DRIVER_LICENSE',
      lastConversation.step.level + 1,
    )
  }

  private async handleCarRegistrationUpload(
    lastConversation: ConversationType,
    newMessage: NewMessageWebhookDto,
    flowId: number = 1,
  ) {
    try {
      const stepId = flowId === 1 ? 19 : 6
      await this.handleDocumentUpload(
        lastConversation,
        newMessage,
        'FRONT',
        'CAR_REGISTRATION',
        stepId,
        flowId,
      )
      console.log('flowId', flowId)

      await this.delay(30000)
      if (flowId === 1) {
        await this.sendDataToYango(lastConversation, newMessage)
      } else {
        await this.sendSecondFlowDataToYango(lastConversation, newMessage)
      }
    } catch (error) {
      this.logger.error(error.message)
    }
  }

  private async checkImageValidity(
    lastConversation: ConversationType,
    newMessage: NewMessageWebhookDto,
  ) {
    const regex = /^(http|https):\/\/[^ "]+$/
    if (
      newMessage.messages[0].type !== StepExpectedResponseType.image ||
      !newMessage.messages[0].image.link ||
      !regex.test(newMessage.messages[0].image.link) ||
      !newMessage.messages[0].image.preview.includes('data:image')
    ) {
      const errorMessage = this.getErrorMessage(
        lastConversation,
        'incorrectChoice',
      )
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
    lastConversation: ConversationType,
    newMessage: NewMessageWebhookDto,
  ) {
    this.pushCreateYangoProfileToQueue({ lastConversation, newMessage })
  }

  private async getSecondFlowSteps(
    lastConversation: ConversationType,
    newMessage: NewMessageWebhookDto,
  ) {
    switch (lastConversation.step.level) {
      case 1:
        await this.handleSecondFlowPhoneNumber(lastConversation, newMessage)
        break
      case 2:
        await this.handleOtpVerification(lastConversation, newMessage, 2)
        break
      case 3:
        await this.handleCarRegistrationUpload(lastConversation, newMessage, 2)
        break
      case 7:
        await this.handleSecondFlowFinalStep(newMessage, 2)
        break
      default:
        this.updateMessage(lastConversation, newMessage.messages[0].text.body)
    }
  }

  private async handleSecondFlowPhoneNumber(
    lastConversation: ConversationType,
    newMessage: NewMessageWebhookDto,
  ) {
    try {
      const flowId = 2
      const phoneNumber = `225${this.removeAllSpaces(newMessage.messages[0].text.body)}`

      if (!isValidPhoneNumber(`+${phoneNumber}`)) {
        const errorMessage = this.getErrorMessage(
          lastConversation,
          'equalLength',
        )
        await this.updateMessage(lastConversation, errorMessage)
        return
      }
      const driver =
        await this.driverPersonalInfoService.findDriverPersonalInfoByPhoneNumber(
          phoneNumber,
        )
      if (!driver) {
        const errorMessage = this.getErrorMessage(
          lastConversation,
          'isNotExist',
        )
        await this.updateMessage(lastConversation, errorMessage)
        return
      }

      const nextStep = await this.stepService.findOneBylevelAndFlowId(
        lastConversation.step.level + 1,
        flowId,
      )
      await this.saveMessage({
        whaPhoneNumber: newMessage.messages[0].from,
        convMessage: phoneNumber, //newMessage.messages[0].text.body,
        nextMessage: nextStep.message,
        stepId: nextStep.id,
      })
      await this.delay(10000)
      await this.otpService.generateAndSendOtp(phoneNumber)
    } catch (error) {
      let errorMessage = error.message
      if (errorMessage !== 'OTP envoyé avec succès')
        errorMessage = "Erreur lors de l'envoie du OTP.\nVeuillez reéssayer."
      await this.updateMessage(lastConversation, errorMessage)
      return
    }
  }

  private async getThirdFlowSteps(
    lastConversation: ConversationType,
    newMessage: NewMessageWebhookDto,
  ) {
    switch (lastConversation.step.level) {
      case 1:
        await this.handleThirdFlowStepOnePhoneNumber(
          lastConversation,
          newMessage,
        )
        break
      case 2:
        await this.handleThirdFlowOtpVerification(lastConversation, newMessage)
        break
      case 3:
        await this.handleThirdFlowStepThreePhoneNumber(
          lastConversation,
          newMessage,
        )
        break
      case 4:
        await this.handleThirdFlowOtpVerification(lastConversation, newMessage)
        break
      case 5:
        await this.handleThirdFlowFinalStep(newMessage, 3)
        break
      default:
        this.updateMessage(lastConversation, newMessage.messages[0].text.body)
    }
  }

  private async handleThirdFlowStepOnePhoneNumber(
    lastConversation: ConversationType,
    newMessage: NewMessageWebhookDto,
  ) {
    try {
      const flowId = 3
      const phoneNumber = `225${this.removeAllSpaces(newMessage.messages[0].text.body)}`

      if (!isValidPhoneNumber(`+${phoneNumber}`)) {
        const errorMessage = this.getErrorMessage(
          lastConversation,
          'equalLength',
        )
        await this.updateMessage(lastConversation, errorMessage)
        return
      }
      const driver =
        await this.driverPersonalInfoService.findDriverPersonalInfoByPhoneNumber(
          phoneNumber,
        )
      if (!driver) {
        const errorMessage = this.getErrorMessage(
          lastConversation,
          'isNotExist',
        )
        await this.updateMessage(lastConversation, errorMessage)
        return
      }

      const nextStep = await this.stepService.findOneBylevelAndFlowId(
        lastConversation.step.level + 1,
        flowId,
      )
      await this.saveMessage({
        whaPhoneNumber: newMessage.messages[0].from,
        convMessage: phoneNumber, //newMessage.messages[0].text.body,
        nextMessage: nextStep.message,
        stepId: nextStep.id,
      })
      await this.delay(10000)
      await this.otpService.generateAndSendOtp(phoneNumber)
    } catch (error) {
      let errorMessage = error.message
      if (errorMessage != 'OTP envoyé avec succès')
        errorMessage = "Erreur lors de l'envoie du OTP.\nVeuillez reéssayer."

      await this.updateMessage(lastConversation, errorMessage)
      return
    }
  }

  private async handleThirdFlowOtpVerification(
    lastConversation: ConversationType,
    newMessage: NewMessageWebhookDto,
  ) {
    const flowId = 3
    const whaPhoneNumber = newMessage.messages[0].from
    const otpEnter = newMessage.messages[0].text.body.trim()

    const step = await this.stepService.findOneBylevelAndFlowId(
      lastConversation.step.level,
      flowId,
    )

    const phoneNumber = (
      await this.conversationService.findOneByStepIdAndWhaPhoneNumber(
        step.id,
        whaPhoneNumber,
      )
    ).message

    const response = await this.otpService.verifyOtp(phoneNumber, otpEnter)
    if (['OTP_NOT_FOUND', 'OTP_EXPIRED', 'OTP_INVALID'].includes(response)) {
      const errorMessage = this.getErrorMessage(
        lastConversation,
        response === 'OTP_NOT_FOUND' || 'OTP_INVALID'
          ? 'incorrectCode'
          : 'isExpired',
      )
      if (response === 'OTP_EXPIRED')
        await this.otpService.generateAndSendOtp(phoneNumber)
      await this.updateMessage(lastConversation, errorMessage)
      return
    }

    const nextStep = await this.stepService.findOneBylevelAndFlowId(
      lastConversation.step.level + 1,
      flowId,
    )
    await this.saveMessage({
      whaPhoneNumber: newMessage.messages[0].from,
      convMessage: otpEnter, //newMessage.messages[0].text.body,
      nextMessage: nextStep.message,
      stepId: nextStep.id,
    })

    if (step.level === 4) {
      await this.delay(10000)
      await this.sendThirdFlowDataToYango(lastConversation, newMessage)
    }
  }

  private async handleThirdFlowStepThreePhoneNumber(
    lastConversation: ConversationType,
    newMessage: NewMessageWebhookDto,
  ) {
    try {
      const flowId = 3
      const phoneNumber = `225${this.removeAllSpaces(newMessage.messages[0].text.body)}`

      if (!isValidPhoneNumber(`+${phoneNumber}`)) {
        const errorMessage = this.getErrorMessage(
          lastConversation,
          'equalLength',
        )
        await this.updateMessage(lastConversation, errorMessage)
        return
      }
      const driver =
        await this.driverPersonalInfoService.findDriverPersonalInfoByPhoneNumber(
          phoneNumber,
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
        convMessage: phoneNumber, //newMessage.messages[0].text.body,
        nextMessage: nextStep.message,
        stepId: nextStep.id,
      })

      await this.delay(10000)
      await this.otpService.generateAndSendOtp(phoneNumber)
    } catch (error) {
      let errorMessage = error.message
      if (errorMessage != 'OTP envoyé avec succès')
        errorMessage = "Erreur lors de l'envoie du OTP.\nVeuillez reéssayer."

      await this.updateMessage(lastConversation, errorMessage)
      return
    }
  }

  private async sendSecondFlowDataToYango(
    lastConversation: ConversationType,
    newMessage: NewMessageWebhookDto,
  ) {
    console.log('pushCreateYangoCarToQueue')
    this.pushCreateYangoCarToQueue({ lastConversation, newMessage })
  }

  private async sendThirdFlowDataToYango(
    lastConversation: ConversationType,
    newMessage: NewMessageWebhookDto,
  ) {
    console.log('pushUpdateYangoDriverInfoToQueue')
    this.pushUpdateYangoDriverInfoToQueue({ lastConversation, newMessage })
  }

  private async handleSecondFlowFinalStep(
    newMessage: NewMessageWebhookDto,
    flowId: number,
  ) {
    const nextStep = await this.stepService.findOneBylevelAndFlowId(6, flowId)
    await this.saveMessage({
      whaPhoneNumber: newMessage.messages[0].from,
      convMessage: newMessage.messages[0].text.body,
      nextMessage: nextStep.message,
      stepId: nextStep.id,
    })
  }

  private async handleThirdFlowFinalStep(
    newMessage: NewMessageWebhookDto,
    flowId: number,
  ) {
    const nextStep = await this.stepService.findOneBylevelAndFlowId(5, flowId)
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
    this.logger.log('conv', JSON.stringify(conv))
    if (conv) {
      await this.editHistoryConversation({
        whaPhoneNumber: conv.whaPhoneNumber,
        status: HistoryConversationStatus.IN_PROGRESS,
        stepId: conv.stepId,
      })
      await this.delay(5000)
      await this.pushMessageToSent({
        to: whaPhoneNumber,
        body: nextMessage,
        typing_time: 5,
      })
    }
  }

  private async updateMessage(conversation: Conversation, message: string) {
    try {
      const updatedConversation = await this.conversationService.update(
        conversation.id,
        {
          badResponseCount: conversation.badResponseCount + 1,
        },
      )
      if (updatedConversation.badResponseCount >= 2) {
        return await this.abortConversation(conversation)
      }
      await this.editHistoryConversation({
        whaPhoneNumber: conversation.whaPhoneNumber,
        status: HistoryConversationStatus.IN_PROGRESS,
        reason: HistoryConversationReasonForEnding.ERROR,
        stepId: conversation.stepId,
      })
      await this.handleMessageToSent({
        to: conversation.whaPhoneNumber,
        body: message,
        typing_time: 5,
      })
    } catch (error) {
      console.log(error.message)
    }
  }

  private async abortConversation(conversation: Conversation) {
    await this.editHistoryConversation({
      whaPhoneNumber: conversation.whaPhoneNumber,
      status: HistoryConversationStatus.FAIL,
      reason: HistoryConversationReasonForEnding.ERROR,
      stepId: conversation.stepId,
    })

    const errorStep = await this.stepService.findOneByLevel(15)
    // Push message to whapi queue to demand to driver to go on MBP local
    await this.handleMessageToSent({
      to: conversation.whaPhoneNumber,
      body: errorStep.message,
      typing_time: 5,
    })

    await this.deleteAllConversations(conversation)
    await this.deleteInfoCollected(conversation)
  }

  private async editHistoryConversation(payload: CreateHistoryConversationDto) {
    if (payload.stepId === 1) {
      await this.historyConversationService.create(payload)
    } else {
      const stepId =
        payload.reason === HistoryConversationReasonForEnding.ERROR ||
        payload.reason === HistoryConversationReasonForEnding.TIME_LIMIT_REACHED
          ? payload.stepId
          : payload.stepId - 1
      const history =
        await this.historyConversationService.findOneByWhaPhoneNumberAndStepId(
          payload.whaPhoneNumber,
          stepId,
        )
      console.log('history', history)
      if (history)
        await this.historyConversationService.update(history?.id, payload)
    }
  }

  private async deleteAllConversations(conversation: Conversation) {
    await this.conversationService.removeAllByPhoneNumber(
      conversation.whaPhoneNumber,
    )
  }

  private async deleteInfoCollected(conversation: Conversation) {
    console.log('deleteInfoCollected', conversation.whaPhoneNumber)
    const phoneNumber = (
      await this.driverPersonalInfoService.findDriverPersonalInfoByWhaPhoneNumber(
        conversation.whaPhoneNumber,
      )
    ).phoneNumber
    console.log('deleteInfoCollected.phoneNumber', phoneNumber)
    const carId = (
      await this.carInfoService.findRecentByPhoneNumver(phoneNumber)
    ).id
    console.log('deleteInfoCollected.carId', carId)
    await this.carInfoService.remove(carId)
    await this.driverLicenseInfoService.deleteByPhoneNumber(phoneNumber)
    await this.driverPersonalInfoService.deleteByWhaPhoneNumber(
      conversation.whaPhoneNumber,
    )
    //await this.driverCarService.deleteByDriverId(personalInfo.id)
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

  async handleDocumentPushed(data: DocumentFile, flowId: number) {
    await this.ocrSpaceService.sendFile(data, flowId)
  }

  async pushOcrResponseToQueue(ocrResponse: GetOcrResponseDto) {
    try {
      await firstValueFrom(
        this.whapiSentQueueClient.emit(OCR_SENT_QUEUE_NAME, ocrResponse),
      )
      //this.logger.log(`Emitting doc to queue: ${JSON.stringify(ocrResponse)}`)
    } catch (error) {
      this.logger.error(`Error on emitting doc: ${error}`)
    }
  }

  async handleOcrResponsePushedQueue() {}

  async pushCreateYangoProfileToQueue(payload: {
    lastConversation: ConversationType
    newMessage: NewMessageWebhookDto
  }) {
    try {
      await firstValueFrom(
        this.whapiSentQueueClient.emit(
          CREATE_YANGO_PROFILE_SENT_QUEUE_NAME,
          payload,
        ),
      )
      this.logger.log(`Emitting doc to queue: ${JSON.stringify(payload)}`)
    } catch (error) {
      this.logger.error(`Error on emitting doc: ${error}`)
    }
  }

  async handleCreateYangoProfile({
    lastConversation,
    newMessage,
  }: {
    lastConversation: ConversationType
    newMessage: NewMessageWebhookDto
  }) {
    const abortData = this.buildAbortionPayload(lastConversation)
    try {
      const whaPhoneNumber = newMessage.messages[0].from
      this.logger.log(`Create Yango profile for ${whaPhoneNumber}`)
      const step = await this.stepService.findOneBylevelAndFlowId(1, 1)
      this.logger.log(`Create Yango profile step id ${step.id}`)
      const phoneNumber = (
        await this.conversationService.findOneByStepIdAndWhaPhoneNumber(
          step.id + 1,
          whaPhoneNumber,
        )
      ).message
      this.logger.log(`Create Yango profile for ${phoneNumber}`)

      const createYangoCar: CreateYangoCarDto =
        await this.buildCreateCarPayload(phoneNumber)

      const carId = (await this.yangoService.createCar(createYangoCar))
        .vehicle_id
      this.logger.log('Create Yango profile carId', carId)
      if (!carId) return await this.abortConversation(abortData)

      const createYangoDto: CreateYangoProfileDto =
        await this.buildCreateProfilePayload(phoneNumber, carId)
      const profileId = (await this.yangoService.createProfile(createYangoDto))
        .contractor_profile_id
      this.logger.log('Create Yango profile profileId', profileId)
      if (!profileId) return await this.abortConversation(abortData)

      const carInfo =
        await this.carInfoService.findCarInfoByDriverPhoneNumber(phoneNumber)
      await this.carInfoService.update(carInfo.id, { yangoCarId: carId })

      const driverInfo =
        await this.driverPersonalInfoService.findDriverPersonalInfoByPhoneNumber(
          phoneNumber,
        )
      await this.driverPersonalInfoService.update(driverInfo.id, {
        yangoProfileId: profileId,
      })

      await this.makeAssociationBetweenDriverAndCar(driverInfo.id, carInfo.id)

      const successStep = await this.stepService.findOneByLevel(20)
      this.logger.log('Create Yango profile successStep', successStep.message)

      await this.handleMessageToSent({
        to: whaPhoneNumber,
        body: successStep.message,
        typing_time: 5,
      })

      this.deleteAllConversations(lastConversation)
    } catch (error) {
      await this.abortConversation(abortData)
      this.logger.error(
        `Error processing during yango profile creation: ${error}`,
      )
    }
  }

  private async buildCreateCarPayload(
    phoneNumber: string,
  ): Promise<CreateYangoCarDto> {
    const carInfo =
      await this.carInfoService.findCarInfoByDriverPhoneNumber(phoneNumber)
    return {
      park_profile: {
        callsign: carInfo.code,
        fuel_type: 'petrol',
        status: 'unknown',
        categories: ['econom', 'comfort'],
      },
      vehicule_licenses: {
        licence_plate_number: carInfo.plateNumber,
      },
      vehicule_specifications: {
        brand: carInfo.brand,
        color: carInfo.color,
        model: carInfo.model,
        transmission: 'mechanical',
        year: 0,
      },
    }
  }

  private async buildCreateProfilePayload(
    phoneNumber: string,
    carId: string,
  ): Promise<CreateYangoProfileDto> {
    const driverPersonalInfo =
      await this.driverPersonalInfoService.findDriverPersonalInfoByPhoneNumber(
        phoneNumber,
      )
    const driverLicenseInfo =
      await this.driverLicenseInfoService.findLicenseInfoByPhoneNumber(
        phoneNumber,
      )
    return {
      order_provider: {
        partner: true,
        platform: true,
      },
      person: {
        contact_info: {
          phone: phoneNumber,
        },
      },
      driver_license: {
        country: 'civ',
        expiry_date: driverLicenseInfo.expiryDate.toISOString(),
        issue_date: driverLicenseInfo.deliveryDate.toISOString(),
        number: driverPersonalInfo.licenseNumber,
      },
      full_name: {
        first_name: driverPersonalInfo.firstName,
        last_name: driverPersonalInfo.lastName,
      },
      profile: {
        hire_date: new Date().toISOString(),
      },
      carId,
    }
  }

  private async makeAssociationBetweenDriverAndCar(
    idDriver: number,
    idCar: number,
  ) {
    const association = await this.driverCarService.findOneByDriverId(idDriver)
    if (association) {
      await this.driverCarService.update(association.id, { idDriver, idCar })
    } else {
      await this.driverCarService.create({ idDriver, idCar })
    }
  }

  private buildAbortionPayload(lastConversation: ConversationType) {
    return {
      id: lastConversation.id,
      createdAt: lastConversation.createdAt,
      updatedAt: lastConversation.updatedAt,
      whaPhoneNumber: lastConversation.whaPhoneNumber,
      message: lastConversation.message,
      badResponseCount: lastConversation.badResponseCount,
      stepId: lastConversation.stepId,
    }
  }

  async pushCreateYangoCarToQueue(payload: {
    lastConversation: ConversationType
    newMessage: NewMessageWebhookDto
  }) {
    try {
      await firstValueFrom(
        this.whapiSentQueueClient.emit(
          CREATE_YANGO_CAR_SENT_QUEUE_NAME,
          payload,
        ),
      )
      this.logger.log(`Emitting doc to queue: ${JSON.stringify(payload)}`)
    } catch (error) {
      this.logger.error(`Error on emitting doc: ${error}`)
    }
  }

  async handleCreateYangoCar({
    lastConversation,
    newMessage,
  }: {
    lastConversation: ConversationType
    newMessage: NewMessageWebhookDto
  }) {
    const abortData = this.buildAbortionPayload(lastConversation)
    try {
      const whaPhoneNumber = newMessage.messages[0].from
      console.log(`Create Yango car for ${whaPhoneNumber}`)
      const step = await this.stepService.findOneBylevelAndFlowId(2, 2)
      console.log('step', step)
      const phoneNumber = (
        await this.conversationService.findOneByStepIdAndWhaPhoneNumber(
          step.id,
          whaPhoneNumber,
        )
      ).message
      console.log('phoneNumber', phoneNumber)
      const driverInfo =
        await this.driverPersonalInfoService.findDriverPersonalInfoByPhoneNumber(
          phoneNumber,
        )
      console.log('driverInfo', driverInfo)
      const driverAssociatedCarId = (
        await this.driverCarService.findOneByDriverId(driverInfo.id)
      )?.idCar
      console.log('driverAssociatedCarId', driverAssociatedCarId)
      const createYangoCar: CreateYangoCarDto =
        await this.buildCreateCarPayload(phoneNumber)

      const carId =
        (await this.carInfoService.findOne(driverAssociatedCarId)).yangoCarId ??
        (await this.yangoService.createCar(createYangoCar)).vehicle_id
      if (!carId) {
        const lastCarInfo =
          await this.carInfoService.findCarInfoByDriverPhoneNumberAndStatus(
            phoneNumber,
            'not_working',
          )
        await this.makeAssociationBetweenDriverAndCar(
          driverInfo.id,
          lastCarInfo.id,
        )

        const carInfo =
          await this.carInfoService.findCarInfoByDriverPhoneNumberAndStatus(
            phoneNumber,
            'working',
          )
        await this.carInfoService.update(carInfo.id, { status: 'not_working' })

        await this.carInfoService.update(lastCarInfo.id, { status: 'working' })
        return await this.abortConversation(abortData)
      }

      await this.carInfoService.update(driverAssociatedCarId, {
        yangoCarId: carId,
      })

      await this.makeAssociationBetweenDriverAndCar(
        driverInfo.id,
        driverAssociatedCarId,
      )

      const successStep = await this.stepService.findOneByLevel(7)

      await this.handleMessageToSent({
        to: whaPhoneNumber,
        body: successStep.message,
        typing_time: 5,
      })

      this.deleteAllConversations(lastConversation)
    } catch (error) {
      await this.abortConversation(abortData)
      this.logger.error(
        `Error processing during yango profile creation: ${error}`,
      )
    }
  }

  async pushUpdateYangoDriverInfoToQueue(payload: {
    lastConversation: ConversationType
    newMessage: NewMessageWebhookDto
  }) {
    try {
      await firstValueFrom(
        this.whapiSentQueueClient.emit(
          UPDATE_YANGO_DRIVER_INFO_SENT_QUEUE_NAME,
          payload,
        ),
      )
      this.logger.log(`Emitting doc to queue: ${JSON.stringify(payload)}`)
    } catch (error) {
      this.logger.error(`Error on emitting doc: ${error}`)
    }
  }

  async handleUpdateYangoDriverInfo({
    lastConversation,
  }: {
    lastConversation: ConversationType
    newMessage: NewMessageWebhookDto
  }) {
    try {
      const previousPhoneNumberStep =
        await this.stepService.findOneBylevelAndFlowId(2, 3)
      const currentPhoneNumberStep =
        await this.stepService.findOneBylevelAndFlowId(4, 3)
      const previousPhoneNumber = (
        await this.conversationService.findOneByStepIdAndWhaPhoneNumber(
          previousPhoneNumberStep.id,
          lastConversation.whaPhoneNumber,
        )
      ).message
      const currentPhoneNumber = (
        await this.conversationService.findOneByStepIdAndWhaPhoneNumber(
          currentPhoneNumberStep.id,
          lastConversation.whaPhoneNumber,
        )
      ).message
      const response = await this.yangoService.updateDriverPhone()
      if (response !== 200) {
        const abortPayload = this.buildAbortionPayload(lastConversation)
        return await this.abortConversation(abortPayload)
      }

      await this.driverPersonalInfoService.updateByPhoneNumber(
        previousPhoneNumber,
        currentPhoneNumber,
      )
      const successStep = await this.stepService.findOneByLevel(6)

      await this.handleMessageToSent({
        to: lastConversation.whaPhoneNumber,
        body: successStep.message,
        typing_time: 5,
      })

      this.deleteAllConversations(lastConversation)
    } catch (error) {
      this.deleteAllConversations(lastConversation)
      console.error(error)
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async deleteOldConversations() {
    this.logger.log("I'am the old conversations undertaker")
    const fiveMinutesAgo = subMinutes(new Date(), 5)

    const phoneNumbers = await this.conversationService.getPhoneNumbers()
    console.log('phoneNumbers', phoneNumbers)
    for (const { whaPhoneNumber } of phoneNumbers) {
      const lastConversation =
        await this.conversationService.findPhoneNumberLastConversation(
          whaPhoneNumber,
        )
      console.log('lastConversation', lastConversation)
      if (lastConversation && lastConversation.updatedAt < fiveMinutesAgo) {
        await this.conversationService.removeAllByPhoneNumber(whaPhoneNumber)
        this.logger.log(
          `Conversations deleted for phone number: ${whaPhoneNumber}`,
        )
        await this.editHistoryConversation({
          whaPhoneNumber,
          status: HistoryConversationStatus.FAIL,
          reason: HistoryConversationReasonForEnding.TIME_LIMIT_REACHED,
          stepId: lastConversation.stepId,
        })
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  private removeAllSpaces(str: string): string {
    return str.replace(/\s+/g, '')
  }
}
