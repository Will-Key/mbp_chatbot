import { Module } from '@nestjs/common'
import { StepService } from './step.service'
//import { StepController } from './step.controller'
import { PrismaService } from 'prisma/prisma.service'

@Module({
  //controllers: [StepController],
  providers: [StepService, PrismaService],
})
export class StepModule {}
