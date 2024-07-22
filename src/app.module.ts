import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { FlowModule } from './flow/flow.module'
import { StepModule } from './step/step.module'
import { ConversationModule } from './conversation/conversation.module'
import { RequestLogModule } from './request-log/request-log.module'

@Module({
  imports: [FlowModule, StepModule, ConversationModule, RequestLogModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
