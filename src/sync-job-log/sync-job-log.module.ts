import { Module } from '@nestjs/common'
import { PrismaService } from 'prisma/prisma.service'
import { SyncJobLogController } from './sync-job-log.controller'
import { SyncJobLogService } from './sync-job-log.service'

@Module({
  controllers: [SyncJobLogController],
  providers: [SyncJobLogService, PrismaService],
  exports: [SyncJobLogService],
})
export class SyncJobLogModule {}