import { Controller } from '@nestjs/common';
import { ManualQueueService } from './manual-queue.service';

@Controller()
export class ManualQueueController {
  constructor(private readonly manualQueueService: ManualQueueService) {}
}
