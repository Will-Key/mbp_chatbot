import { Module } from '@nestjs/common'
import { PrismaService } from 'prisma/prisma.service'
import { AppParameterService } from '../app-parameter/app-parameter.service'
import { FlowService } from '../flow/flow.service'
import { StepService } from '../step/step.service'
import { SeederService } from './seeder.service'

@Module({
  providers: [
    SeederService,
    FlowService,
    StepService,
    PrismaService,
    AppParameterService,
  ],
  exports: [SeederService],
})
export class SeederModule {}
