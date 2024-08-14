import { Module } from '@nestjs/common';
import { HistoryConversationService } from './history-conversation.service';
import { HistoryConversationController } from './history-conversation.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [HistoryConversationController],
  providers: [HistoryConversationService, PrismaService],
})
export class HistoryConversationModule { }
