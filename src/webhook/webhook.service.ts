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

@Injectable()
export class WebhookService {
  constructor(
    private readonly conversationService: ConversationService,
    private readonly stepService: StepService,
    private readonly diverService: DriverPersonnalInfoService,
    private readonly documentFileService: DocumentFileService,
  ) {}

  async newMessage(newMessage: NewMessageWebhookDto) {
    let nextStep: Step | null
    const conversations =
      await this.conversationService.findManyByWhaPhoneNumber(newMessage.from)

    if (!conversations) {
      nextStep = await this.stepService.findOne(0)

      this.saveMessage(newMessage, nextStep.id)

      // Push next message into the conversation queue
    }

    // When driver wants to be registered
    if (
      conversations.length === 1 &&
      newMessage.type === StepExpectedResponseType.text &&
      newMessage.text.body.includes('1')
    ) {
      nextStep = await this.stepService.findOneBylevelAndFlowId(
        conversations[0].step.level + 1,
        1,
      )
      this.saveMessage(newMessage, nextStep.id)
    } else {
      this.updateMessage(conversations[0], newMessage.text.body)
    }

    // Check if the register have sent his phoneNumber
    if (
      conversations.length === 2 &&
      conversations[0].step.flowId === 1 &&
      newMessage.type === StepExpectedResponseType.text &&
      newMessage.text.body.length >= 10 &&
      !(await this.diverService.findDriverPersonnalInfoByPhoneNumber(
        newMessage.text.body,
      ))
    ) {
      nextStep = await this.stepService.findOneBylevelAndFlowId(
        conversations[0].step.level + 1,
        1,
      )
      this.saveMessage(newMessage, nextStep.id)
    } else {
      this.updateMessage(conversations[0], newMessage.image.link)
    }

    if (
      (conversations.length === 3 ||
        conversations.length === 4 ||
        conversations.length === 5 ||
        conversations.length === 6) &&
      conversations[0].step.flowId === 1 &&
      newMessage.type === StepExpectedResponseType.image &&
      newMessage.image.link.includes('data:image/png' || 'data:image/jpeg')
    ) {
      const documentSide =
        conversations.length === 3 || conversations.length === 5
          ? DocumentSide.FRONT
          : DocumentSide.BACK
      const documentType =
        conversations.length === 3 || conversations.length === 4
          ? DocumentType.DRIVER_LICENSE
          : DocumentType.CAR_REGISTRATION

      const createDocumentFile: CreateDocumentFileDto = {
        dataImageUrl: newMessage.image.link,
        documentSide,
        documentType,
        whaPhoneNumber: newMessage.from,
      }
      await this.documentFileService.create(createDocumentFile)

      nextStep = await this.stepService.findOneBylevelAndFlowId(
        conversations[0].step.level + 1,
        1,
      )
      this.saveMessage(newMessage, nextStep.id)
    } else {
      this.updateMessage(conversations[0], newMessage.image.link)
    }

    if (conversations.length === 7 && conversations[0].step.flowId === 1) {
      nextStep = await this.stepService.findOneBylevelAndFlowId(
        conversations[0].step.level + 1,
        1,
      )
      this.saveMessage(newMessage, nextStep.id)
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

  private async updateMessage(
    { id, badResponseCount }: Conversation,
    message: string,
  ) {
    const conversation = await this.conversationService.update(id, {
      message,
      badResponseCount: badResponseCount + 1,
    })
    if (conversation.badResponseCount >= 2) {
      // Push message to whapi queue to demand to driver to go on MBP local

      await this.conversationService.removeAllByPhoneNumber(
        conversation.whaPhoneNumber,
      )
    } else {
      // Push message to whapi queue to request to retry
    }
  }
}
