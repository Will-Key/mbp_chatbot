import { Controller } from '@nestjs/common';
import { HistoryConversationService } from './history-conversation.service';

@Controller()
export class HistoryConversationController {
  constructor(private readonly historyConversationService: HistoryConversationService) {}
}
