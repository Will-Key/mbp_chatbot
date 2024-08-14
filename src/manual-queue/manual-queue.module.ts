import { Module } from '@nestjs/common';
import { ManualQueueService } from './manual-queue.service';
import { ManualQueueController } from './manual-queue.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [ManualQueueController],
  providers: [ManualQueueService, PrismaService],
})
export class ManualQueueModule { }
