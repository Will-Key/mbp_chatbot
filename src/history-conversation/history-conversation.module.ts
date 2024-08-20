import { Module } from '@nestjs/common';
import { HistoryConversationService } from './history-conversation.service';
import { HistoryConversationController } from './history-conversation.controller';

@Module({
  controllers: [HistoryConversationController],
  providers: [HistoryConversationService],
})
export class HistoryConversationModule {}
