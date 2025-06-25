import {
  HistoryConversationReasonForEnding,
  HistoryConversationStatus,
} from '@prisma/client'

export class CreateHistoryConversationDto {
  whaPhoneNumber: string

  stepId?: number

  status: HistoryConversationStatus

  reason?: HistoryConversationReasonForEnding
}
