import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FlowModule } from './flow/flow.module';
import { StepModule } from './step/step.module';

@Module({
  imports: [FlowModule, StepModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
