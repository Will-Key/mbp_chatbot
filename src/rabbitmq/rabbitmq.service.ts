import { Inject, Injectable, Logger } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { WHAPI_SENT_QUEUE_NAME, WHAPI_RECEIVED_QUEUE_NAME } from './constants'
import { SendMessageDto } from './dto/send-message.dto'
import { firstValueFrom } from 'rxjs'
import { NewMessageWebhookDto } from '../webhook/dto/new-message-webhook.dto'
import { ConversationService } from '../conversation/conversation.service'
import {
  Conversation,
  DocumentSide,
  DocumentType,
  Step,
  StepExpectedResponseType,
} from '@prisma/client'
import { StepService } from '../step/step.service'
import { CreateConversationDto } from '../conversation/dto/create-conversation.dto'
import { DriverPersonnalInfoService } from '../driver-personnal-info/driver-personnal-info.service'
import { CreateDocumentFileDto } from '../document-file/dto/create-document-file.dto'
import { DocumentFileService } from '../document-file/document-file.service'
import { WhapiService } from 'src/external-api/whapi.service'

type ConversationType = Conversation & { step: Step }

@Injectable()
export class RabbitmqService {
  private readonly logger = new Logger(RabbitmqService.name)

  constructor(
    @Inject(WHAPI_RECEIVED_QUEUE_NAME)
    private readonly whapiReceivedQueueClient: ClientProxy,
    @Inject(WHAPI_SENT_QUEUE_NAME)
    private readonly whapiSentQueueClient: ClientProxy,
    private readonly conversationService: ConversationService,
    private readonly stepService: StepService,
    private readonly driverService: DriverPersonnalInfoService,
    private readonly documentFileService: DocumentFileService,
    private readonly whapiService: WhapiService,
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
      await this.conversationService.findManyByWhaPhoneNumber(newMessage.from)
    const currentConversation = conversations?.[0]

    if (currentConversation) {
      await this.handleExistingConversation(
        currentConversation,
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
      whaPhoneNumber: newMessage.from,
      convMessage: newMessage.text.body,
      nextMessage: initialStep.message,
      stepId: initialStep.id,
    })
  }

  private async handleExistingConversation(
    currentConversation: ConversationType,
    newMessage: NewMessageWebhookDto,
    conversations: Conversation[],
  ) {
    if (currentConversation.step.level === 0) {
      if (newMessage.text.body.includes('1')) {
        await this.startFlow(newMessage, 1)
      } else if (newMessage.text.body.includes('2')) {
        await this.startFlow(newMessage, 2)
      } else {
        this.updateMessage(currentConversation, 'Veuillez choisir entre 1 ou 2')
      }
    } else {
      if (currentConversation.step.flowId === 1) {
        await this.getFirstFlowSteps(
          currentConversation,
          newMessage,
          conversations,
        )
      } else if (currentConversation.step.flowId === 2) {
        await this.getSecondFlowSteps(
          currentConversation,
          newMessage,
          conversations,
        )
      }
    }
  }

  private async startFlow(newMessage: NewMessageWebhookDto, flowId: number) {
    const nextStep = await this.stepService.findOneBylevelAndFlowId(1, flowId)
    await this.saveMessage({
      whaPhoneNumber: newMessage.from,
      convMessage: newMessage.text.body,
      nextMessage: nextStep.message,
      stepId: nextStep.id,
    })
  }

  private async getFirstFlowSteps(
    currentConversation: ConversationType,
    newMessage: NewMessageWebhookDto,
    conversations: Conversation[],
  ) {
    switch (conversations.length) {
      // case 1:
      //   await this.handleFirstStep(currentConversation, newMessage, 1)
      //   break
      case 2:
        await this.handlePhoneNumberStep(currentConversation, newMessage, 1)
        break
      case 3:
      case 4:
      case 5:
      case 6:
        await this.handleDocumentUploadStep(
          currentConversation,
          newMessage,
          conversations.length,
          1,
        )
        break
      case 7:
        await this.handleFinalStep(currentConversation, newMessage, 1)
        break
      default:
        this.updateMessage(currentConversation, newMessage.text.body)
    }
  }

