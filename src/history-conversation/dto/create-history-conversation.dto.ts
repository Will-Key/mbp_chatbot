import { HistoryConversationReasonForEnding, HistoryConversationStatus } from "@prisma/client"

export class CreateHistoryConversationDto {
    whaPhoneNumber: string

    flowId: number

    status: HistoryConversationStatus

    reason: HistoryConversationReasonForEnding
}