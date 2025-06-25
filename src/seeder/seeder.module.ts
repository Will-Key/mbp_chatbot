import { Module } from '@nestjs/common'
import { SeederService } from './seeder.service'
import { FlowService } from '../flow/flow.service'
import { StepService } from '../step/step.service'
import { PrismaService } from 'prisma/prisma.service'

@Module({
  providers: [SeederService, FlowService, StepService, PrismaService],
  exports: [SeederService],
})
export class SeederModule {}
