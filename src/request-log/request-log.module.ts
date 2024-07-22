import { Module } from '@nestjs/common';
import { RequestLogService } from './request-log.service';
import { RequestLogController } from './request-log.controller';

@Module({
  controllers: [RequestLogController],
  providers: [RequestLogService],
})
export class RequestLogModule {}
