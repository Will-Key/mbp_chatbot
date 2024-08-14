import { Conversation, DocumentSide, Step, StepBadResponseMessage, DocumentType } from '@prisma/client'
import { NewMessageWebhookDto } from 'src/webhook/dto/new-message-webhook.dto'

export type ConversationType = Conversation & {
  step: Step & {
    stepBadResponseMessage: StepBadResponseMessage[]
  }
}

export type SentResponseType = {
  whaPhoneNumber: string
  convMessage: string
  nextMessage: string
  stepId: number
}

export type DocumentUploadType = {
  lastConversation: ConversationType,
  newMessage: NewMessageWebhookDto,
  documentSide: DocumentSide,
  documentType: DocumentType,
  nextStepLevel: number,
  flowId?: number
}