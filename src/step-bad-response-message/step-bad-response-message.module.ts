import { Module } from '@nestjs/common';
import { StepBadResponseMessageService } from './step-bad-response-message.service';

@Module({
  providers: [StepBadResponseMessageService]
})
export class StepBadResponseMessageModule {}
