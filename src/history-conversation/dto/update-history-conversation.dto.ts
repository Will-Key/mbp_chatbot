import { HistoryConversationReasonForEnding, HistoryConversationStatus } from "@prisma/client"

export class UpdateHistoryConversationDto {
    status: HistoryConversationStatus

    reason: HistoryConversationReasonForEnding
}