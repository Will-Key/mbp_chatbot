import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateHistoryConversationDto } from './dto/create-history-conversation.dto';
import { UpdateHistoryConversationDto } from './dto/update-history-conversation.dto';

@Injectable()
export class HistoryConversationService {
    constructor(private readonly prismaService: PrismaService) { }

    create(payload: CreateHistoryConversationDto) {
        return this.prismaService.historyConversation.create({
            data: payload
        })
    }

    update(id: number, payload: UpdateHistoryConversationDto) {
        return this.prismaService.historyConversation.update({
            where: {
                id
            },
            data: payload
        })
    }

    findOne(whaPhoneNumber: string, flowId: number) {
        return this.prismaService.historyConversation.findFirst({
            where: { whaPhoneNumber, flowId }
        })
    }
}
