import { Module } from '@nestjs/common'
import { PrismaService } from 'prisma/prisma.service'
import { AppParameterService } from '../app-parameter/app-parameter.service'
import { FlowService } from '../flow/flow.service'
import { LoyaltyBonusService } from '../loyalty-bonus/loyalty-bonus.service'
import { ReferralService } from '../referral/referral.service'
import { StepService } from '../step/step.service'
import { SeederService } from './seeder.service'

@Module({
  providers: [
    SeederService,
    FlowService,
    StepService,
    PrismaService,
    AppParameterService,
    LoyaltyBonusService,
    ReferralService,
  ],
  exports: [SeederService],
})
export class SeederModule {}
