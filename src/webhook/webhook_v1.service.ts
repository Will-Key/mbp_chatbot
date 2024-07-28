import { Injectable } from '@nestjs/common'
import { NewMessageWebhookDto } from './dto/new-message-webhook.dto'
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
import { DocumentFileService } from 'src/document-file/document-file.service'

type ConversationType = Conversation & { step: Step }

@Injectable()
export class WebhookService {
  constructor(
    private readonly conversationService: ConversationService,
    private readonly stepService: StepService,
    private readonly driverService: DriverPersonnalInfoService,
    private readonly documentFileService: DocumentFileService,
  ) {}

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
    const nextStep = await this.stepService.findOneByLevel(0)
    await this.saveMessage(newMessage, nextStep.id)
    // Push next message into the conversation queue
  }

  private async handleExistingConversation(
    currentConversation: ConversationType,
    newMessage: NewMessageWebhookDto,
    conversations: Conversation[],
  ) {
    if (conversations.length === 1 && newMessage.text.body.includes('1'))
      this.getFirstFlowSteps(currentConversation, newMessage, conversations)
    if (conversations.length === 1 && newMessage.text.body.includes('2'))
      this.getSecondFlowSteps(currentConversation, newMessage, conversations)
  }

  private async getFirstFlowSteps(
    currentConversation: ConversationType,
    newMessage: NewMessageWebhookDto,
    conversations: Conversation[],
  ) {
    switch (conversations.length) {
      case 1:
        await this.handleFirstStep(currentConversation, newMessage)
        break
      case 2:
        await this.handlePhoneNumberStep(currentConversation, newMessage)
        break
      case 3:
      case 4:
      case 5:
      case 6:
        await this.handleDocumentUploadStep(
          currentConversation,
          newMessage,
          conversations.length,
        )
        break
      case 7:
        await this.handleFinalStep(currentConversation, newMessage)
        break
      default:
        this.updateMessage(currentConversation, newMessage.text.body)
    }
  }

  private async handleFirstStep(
    currentConversation: ConversationType,
    newMessage: NewMessageWebhookDto,
  ) {
    if (
      newMessage.type === StepExpectedResponseType.text &&
      newMessage.text.body.includes('1')
    ) {
      const nextStep = await this.stepService.findOneBylevelAndFlowId(
        currentConversation.step.level + 1,
        1,
      )
      await this.saveMessage(newMessage, nextStep.id)
    } else {
      this.updateMessage(currentConversation, newMessage.text.body)
    }
  }

  private async handlePhoneNumberStep(
    currentConversation: ConversationType,
    newMessage: NewMessageWebhookDto,
  ) {
    if (
      newMessage.type === StepExpectedResponseType.text &&
      newMessage.text.body.length >= 10 &&
      !(await this.driverService.findDriverPersonnalInfoByPhoneNumber(
        `225${newMessage.text.body}`,
      ))
    ) {
      const nextStep = await this.stepService.findOneBylevelAndFlowId(
        currentConversation.step.level + 1,
        1,
      )
      await this.saveMessage(newMessage, nextStep.id)
    } else {
      this.updateMessage(currentConversation, newMessage.text.body)
    }
  }

  private async handleDocumentUploadStep(
    currentConversation: ConversationType,
    newMessage: NewMessageWebhookDto,
    conversationCount: number,
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
        1,
      )
      await this.saveMessage(newMessage, nextStep.id)
    } else {
      this.updateMessage(currentConversation, newMessage.image.link)
    }
  }

  private async handleFinalStep(
    currentConversation: ConversationType,
    newMessage: NewMessageWebhookDto,
  ) {
    const nextStep = await this.stepService.findOneBylevelAndFlowId(
      currentConversation.step.level + 1,
      1,
    )
    await this.saveMessage(newMessage, nextStep.id)
  }

  private async getSecondFlowSteps(
    currentConversation: ConversationType,
    newMessage: NewMessageWebhookDto,
    conversations: Conversation[],
  ) {
    switch (conversations.length) {
      case 1:
        await this.handleFirstStep(currentConversation, newMessage)
        break
      case 2:
        await this.handlePhoneNumberStep(currentConversation, newMessage)
        break
      case 3:
      case 4:
      case 5:
      case 6:
        await this.handleDocumentUploadStep(
          currentConversation,
          newMessage,
          conversations.length,
        )
        break
      case 7:
        await this.handleFinalStep(currentConversation, newMessage)
        break
      default:
        this.updateMessage(currentConversation, newMessage.text.body)
    }
  }

  private async saveMessage(newMessage: NewMessageWebhookDto, stepId: number) {
    const newConv: CreateConversationDto = {
      whaPhoneNumber: newMessage.from,
      message: newMessage.text.body,
      stepId,
    }
    await this.conversationService.create(newConv)
    // Push message to whapi queue
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
      // Push message to whapi queue to demand to driver to go on MBP local
      await this.conversationService.removeAllByPhoneNumber(
        conversation.whaPhoneNumber,
      )
    } else {
      // Push message to whapi queue to request to retry
    }
  }
}
