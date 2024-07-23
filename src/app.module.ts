import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { FlowModule } from './flow/flow.module'
import { StepModule } from './step/step.module'
import { ConversationModule } from './conversation/conversation.module'
import { RequestLogModule } from './request-log/request-log.module'
import { DocumentFileModule } from './document-file/document-file.module';
import { DriverPersonnalInfoModule } from './driver-personnal-info/driver-personnal-info.module';
import { DriverLicenseInfoModule } from './driver-license-info/driver-license-info.module';
import { CarInfoModule } from './car-info/car-info.module';
import { DriverCarModule } from './driver-car/driver-car.module';

@Module({
  imports: [FlowModule, StepModule, ConversationModule, RequestLogModule, DocumentFileModule, DriverPersonnalInfoModule, DriverLicenseInfoModule, CarInfoModule, DriverCarModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
