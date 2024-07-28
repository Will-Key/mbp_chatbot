import { Module } from '@nestjs/common'
import { RequestLogService } from './request-log.service'
//import { RequestLogController } from './request-log.controller'
import { PrismaService } from '../../prisma/prisma.service'

@Module({
  //controllers: [RequestLogController],
  providers: [RequestLogService, PrismaService],
})
export class RequestLogModule {}
