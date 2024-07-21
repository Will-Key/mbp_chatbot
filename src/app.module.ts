import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FlowModule } from './flow/flow.module';

@Module({
  imports: [FlowModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
