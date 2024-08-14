import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import {
  Conversation,
  DocumentSide,
  DocumentType,
  ManualQueue,
  StepBadResponseMessageErrorType,
  StepExpectedResponseType,
} from '@prisma/client'
import { MessageStatus, NewMessageWebhookDto } from './dto/new-message-webhook.dto'
import { ManualQueueService } from '../manual-queue/manual-queue.service'
import { CreateManualQueueDto } from '../manual-queue/dto/create-manual-queue.dto'
import { ConversationService } from '../conversation/conversation.service'
import { StepService } from '../step/step.service'
import { ConversationType, DocumentUploadType, SentResponseType } from '../shared/types'
import { CreateConversationDto } from '../conversation/dto/create-conversation.dto'
import { SendMessageDto } from '../external-api/dto/send-message.dto'
import { WhapiService } from '../external-api/whapi.service'
import { CreateDocumentFileDto } from '../document-file/dto/create-document-file.dto'
import { DriverPersonnalInfoService } from '../driver-personnal-info/driver-personnal-info.service'
import { DocumentFileService } from '../document-file/document-file.service'
import { OcrSpaceService } from '../external-api/ocr-space.service'

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name)

  constructor(
    private readonly manualQueueService: ManualQueueService,
    private readonly conversationService: ConversationService,
    private readonly stepService: StepService,
    private readonly whapiService: WhapiService,
    private readonly driverPersonnalInfoService: DriverPersonnalInfoService,
    private readonly documentFileService: DocumentFileService,
    private readonly ocrSpaceService: OcrSpaceService
  ) { }

  async handleReceivedMessage(payload: NewMessageWebhookDto) {
    //await this.rabbitmqService.pushMessageReceived(message)
    await this.deleteMessageReceivedToWhapi(payload.messages[0].id)
    const element: CreateManualQueueDto = {
      message: JSON.stringify(payload.messages)
    }
    console.log('Create new element', element)
    await this.manualQueueService.create(element)
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async handleCron() {
    this.logger.log('Task is running every minute');

    // Select all messages in the manual queue table
    const messages = await this.manualQueueService.findAll()
    this.logger.log('Select messages', JSON.stringify(messages))
    if (messages.length) this.processMessages(messages)
  }

  private async processMessages(messages: ManualQueue[]) {
    for (const message of messages) {
      const newMessage: NewMessageWebhookDto = {
        status: MessageStatus.delivered,
        messages: JSON.parse(message.message)
      }
      this.logger.log('process each message', JSON.stringify(newMessage))
      await this.newMessage(message.id, newMessage)
    }
  }

  private async newMessage(messageQueueId: string, newMessage: NewMessageWebhookDto) {
    const conversations =
      await this.conversationService.findManyByWhaPhoneNumber(
        newMessage.messages[0].from,
      )
    const lastConversation = conversations?.[0]
    if (lastConversation) {
      await this.handleExistingConversation(
        messageQueueId,
        lastConversation,
        newMessage,
        conversations
      )
    } else {
      //await this.initConversationHistory(newMessage)
      await this.handleNewConversation(messageQueueId, newMessage)
    }
  }

  private async handleNewConversation(messageQueueId, newMessage: NewMessageWebhookDto) {
    const initialStep = await this.stepService.findOneByLevel(0)
    await this.sentResponse(messageQueueId, {
      whaPhoneNumber: newMessage.messages[0].from,
      convMessage: newMessage.messages[0].text.body,
      nextMessage: initialStep.message,
      stepId: initialStep.id,
    })
  }

  private async handleExistingConversation(
    messageQueueId: string,
    lastConversation: ConversationType,
    newMessage: NewMessageWebhookDto,
    conversations: Conversation[]
  ) {
    if (lastConversation.step.level === 0) {
      await this.handleMessageFromInitialLevel(messageQueueId, lastConversation, newMessage)
    } else if (lastConversation.step.flowId === 1) {
      await this.getFirstFlowSteps(messageQueueId, lastConversation, newMessage)
    } else if (lastConversation.step.flowId === 2) {
      await this.getSecondFlowSteps(messageQueueId, lastConversation, newMessage, conversations)
    }
  }

  private async handleMessageFromInitialLevel(
    messageQueueId: string,
    lastConversation: ConversationType,
    newMessage: NewMessageWebhookDto
  ) {
    if (newMessage.messages[0].text.body.includes('1')) {
      await this.startFlow(messageQueueId, newMessage, 1)
    } else if (newMessage.messages[0].text.body.includes('2')) {
      await this.startFlow(messageQueueId, newMessage, 2)
    } else {
      const errorMessage = this.getErrorMessage(lastConversation, 'incorrectChoice')
      await this.sentErrorResponse(messageQueueId, lastConversation, errorMessage)
    }
  }

  private async startFlow(messageQueueId, newMessage: NewMessageWebhookDto, flowId: number) {
    const nextStep = await this.stepService.findOneBylevelAndFlowId(1, flowId)
    //await this.setFlowChoosenConversationHistory(newMessage, nextStep.id)
    await this.sentResponse(messageQueueId, {
      whaPhoneNumber: newMessage.messages[0].from,
      convMessage: newMessage.messages[0].text.body,
      nextMessage: nextStep.message,
      stepId: nextStep.id,
    })
  }

  private async getFirstFlowSteps(
    messageQueueId: string,
    lastConversation: ConversationType,
    newMessage: NewMessageWebhookDto
  ) {
    switch (lastConversation.step.level) {
      case 1:
        await this.handlePhoneNumberStep(messageQueueId, lastConversation, newMessage)
        break
      case 2:
        await this.handleDriverLicenseFrontUpload(messageQueueId, lastConversation, newMessage)
        break
      case 3:
        await this.handleDriverLicenseBackUpload(messageQueueId, lastConversation, newMessage)
        break
      case 4:
        await this.handleCarRegistrationUpload(messageQueueId, lastConversation, newMessage)
        break
      default:
        this.sentErrorResponse(messageQueueId, lastConversation, newMessage.messages[0].text.body)
    }
  }

  private async handlePhoneNumberStep(
    messageQueueId: string,
    lastConversation: ConversationType,
    newMessage: NewMessageWebhookDto
  ) {
    const flowId = 1
    const whaPhoneNumber = newMessage.messages[0].from
    //await this.updateHistoryConversationUpdateTime(whaPhoneNumber, 1)
    const incomingMessage = newMessage.messages[0].text.body.trim()
    if (incomingMessage.length !== 10) {
      const errorMessage = this.getErrorMessage(lastConversation, 'equalLength')
      await this.sentErrorResponse(messageQueueId, lastConversation, errorMessage)
      return
    }
    const driver =
      await this.driverPersonnalInfoService.findDriverPersonnalInfoByPhoneNumber(
        `225${incomingMessage}`,
      )
    if (driver) {
      const errorMessage = this.getErrorMessage(lastConversation, 'isExist')
      await this.sentErrorResponse(messageQueueId, lastConversation, errorMessage)
      return
    }

    const nextStep = await this.stepService.findOneBylevelAndFlowId(
      lastConversation.step.level + 1,
      flowId,
    )
    await this.sentResponse(messageQueueId, {
      whaPhoneNumber,
      convMessage: `225${incomingMessage}`,
      nextMessage: nextStep.message,
      stepId: nextStep.id,
    })
  }

  private async handleDriverLicenseFrontUpload(
    messageQueueId: string,
    lastConversation: ConversationType,
    newMessage: NewMessageWebhookDto
  ) {
    await this.handleDocumentUpload(messageQueueId, {
      lastConversation,
      newMessage,
      documentSide: DocumentSide.FRONT,
      documentType: DocumentType.DRIVER_LICENSE,
      nextStepLevel: lastConversation.step.level + 1
    });
  }

  private async handleDriverLicenseBackUpload(
    messageQueueId: string,
    lastConversation: ConversationType,
    newMessage: NewMessageWebhookDto
  ) {
    await this.handleDocumentUpload(messageQueueId, {
      lastConversation,
      newMessage,
      documentSide: DocumentSide.BACK,
      documentType: DocumentType.DRIVER_LICENSE,
      nextStepLevel: lastConversation.step.level + 1
    });
  }

  private async handleCarRegistrationUpload(
    messageQueueId: string,
    lastConversation: ConversationType,
    newMessage: NewMessageWebhookDto
  ) {
    await this.handleDocumentUpload(messageQueueId, {
      lastConversation,
      newMessage,
      documentSide: DocumentSide.FRONT,
      documentType: DocumentType.CAR_REGISTRATION,
      nextStepLevel: 19
    });
    // TODO: Add a cron for sending data to Yango 
    // Or do it when we are on the last step
    // await this.sendDataToYango(newMessage);
  }

  private async handleDocumentUpload(messageQueueId: string, {
    lastConversation,
    newMessage,
    documentSide,
    documentType,
    nextStepLevel,
    flowId = 1
  }: DocumentUploadType) {
    const whaPhoneNumber = newMessage.messages[0].from;

    const checkImageValidityResponse = await this.checkImageValidity(messageQueueId, lastConversation, newMessage);
    if (checkImageValidityResponse === 0) return;

    const link = await this.getImageLink(newMessage.messages[0].image.id);
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
      await this.sentErrorResponse(messageQueueId, lastConversation, errorMessage);
      return;
    }

    const ocrResponse = await this.ocrSpaceService.sendFile(doc);
    if (ocrResponse === 0) {
      const errorMessage = "L'image n'a pas pu être traitée.\nVeuillez réessayer.";
      await this.sentErrorResponse(messageQueueId, lastConversation, errorMessage);
      return;
    }

    const nextStep = await this.stepService.findOneBylevelAndFlowId(
      nextStepLevel,
      flowId,
    );

    await this.sentResponse(messageQueueId, {
      whaPhoneNumber,
      convMessage: newMessage.messages[0].image.link,
      nextMessage: nextStep.message,
      stepId: nextStep.id,
    });
  }

  private async checkImageValidity(
    messageQueueId: string,
    lastConversation: ConversationType,
    newMessage: NewMessageWebhookDto
  ) {
    const image = newMessage.messages[0].image;
    if (newMessage.messages[0].type !== StepExpectedResponseType.image || !image?.id || !image?.preview.includes('data:image')) {
      const errorMessage = this.getErrorMessage(lastConversation, 'incorrectChoice');
      await this.sentErrorResponse(messageQueueId, lastConversation, errorMessage);
      return 0;
    }

    if (image.file_size > 1000000) {
      const errorMessage = this.getErrorMessage(lastConversation, 'maxSize');
      await this.sentErrorResponse(messageQueueId, lastConversation, errorMessage);
      return 0;
    }

    return 1;
  }

  private async getImageLink(imageId: string): Promise<string> {
    console.log('imageId', imageId)
    const medias = await this.whapiService.getMedias();
    console.log('medias', medias);
    return medias.find(media => media.id === imageId)?.link;
  }

  private getErrorMessage(
    lastConversation: ConversationType,
    errorType: StepBadResponseMessageErrorType,
  ): string {
    return lastConversation.step.stepBadResponseMessage.find(
      (sbrm) => sbrm.errorType === errorType,
    ).message
  }

  private async getSecondFlowSteps(
    messageQueueId: string,
    lastConversation: ConversationType,
    newMessage: NewMessageWebhookDto,
    conversations: Conversation[]
  ) {
    switch (conversations.length) {
      case 2:
        await this.handlePhoneNumberStep(messageQueueId, lastConversation, newMessage)
        break
      case 3:
      case 7:
        await this.handleSecondFlowFinalStep(messageQueueId, newMessage, 2)
        break
      default:
        this.sentErrorResponse(messageQueueId, lastConversation, newMessage.messages[0].text.body)
    }
  }

  private async handleSecondFlowFinalStep(
    messageQueueId: string,
    newMessage: NewMessageWebhookDto,
    flowId: number
  ) {
    const nextStep = await this.stepService.findOneBylevelAndFlowId(19, flowId)
    await this.sentResponse(messageQueueId, {
      whaPhoneNumber: newMessage.messages[0].from,
      convMessage: newMessage.messages[0].text.body,
      nextMessage: nextStep.message,
      stepId: nextStep.id,
    })
  }

  private async sentResponse(messageQueueId: string, {
    whaPhoneNumber,
    convMessage,
    nextMessage,
    stepId,
  }: SentResponseType) {
    const newConv: CreateConversationDto = {
      whaPhoneNumber,
      message: convMessage,
      stepId,
    }
    const conv = await this.conversationService.create(newConv)
    if (conv) {
      await this.handleMessageToSent(messageQueueId, {
        to: whaPhoneNumber,
        body: nextMessage,
        typing_time: 5,
      })
    }
  }

  private async sentErrorResponse(messageQueueId: string, conversation: Conversation, message: string) {
    const updatedConversation = await this.conversationService.update(
      conversation.id,
      {
        badResponseCount: conversation.badResponseCount + 1,
      },
    )
    if (updatedConversation.badResponseCount >= 2) {
      await this.conversationService.removeAllByPhoneNumber(
        conversation.whaPhoneNumber,
      )
      const errorStep = await this.stepService.findOneByLevel(15)
      this.handleMessageToSent(messageQueueId, {
        to: conversation.whaPhoneNumber,
        body: errorStep.message,
        typing_time: 5,
      })
      // await this.updateConversationHistoryStatusAndReason(
      //     conversation.whaPhoneNumber,
      //     conversation.stepId,
      //     HistoryConversationStatus.FAIL,
      //     HistoryConversationReasonForEnding.ERROR
      // )
      return
    }
    await this.handleMessageToSent(
      messageQueueId,
      {
        to: conversation.whaPhoneNumber,
        body: message,
        typing_time: 5,
      })
  }

  async handleMessageToSent(messageQueueId: string, message: SendMessageDto) {
    this.logger.log(`sent message to whapi: ${JSON.stringify(message)}`)
    try {
      await this.whapiService.sendMessage({
        ...message,
        to: `${message.to}@s.whatsapp.net`,
      })
      const elementDeleted = await this.manualQueueService.delete(messageQueueId)
      this.logger.log('element deleted to queue', elementDeleted)
    } catch (error) {
      this.logger.error(`error during response is sent to whapi ${message.to} ${error}`)
    }
  }

  async deleteMessageReceivedToWhapi(id: string) {
    await this.whapiService.deleteMessage(id)
  }
}
