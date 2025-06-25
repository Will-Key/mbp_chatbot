import { Module } from '@nestjs/common'
import { HistoryConversationService } from './history-conversation.service'
import { PrismaService } from 'prisma/prisma.service'

@Module({
  providers: [HistoryConversationService, PrismaService],
})
export class HistoryConversationModule {}
