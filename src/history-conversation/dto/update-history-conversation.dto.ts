import { HistoryConversationReasonForEnding, HistoryConversationStatus } from "@prisma/client"

export class UpdateHistoryConversationDto {
    stepId?: number

    status?: HistoryConversationStatus

    reason?: HistoryConversationReasonForEnding
}