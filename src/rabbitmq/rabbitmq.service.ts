import { Inject, Logger } from '@nestjs/common'
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
import {
  SendImageMessageDto,
  SendMessageDto,
} from '../external-api/dto/send-message.dto'
import { OcrSpaceService } from '../external-api/ocr-space.service'
import { OtpService } from '../external-api/otp.service'
import { WhapiService } from '../external-api/whapi.service'
import { YangoService } from '../external-api/yango.service'
import { CreateHistoryConversationDto } from '../history-conversation/dto/create-history-conversation.dto'
import { HistoryConversationService } from '../history-conversation/history-conversation.service'
import { getOcrErrorMessage, OcrErrorCode } from '../shared/constants'
import { ConversationType } from '../shared/types'
import { StepService } from '../step/step.service'
import { UserService } from '../user/user.service'
import { NewMessageWebhookDto } from '../webhook/dto/new-message-webhook.dto'
import {
  CREATE_YANGO_CAR_SENT_QUEUE_NAME,
  CREATE_YANGO_PROFILE_SENT_QUEUE_NAME,
  OCR_SENT_QUEUE_NAME,
  UPDATE_YANGO_DRIVER_INFO_SENT_QUEUE_NAME,
  WHAPI_RECEIVED_QUEUE_NAME,
  WHAPI_SENT_IMAGE_QUEUE_NAME,
  WHAPI_SENT_QUEUE_NAME,
} from './constants'

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
    private readonly userService: UserService,
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
      await this.handleExistingConversation(lastConversation, newMessage)
    } else {
      await this.handleNewConversation(newMessage)
    }
  }

  private async handleNewConversation(newMessage: NewMessageWebhookDto) {
    const initialStep = await this.stepService.findOneByLevel(0)
    const message = newMessage.messages[0].text.body
    if (message.toLowerCase() === 'start') {
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
  ) {
    if (lastConversation.step.level === 0) {
      if (newMessage.messages[0].text.body.includes('0')) {
        // We begin the "Offres" flow
        await this.startFlow(newMessage, 'Offres')
      } else if (newMessage.messages[0].text.body.includes('1')) {
        await this.startFlow(newMessage, 'Inscription')
      } else if (newMessage.messages[0].text.body.includes('2')) {
        await this.startFlow(newMessage, 'Changement de véhicule')
      } else if (newMessage.messages[0].text.body.includes('3')) {
        await this.startFlow(newMessage, 'Modification de numéro de téléphone')
      } else {
        const errorMessage = this.getErrorMessage(
          lastConversation,
          'incorrectChoice',
        )
        await this.updateMessage(lastConversation, errorMessage)
      }
    } else if (lastConversation.step.idFlow === 'Offres') {
      const message = newMessage.messages[0].text.body.toLowerCase()
      if (message === 'back' || message === 'stop')
        return await this.handleBackOrStop(lastConversation, message)
      await this.getOfferFlowSteps(lastConversation, newMessage)
    } else if (lastConversation.step.idFlow === 'Inscription') {
      await this.getFirstFlowSteps(lastConversation, newMessage)
    } else if (lastConversation.step.idFlow === 'Changement de véhicule') {
      await this.getSecondFlowSteps(lastConversation, newMessage)
    } else if (
      lastConversation.step.idFlow === 'Modification de numéro de téléphone'
    ) {
      await this.getThirdFlowSteps(lastConversation, newMessage)
    }

    const user = await this.userService.find(newMessage.messages[0].from)
    if (!user) {
      await this.userService.create({
        whaPhoneNumber: newMessage.messages[0].from,
        role: 'USER',
      })
    }
  }

  private async handleBackOrStop(
    lastConversation: ConversationType,
    message: string,
  ) {
    if (message === 'back') {
      const lastConv = await this.deleteLastConversation(lastConversation)
      const step = await this.stepService.findOne(lastConv.stepId)
      const previousStep =
        step.level - 1 === 0
          ? await this.stepService.findOneByLevel(0)
          : await this.stepService.findOneBylevelAndidFlow(
              step.level - 1,
              step.idFlow,
            )
      console.log('previousStep', previousStep)
      return await this.saveMessage({
        whaPhoneNumber: lastConversation.whaPhoneNumber,
        convMessage: message,
        nextMessage: previousStep.message,
        stepId: previousStep.id,
      })
    } else {
      await this.conversationService.removeAllByPhoneNumber(
        lastConversation.whaPhoneNumber,
      )
      const step = await this.stepService.findOneBylevelAndidFlow(4, 'Offres')
      return await this.pushMessageToSent({
        to: lastConversation.whaPhoneNumber,
        body: step.message,
        typing_time: 5,
      })
    }
  }

  private async deleteLastConversation(lastConversation: ConversationType) {
    const { id: lastConversationId } =
      await this.conversationService.findLastOneByWhaPhoneNumber(
        lastConversation.whaPhoneNumber,
      )
    return await this.conversationService.remove(lastConversationId)
  }

  private async startFlow(newMessage: NewMessageWebhookDto, idFlow: string) {
    const nextStep = await this.stepService.findOneBylevelAndidFlow(1, idFlow)
    await this.saveMessage({
      whaPhoneNumber: newMessage.messages[0].from,
      convMessage: newMessage.messages[0].text.body,
      nextMessage: nextStep.message,
      stepId: nextStep.id,
    })
  }

  private async getOfferFlowSteps(
    lastConversation: ConversationType,
    newMessage: NewMessageWebhookDto,
  ) {
    switch (lastConversation.step.level) {
      case 1:
        await this.handleOfferChoice(lastConversation, newMessage)
        break
      default:
        this.updateMessage(lastConversation, newMessage.messages[0].text.body)
    }
  }

  private async handleOfferChoice(
    lastConversation: ConversationType,
    newMessage: NewMessageWebhookDto,
  ) {
    try {
      const whaPhoneNumber = newMessage.messages[0].from
      const idFlow = 'Offres'
      const choice = this.removeAllSpaces(newMessage.messages[0].text.body)

      if (
        newMessage.messages[0].type !== StepExpectedResponseType.text ||
        !['1', '2'].includes(choice)
      ) {
        const errorMessage = this.getErrorMessage(
          lastConversation,
          'incorrectChoice',
        )
        await this.updateMessage(lastConversation, errorMessage)
        return
      }

      const nextStep = await this.stepService.findOneBylevelAndidFlow(
        choice === '1' ? 2 : 3,
        idFlow,
      )
      await this.saveMessage({
        whaPhoneNumber: newMessage.messages[0].from,
        convMessage: whaPhoneNumber,
        nextMessage: nextStep.message,
        stepId: nextStep.id,
      })
      await this.editHistoryConversation({
        whaPhoneNumber: whaPhoneNumber,
        status: HistoryConversationStatus.SUCCEEDED,
        reason: HistoryConversationReasonForEnding.NORMAL_FINISH,
        stepId: lastConversation.stepId,
      })
      await this.deleteAllConversations(lastConversation)
    } catch (error) {
      this.logger.error(error.message)
    }
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
        await this.handleOtpVerification(
          lastConversation,
          newMessage,
          'Inscription',
          1,
        )
        break
      case 3:
        await this.handleDriverLicenseFrontUpload(lastConversation, newMessage)
        break
      case 4:
        await this.handleDriverLicenseBackUpload(lastConversation, newMessage)
        break
      case 5:
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
      const idFlow = 'Inscription'

      if (newMessage.messages[0].type !== StepExpectedResponseType.text) {
        const errorMessage = this.getErrorMessage(
          lastConversation,
          'equalLength',
        )
        await this.updateMessage(lastConversation, errorMessage)
        return
      }

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

      const nextStep = await this.stepService.findOneBylevelAndidFlow(
        lastConversation.step.level + 1,
        idFlow,
      )
      await this.saveMessage({
        whaPhoneNumber: newMessage.messages[0].from,
        convMessage: phoneNumber, //newMessage.messages[0].text.body,
        nextMessage: nextStep.message,
        stepId: nextStep.id,
      })
      await this.delay()
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
    idFlow: string = 'Inscription',
    level: number = 1,
  ) {
    const whaPhoneNumber = newMessage.messages[0].from
    const otpEnter = newMessage.messages[0].text.body.trim()

    const step = await this.stepService.findOneBylevelAndidFlow(level, idFlow)

    const phoneNumber =
      idFlow === 'Inscription'
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

    const nextStep = await this.stepService.findOneBylevelAndidFlow(
      lastConversation.step.level + 1,
      idFlow,
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
    idFlow: string = 'Inscription',
  ) {
    try {
      const whaPhoneNumber = newMessage.messages[0].from

      if ((await this.checkImageValidity(lastConversation, newMessage)) === 0)
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
        const errorMessage = getOcrErrorMessage(
          documentType,
          OcrErrorCode.LOW_CONFIDENCE,
        )

        await this.updateMessage(lastConversation, errorMessage)
        throw Error("Veuillez vérifier l'image fournie.")
      }

      const ocrResponse = await this.ocrSpaceService.sendFile(doc, idFlow)
      this.logger.error(`ocrResponse ${ocrResponse}`)
      if (ocrResponse !== OcrErrorCode.SUCCESS) {
        await this.documentFileService.remove(doc.id)

        const errorMessage = getOcrErrorMessage(documentType, ocrResponse)
        await this.updateMessage(lastConversation, errorMessage)

        throw Error("Veuillez vérifier l'image fournie.")
      }

      const nextStep = await this.stepService.findOneBylevelAndidFlow(
        nextStepLevel,
        idFlow,
      )

      await this.saveMessage({
        whaPhoneNumber,
        convMessage: newMessage.messages[0].image.link,
        nextMessage: nextStep.message,
        stepId: nextStep.id,
      })
    } catch (error) {
      this.logger.error(error.message)
    }
  }

  // private async getDriverPhoneNumber(
  //   whaPhoneNumber: string,
  //   flowId: number,
  // ): Promise<string> {
  //   return (
  //     await this.conversationService.findManyByWhaPhoneNumber(whaPhoneNumber)
  //   ).find((conv) => conv.step.level === 2 && conv.step.flowId === flowId)
  //     .message
  // }

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

  private async handleDriverLicenseBackUpload(
    lastConversation: ConversationType,
    newMessage: NewMessageWebhookDto,
  ) {
    await this.handleDocumentUpload(
      lastConversation,
      newMessage,
      'BACK',
      'DRIVER_LICENSE',
      lastConversation.step.level + 1,
    )
  }

  private async handleCarRegistrationUpload(
    lastConversation: ConversationType,
    newMessage: NewMessageWebhookDto,
    idFlow: string = 'Inscription',
  ) {
    try {
      const stepId = idFlow === 'Inscription' ? 19 : 6
      await this.handleDocumentUpload(
        lastConversation,
        newMessage,
        'FRONT',
        'CAR_REGISTRATION',
        stepId,
        idFlow,
      )

      await this.delay()
      if (idFlow === 'Inscription') {
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
        await this.handleOtpVerification(
          lastConversation,
          newMessage,
          'Changement de véhicule',
          2,
        )
        break
      case 3:
        await this.handleCarRegistrationUpload(
          lastConversation,
          newMessage,
          'Changement de véhicule',
        )
        break
      case 7:
        await this.handleSecondFlowFinalStep(
          newMessage,
          'Changement de véhicule',
        )
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
      const idFlow = 'Changement de véhicule'

      if (newMessage.messages[0].type !== StepExpectedResponseType.text) {
        const errorMessage = this.getErrorMessage(
          lastConversation,
          'equalLength',
        )
        await this.updateMessage(lastConversation, errorMessage)
        return
      }

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

      const nextStep = await this.stepService.findOneBylevelAndidFlow(
        lastConversation.step.level + 1,
        idFlow,
      )
      await this.saveMessage({
        whaPhoneNumber: newMessage.messages[0].from,
        convMessage: phoneNumber, //newMessage.messages[0].text.body,
        nextMessage: nextStep.message,
        stepId: nextStep.id,
      })
      await this.delay()
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
        await this.handleThirdFlowFinalStep(
          newMessage,
          'Modification de numéro de téléphone',
        )
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
      const idFlow = 'Modification de numéro de téléphone'

      if (newMessage.messages[0].type !== StepExpectedResponseType.text) {
        const errorMessage = this.getErrorMessage(
          lastConversation,
          'equalLength',
        )
        await this.updateMessage(lastConversation, errorMessage)
        return
      }

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

      const nextStep = await this.stepService.findOneBylevelAndidFlow(
        lastConversation.step.level + 1,
        idFlow,
      )
      await this.saveMessage({
        whaPhoneNumber: newMessage.messages[0].from,
        convMessage: phoneNumber, //newMessage.messages[0].text.body,
        nextMessage: nextStep.message,
        stepId: nextStep.id,
      })
      await this.delay()
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
    const idFlow = 'Modification de numéro de téléphone'
    const whaPhoneNumber = newMessage.messages[0].from
    const otpEnter = newMessage.messages[0].text.body.trim()

    const step = await this.stepService.findOneBylevelAndidFlow(
      lastConversation.step.level,
      idFlow,
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

    const nextStep = await this.stepService.findOneBylevelAndidFlow(
      lastConversation.step.level + 1,
      idFlow,
    )
    await this.saveMessage({
      whaPhoneNumber: newMessage.messages[0].from,
      convMessage: otpEnter, //newMessage.messages[0].text.body,
      nextMessage: nextStep.message,
      stepId: nextStep.id,
    })

    if (step.level === 4) {
      await this.delay()
      await this.sendThirdFlowDataToYango(lastConversation, newMessage)
    }
  }

  private async handleThirdFlowStepThreePhoneNumber(
    lastConversation: ConversationType,
    newMessage: NewMessageWebhookDto,
  ) {
    try {
      const idFlow = 'Modification de numéro de téléphone'

      if (newMessage.messages[0].type !== StepExpectedResponseType.text) {
        const errorMessage = this.getErrorMessage(
          lastConversation,
          'equalLength',
        )
        await this.updateMessage(lastConversation, errorMessage)
        return
      }

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

      const nextStep = await this.stepService.findOneBylevelAndidFlow(
        lastConversation.step.level + 1,
        idFlow,
      )
      await this.saveMessage({
        whaPhoneNumber: newMessage.messages[0].from,
        convMessage: phoneNumber, //newMessage.messages[0].text.body,
        nextMessage: nextStep.message,
        stepId: nextStep.id,
      })

      await this.delay()
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
    idFlow: string = 'Changement de véhicule',
  ) {
    const nextStep = await this.stepService.findOneBylevelAndidFlow(6, idFlow)
    await this.saveMessage({
      whaPhoneNumber: newMessage.messages[0].from,
      convMessage: newMessage.messages[0].text.body,
      nextMessage: nextStep.message,
      stepId: nextStep.id,
    })
  }

  private async handleThirdFlowFinalStep(
    newMessage: NewMessageWebhookDto,
    idFlow: string = 'Modification de numéro de téléphone',
  ) {
    const nextStep = await this.stepService.findOneBylevelAndidFlow(5, idFlow)
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
      await this.delay()
      const step = await this.stepService.findOne(stepId)
      if (step.messageType === 'IMAGE_TEXT' && step.mediaUrl) {
        await this.pushImageToSent({
          to: whaPhoneNumber,
          caption: nextMessage,
          media: step.mediaUrl,
          typing_time: 5,
        })
        await this.delay()
      } else {
        await this.pushMessageToSent({
          to: whaPhoneNumber,
          body: nextMessage,
          typing_time: 5,
        })
      }
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
        return await this.abortConversation(conversation, message)
      }
      await this.handleMessageToSent({
        to: conversation.whaPhoneNumber,
        body: message,
        typing_time: 5,
      })
    } catch (error) {
      console.log(error.message)
    }
  }

  private async abortConversation(
    conversation: Conversation,
    message?: string,
    mode: 'CREATION' | 'UPDATE' = 'UPDATE',
  ) {
    await this.editHistoryConversation({
      whaPhoneNumber: conversation.whaPhoneNumber,
      status: HistoryConversationStatus.FAIL,
      reason: HistoryConversationReasonForEnding.ERROR,
      stepId: conversation.stepId,
    })
    await this.handleMessageToSent({
      to: conversation.whaPhoneNumber,
      body: message,
      typing_time: 5,
    })
    const errorStep = await this.stepService.findOneByLevel(15)
    // Push message to whapi queue to demand to driver to go on MBP local
    await this.handleMessageToSent({
      to: conversation.whaPhoneNumber,
      body: errorStep.message,
      typing_time: 5,
    })

    await this.deleteInfoCollected(conversation, mode)
    await this.deleteAllConversations(conversation)
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

  private async deleteInfoCollected(
    conversation: Conversation,
    mode: 'CREATION' | 'UPDATE' = 'UPDATE',
  ) {
    try {
      console.log('deleteInfoCollected', conversation.whaPhoneNumber)
      const phoneNumber = (
        await this.driverPersonalInfoService.findDriverPersonalInfoByWhaPhoneNumber(
          conversation.whaPhoneNumber,
        )
      )?.phoneNumber
      console.log('deleteInfoCollected.phoneNumber', phoneNumber)
      if (!phoneNumber) return
      const idDriver = (
        await this.driverPersonalInfoService.findDriverPersonalInfoByPhoneNumber(
          phoneNumber,
        )
      )?.id
      const driverLastAssociation =
        await this.driverCarService.findDriverLastAssociation(idDriver)

      await this.carInfoService.remove(driverLastAssociation?.idCar)

      if (mode === 'CREATION') {
        await this.driverPersonalInfoService.remove(idDriver)
        await this.driverLicenseInfoService.deleteByDriverId(idDriver)
        const driverAssociations =
          await this.driverCarService.findOneByDriverId(idDriver)
        await this.driverCarService.remove(driverAssociations?.id)
      }

      if (mode === 'UPDATE') {
        await this.driverCarService.remove(driverLastAssociation?.id)

        const { id, idCar: recentIdCar } =
          await this.driverCarService.findDriverMostRecentAssociation(idDriver)

        await this.driverCarService.update(id, {
          idDriver,
          idCar: recentIdCar,
          endDate: null,
        })
      }
      //await this.driverCarService.deleteByDriverId(personalInfo.id)
    } catch (error) {
      console.log('Error on deleteInfoCollected:', error.message)
    }
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

  async pushImageToSent(message: SendImageMessageDto) {
    try {
      await firstValueFrom(
        this.whapiSentQueueClient.emit(WHAPI_SENT_IMAGE_QUEUE_NAME, message),
      )
      this.logger.log(`Emitting image to queue: ${JSON.stringify(message)}`)
    } catch (error) {
      this.logger.error(`Error emitting image: ${error}`)
    }
  }

  async handleImageToSent(message: SendImageMessageDto) {
    this.logger.log(`sent image to whapi: ${JSON.stringify(message)}`)
    await this.whapiService.sendImageMessage({
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

  async handleDocumentPushed(data: DocumentFile, idFlow: string) {
    await this.ocrSpaceService.sendFile(data, idFlow)
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
      const step = await this.stepService.findOneBylevelAndidFlow(
        1,
        'Inscription',
      )
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
      if (!carId)
        return await this.abortConversation(
          abortData,
          "Une erreur s'est produite lors de la création du véhicule sur Yango",
          'CREATION',
        )

      const createYangoDto: CreateYangoProfileDto =
        await this.buildCreateProfilePayload(phoneNumber, carId)
      const profileId = (await this.yangoService.createProfile(createYangoDto))
        .contractor_profile_id
      this.logger.log('Create Yango profile profileId', profileId)
      if (!profileId)
        return await this.abortConversation(
          abortData,
          "Une erreur s'est produite lors de la création du profil sur Yango",
          'CREATION',
        )

      const bindingResponse = await this.yangoService.bindingDriverToCar(
        profileId,
        carId,
      )
      this.logger.log('Create Yango profile bindingResponse', bindingResponse)
      if (bindingResponse !== 200)
        return await this.abortConversation(
          abortData,
          "Une erreur s'est produite lors de l'association du chauffeur au véhicule sur Yango",
          'CREATION',
        )

      const driverInfo =
        await this.driverPersonalInfoService.findDriverPersonalInfoByPhoneNumber(
          phoneNumber,
        )

      const documentFiles =
        await this.documentFileService.findAllByWhaPhoneNumber(whaPhoneNumber)

      // TODO: update the documents to add the driverInfoId
      await Promise.all(
        documentFiles.map(async (doc) => {
          await this.documentFileService.update(doc.id, {
            idDriver: driverInfo.id,
          })
        }),
      )

      await this.driverPersonalInfoService.update(driverInfo.id, {
        yangoProfileId: profileId,
      })

      const driverAssociatedCarId = (
        await this.driverCarService.findOneByDriverId(driverInfo.id)
      )?.idCar

      const carInfo = await this.carInfoService.findOne(driverAssociatedCarId)
      await this.carInfoService.update(carInfo.id, { yangoCarId: carId })

      //await this.makeAssociationBetweenDriverAndCar(driverInfo.id, carInfo.id)

      const successStep = await this.stepService.findOneByLevel(20)
      this.logger.log('Create Yango profile successStep', successStep.message)

      await this.handleMessageToSent({
        to: whaPhoneNumber,
        body: successStep.message,
        typing_time: 5,
      })

      await this.editHistoryConversation({
        whaPhoneNumber: whaPhoneNumber,
        status: HistoryConversationStatus.SUCCEEDED,
        reason: HistoryConversationReasonForEnding.NORMAL_FINISH,
        stepId: lastConversation.stepId,
      })

      this.deleteAllConversations(lastConversation)
    } catch (error) {
      await this.abortConversation(
        abortData,
        `Une erreur inattendue s'est produite lors du contact avec Yango: ${error?.data?.message}`,
        'CREATION',
      )
      this.logger.error(
        `Error processing during yango profile creation: Yango API error: ${error?.status} - ${JSON.stringify(error.data)}`,
      )
    }
  }

  private async buildCreateCarPayload(
    phoneNumber: string,
  ): Promise<CreateYangoCarDto> {
    const idDriver = (
      await this.driverPersonalInfoService.findDriverPersonalInfoByPhoneNumber(
        phoneNumber,
      )
    ).id
    const { idCar } =
      await this.driverCarService.findDriverLastAssociation(idDriver)
    const carInfo = await this.carInfoService.findOne(idCar)
    return {
      park_profile: {
        callsign: carInfo.code,
        fuel_type: 'petrol',
        status: 'unknown',
        categories: ['econom', 'comfort', 'comfort_plus', 'business'],
      },
      vehicle_licenses: {
        licence_plate_number: carInfo.plateNumber,
      },
      vehicle_specifications: {
        brand: carInfo.brand,
        color: carInfo.color,
        model: carInfo.model,
        transmission: 'mechanical',
        year: carInfo.year ? +carInfo.year : 2020, // Default to 2020 if year is not provided
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
          phone: `+${phoneNumber}`,
        },
        driver_license: {
          country: 'civ',
          expiry_date: driverLicenseInfo.expiryDate.toISOString().split('T')[0],
          issue_date: driverLicenseInfo.deliveryDate
            .toISOString()
            .split('T')[0],
          number: driverPersonalInfo.licenseNumber,
        },
        full_name: {
          first_name: driverPersonalInfo.firstName,
          last_name: driverPersonalInfo.lastName,
        },
      },
      profile: {
        hire_date: new Date().toISOString().split('T')[0],
      },
      account: {
        balance_limit: '100',
        work_rule_id: process.env.YANGO_WORK_RULE_ID,
      },
      carId,
    }
  }

  private async makeAssociationBetweenDriverAndCar(
    idDriver: number,
    idCar: number,
  ) {
    await this.driverCarService.updateEndDateByDriverId(idDriver)

    await this.driverCarService.create({ idDriver, idCar })
    // const association = await this.driverCarService.findOneByDriverId(idDriver)
    // if (association) {
    //   await this.driverCarService.update(association.id, { idDriver, idCar })
    // } else {
    //   await this.driverCarService.create({ idDriver, idCar })
    // }
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
      const step = await this.stepService.findOneBylevelAndidFlow(
        2,
        'Changement de véhicule',
      )
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
        const idDriver = (
          await this.driverPersonalInfoService.findDriverPersonalInfoByPhoneNumber(
            phoneNumber,
          )
        ).id
        const { idCar: recentIdCar } =
          await this.driverCarService.findDriverMostRecentAssociation(idDriver)

        await this.makeAssociationBetweenDriverAndCar(
          driverInfo.id,
          recentIdCar,
        )

        const documentFiles =
          await this.documentFileService.findAllByWhaPhoneNumber(whaPhoneNumber)

        // TODO: update the documents to add the driverInfoId
        await Promise.all(
          documentFiles.map(async (doc) => {
            await this.documentFileService.update(doc.id, {
              idDriver: driverInfo.id,
            })
          }),
        )

        return await this.abortConversation(abortData, '', 'UPDATE')
      }

      const bindingResponse = await this.yangoService.bindingDriverToCar(
        driverInfo.yangoProfileId,
        carId,
      )
      if (bindingResponse !== 200)
        return await this.abortConversation(
          abortData,
          "Une erreur s'est produite lors de l'association entre le chauffeur et le véhicule",
          'UPDATE',
        )

      await this.carInfoService.update(driverAssociatedCarId, {
        yangoCarId: carId,
      })

      const documentFiles =
        await this.documentFileService.findAllByWhaPhoneNumber(whaPhoneNumber)

      // TODO: update the documents to add the driverInfoId
      await Promise.all(
        documentFiles.map(async (doc) => {
          await this.documentFileService.update(doc.id, {
            idDriver: driverInfo.id,
          })
        }),
      )

      // await this.makeAssociationBetweenDriverAndCar(
      //   driverInfo.id,
      //   driverAssociatedCarId,
      // )

      const successStep = await this.stepService.findOneBylevelAndidFlow(
        7,
        'Changement de véhicule',
      )
      const message = successStep.message.replace(
        '{carPlateNumber}',
        createYangoCar.vehicle_licenses.licence_plate_number,
      )
      await this.handleMessageToSent({
        to: whaPhoneNumber,
        body: message,
        typing_time: 5,
      })

      await this.editHistoryConversation({
        whaPhoneNumber: whaPhoneNumber,
        status: HistoryConversationStatus.SUCCEEDED,
        reason: HistoryConversationReasonForEnding.NORMAL_FINISH,
        stepId: lastConversation.stepId,
      })

      this.deleteAllConversations(lastConversation)
    } catch (error) {
      await this.abortConversation(
        abortData,
        `Une erreur inattendue s'est produite entre lors du contact avec Yango: ${error?.data?.message}`,
        'UPDATE',
      )
      this.logger.error(
        `Error processing during yango profile creation: Yango API error: ${error.status} - ${JSON.stringify(error.data)}`,
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
    const abortData = this.buildAbortionPayload(lastConversation)
    try {
      const previousPhoneNumberStep =
        await this.stepService.findOneBylevelAndidFlow(
          2,
          'Modification de numéro de téléphone',
        )
      const currentPhoneNumberStep =
        await this.stepService.findOneBylevelAndidFlow(
          4,
          'Modification de numéro de téléphone',
        )
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
      const driverContractorId = (
        await this.driverPersonalInfoService.findDriverPersonalInfoByPhoneNumber(
          previousPhoneNumber,
        )
      ).yangoProfileId
      const driverProfileResponse =
        await this.yangoService.getDriverProfile(driverContractorId)
      if (!driverProfileResponse || driverProfileResponse.status !== 200)
        return await this.abortConversation(
          abortData,
          'Une erreur est survenue lors de la récupération du profil chauffeur sur Yango.',
        )

      driverProfileResponse.data.person.contact_info.phone = `+${currentPhoneNumber}`
      const response = await this.yangoService.updateDriverPhone(
        driverContractorId,
        driverProfileResponse.data,
      )
      console.log('response status', response)
      if (response !== 204)
        return await this.abortConversation(
          abortData,
          'Une erreur est survenue lors de la mise à jour du numéro de téléphone sur Yango.',
        )

      await this.driverPersonalInfoService.updateByPhoneNumber(
        previousPhoneNumber,
        currentPhoneNumber,
      )
      await this.driverLicenseInfoService.updatePhoneNumber(
        previousPhoneNumber,
        currentPhoneNumber,
      )
      const successStep = await this.stepService.findOneBylevelAndidFlow(
        6,
        'Modification de numéro de téléphone',
      )
      console.log('lastConversation', lastConversation.whaPhoneNumber)
      console.log('successStep', successStep.message)
      await this.handleMessageToSent({
        to: lastConversation.whaPhoneNumber,
        body: successStep.message,
        typing_time: 5,
      })
      console.log('message sent to driver')
      await this.editHistoryConversation({
        whaPhoneNumber: lastConversation.whaPhoneNumber,
        status: HistoryConversationStatus.SUCCEEDED,
        reason: HistoryConversationReasonForEnding.NORMAL_FINISH,
        stepId: lastConversation.stepId,
      })

      this.deleteAllConversations(lastConversation)
    } catch (error) {
      await this.abortConversation(
        abortData,
        `Une erreur inattendue s'est produite entre lors du contact avec Yango: ${error?.data?.message}`,
      )
      // Yango API error: ${error.status} - ${JSON.stringify(error.data)}
      this.logger.error(
        `Error processing during yango phone updation: Yango API error: ${error?.status} - ${JSON.stringify(error.data)}`,
      )
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
        await this.conversationService.findLastOneByWhaPhoneNumber(
          whaPhoneNumber,
        )
      console.log('lastConversation', lastConversation)
      if (lastConversation && lastConversation.updatedAt < fiveMinutesAgo) {
        await this.deleteInfoCollected(lastConversation)
        await this.conversationService.removeAllByPhoneNumber(whaPhoneNumber)
        this.logger.log(
          `Conversations deleted for phone number: ${whaPhoneNumber}`,
        )
        await this.sendErrorMessage(whaPhoneNumber)
        await this.editHistoryConversation({
          whaPhoneNumber,
          status: HistoryConversationStatus.FAIL,
          reason: HistoryConversationReasonForEnding.TIME_LIMIT_REACHED,
          stepId: lastConversation.stepId,
        })
      }
    }
  }

  private async sendErrorMessage(whaPhoneNumber: string) {
    const stopMessage = await this.stepService.findOneByLevel(99)
    const message = stopMessage.message
    await this.handleMessageToSent({
      to: whaPhoneNumber,
      body: message,
      typing_time: 5,
    })
  }

  private delay(
    ms: number = Number(process.env.DELAY_TIME) || 20000,
  ): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms / 2))
  }

  private removeAllSpaces(str: string): string {
    return str.replace(/\s+/g, '')
  }
}