  // private async handleFirstStep(
  //   currentConversation: ConversationType,
  //   newMessage: NewMessageWebhookDto,
  //   flowId: number,
  // ) {
  //   if (
  //     newMessage.type === StepExpectedResponseType.text &&
  //     newMessage.text.body.includes('1')
  //   ) {
  //     const nextStep = await this.stepService.findOneBylevelAndFlowId(
  //       currentConversation.step.level + 1,
  //       flowId,
  //     )
  //     await this.saveMessage({
  //       whaPhoneNumber: newMessage.from,
  //       convMessage: newMessage.text.body,
  //       nextMessage: nextStep.message,
  //       stepId: nextStep.id,
  //     })
  //   } else {
  //     this.updateMessage(currentConversation, newMessage.text.body)
  //   }
  // }

  private async handlePhoneNumberStep(
    currentConversation: ConversationType,
    newMessage: NewMessageWebhookDto,
    flowId: number,
  ) {
    if (
      newMessage.type === StepExpectedResponseType.text &&
      newMessage.text.body.length === 10 &&
      !(await this.driverService.findDriverPersonnalInfoByPhoneNumber(
        `225${newMessage.text.body.trim()}`,
      ))
    ) {
      const nextStep = await this.stepService.findOneBylevelAndFlowId(
        currentConversation.step.level + 1,
        flowId,
      )
      await this.saveMessage({
        whaPhoneNumber: newMessage.from,
        convMessage: newMessage.text.body,
        nextMessage: nextStep.message,
        stepId: nextStep.id,
      })
    } else {
      this.updateMessage(
        currentConversation,
        'Veuillez entrer votre numéro de téléphone sans caractères ajouté',
      )
    }
  }

  private async handleDocumentUploadStep(
    currentConversation: ConversationType,
    newMessage: NewMessageWebhookDto,
    conversationCount: number,
    flowId: number,
  ) {
    if (
      newMessage.type === StepExpectedResponseType.image &&
      (newMessage.image.link.includes('data:image/png') ||
        newMessage.image.link.includes('data:image/jpeg'))
    ) {
      const documentSide =
        conversationCount === 3 || conversationCount === 5
          ? DocumentSide.FRONT
          : DocumentSide.BACK
      const documentType =
        conversationCount === 3 || conversationCount === 4
          ? DocumentType.DRIVER_LICENSE
          : DocumentType.CAR_REGISTRATION

      const createDocumentFile: CreateDocumentFileDto = {
        dataImageUrl: newMessage.image.link,
        documentSide,
        documentType,
        whaPhoneNumber: newMessage.from,
      }
      await this.documentFileService.create(createDocumentFile)

      const nextStep = await this.stepService.findOneBylevelAndFlowId(
        currentConversation.step.level + 1,
        flowId,
      )
      await this.saveMessage({
        whaPhoneNumber: newMessage.from,
        convMessage: newMessage.image.link,
        nextMessage: nextStep.message,
        stepId: nextStep.id,
      })
    } else {
      this.updateMessage(
        currentConversation,
        'Veuillez télécharger votre pièce comme demandé',
      )
    }
  }

  private async handleFinalStep(
    currentConversation: ConversationType,
    newMessage: NewMessageWebhookDto,
    flowId: number,
  ) {
    const nextStep = await this.stepService.findOneBylevelAndFlowId(
      currentConversation.step.level + 1,
      flowId,
    )
    await this.saveMessage({
      whaPhoneNumber: newMessage.from,
      convMessage: newMessage.text.body,
      nextMessage: nextStep.message,
      stepId: nextStep.id,
    })
  }

  private async getSecondFlowSteps(
    currentConversation: ConversationType,
    newMessage: NewMessageWebhookDto,
    conversations: Conversation[],
  ) {
    switch (conversations.length) {
      case 2:
        await this.handlePhoneNumberStep(currentConversation, newMessage, 2)
        break
      case 3:
      case 7:
        await this.handleFinalStep(currentConversation, newMessage, 2)
        break
      default:
        this.updateMessage(currentConversation, newMessage.text.body)
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
    await this.conversationService.create(newConv)

    await this.pushMessageToSent({
      id: whaPhoneNumber,
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
      this.pushMessageToSent({
        id: conversation.whaPhoneNumber,
        body: errorStep.message,
        typing_time: 5,
      })
    } else {
      this.pushMessageToSent({
        id: conversation.whaPhoneNumber,
        body: message,
        typing_time: 5,
      })
    }
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
    await this.whapiService.sendMessage(message)
  }
}
