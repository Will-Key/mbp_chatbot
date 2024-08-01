import { Inject, Injectable, Logger } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import {
  WHAPI_SENT_QUEUE_NAME,
  WHAPI_RECEIVED_QUEUE_NAME,
  OCR_SENT_QUEUE_NAME,
} from './constants'
import { SendMessageDto } from './dto/send-message.dto'
import { firstValueFrom } from 'rxjs'
import { NewMessageWebhookDto } from '../webhook/dto/new-message-webhook.dto'
import { ConversationService } from '../conversation/conversation.service'
import {
  Conversation,
  DocumentFile,
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
import { GetOcrResponseDto } from './dto/get-ocr-response.dto'

type ConversationType = Conversation & { step: Step }

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
    console.log('message received', message)
    await this.newMessage(message)
  }

  async newMessage(newMessage: NewMessageWebhookDto) {
    const conversations =
      await this.conversationService.findManyByWhaPhoneNumber(
        newMessage.messages[0].from,
      )
    const currentConversation = conversations?.[0]
    console.log('current conversation', currentConversation)
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
    console.log('initial step', initialStep)
    console.log('newMessage', newMessage)
    await this.saveMessage({
      whaPhoneNumber: newMessage.messages[0].from,
      convMessage: newMessage.messages[0].text.body,
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
      if (newMessage.messages[0].text.body.includes('1')) {
        await this.startFlow(newMessage, 1)
      } else if (newMessage.messages[0].text.body.includes('2')) {
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
      whaPhoneNumber: newMessage.messages[0].from,
      convMessage: newMessage.messages[0].text.body,
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
        this.updateMessage(
          currentConversation,
          newMessage.messages[0].text.body,
        )
    }
  }

  // private async handleFirstStep(
  //   currentConversation: ConversationType,
  //   newMessage: NewMessageWebhookDto,
  //   flowId: number,
  // ) {
  //   if (
  //     newMessage.messages[0].type === StepExpectedResponseType.text &&
  //     newMessage.messages[0].messages[0].text.body.includes('1')
  //   ) {
  //     const nextStep = await this.stepService.findOneBylevelAndFlowId(
  //       currentConversation.step.level + 1,
  //       flowId,
  //     )
  //     await this.saveMessage({
  //       whaPhoneNumber: newMessage.messages[0].from,
  //       convMessage: newMessage.messages[0].messages[0].text.body,
  //       nextMessage: nextStep.message,
  //       stepId: nextStep.id,
  //     })
  //   } else {
  //     this.updateMessage(currentConversation, newMessage.messages[0].messages[0].text.body)
  //   }
  // }

  private async handlePhoneNumberStep(
    currentConversation: ConversationType,
    newMessage: NewMessageWebhookDto,
    flowId: number,
  ) {
    if (
      newMessage.messages[0].type === StepExpectedResponseType.text &&
      newMessage.messages[0].text.body.length === 10 &&
      !(await this.driverService.findDriverPersonnalInfoByPhoneNumber(
        `225${newMessage.messages[0].text.body.trim()}`,
      ))
    ) {
      const nextStep = await this.stepService.findOneBylevelAndFlowId(
        currentConversation.step.level + 1,
        flowId,
      )
      await this.saveMessage({
        whaPhoneNumber: newMessage.messages[0].from,
        convMessage: newMessage.messages[0].text.body,
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
      newMessage.messages[0].type === StepExpectedResponseType.image &&
      (newMessage.messages[0].image.preview.includes('data:image/png') ||
        newMessage.messages[0].image.preview.includes('data:image/jpeg'))
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
        dataImageUrl: newMessage.messages[0].image.link,
        documentSide,
        documentType,
        whaPhoneNumber: newMessage.messages[0].from,
      }
      await this.documentFileService.create(createDocumentFile)

      if (currentConversation.step.level === 5) {
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
        // Get all documents for this conversation
        const documents =
          await this.documentFileService.findAllByWhaPhoneNumber(
            newMessage.messages[0].from,
          )
        // Push each conversation in the ocr give queue
        for (const doc of documents) {
          this.pushDocumentQueue(doc)
        }
      } else {
        const nextStep = await this.stepService.findOneBylevelAndFlowId(
          currentConversation.step.level + 1,
          flowId,
        )
        await this.saveMessage({
          whaPhoneNumber: newMessage.messages[0].from,
          convMessage: newMessage.messages[0].image.link,
          nextMessage: nextStep.message,
          stepId: nextStep.id,
        })
      }
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
    const nextStep = await this.stepService.findOneBylevelAndFlowId(19, flowId)
    await this.saveMessage({
      whaPhoneNumber: newMessage.messages[0].from,
      convMessage: newMessage.messages[0].text.body,
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
        this.updateMessage(
          currentConversation,
          newMessage.messages[0].text.body,
        )
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
    } else {
      this.handleMessageToSent({
        to: conversation.whaPhoneNumber,
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
    this.logger.log(`sent message to whapi: ${JSON.stringify(message)}`)
    await this.whapiService.sendMessage({
      ...message,
      to: `${message.to}@s.whatsapp.net`,
    })
  }

  async pushDocumentQueue(doc: DocumentFile) {
    try {
      await firstValueFrom(
        this.whapiSentQueueClient.emit(OCR_SENT_QUEUE_NAME, doc),
      )
      this.logger.log(`Emitting doc to queue: ${JSON.stringify(doc)}`)
    } catch (error) {
      this.logger.error(`Error on emitting doc: ${error}`)
    }
  }

  async handleDocumentPushedQueue() {}

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

  async handleOcrResponsePushedQueue() {}
}
