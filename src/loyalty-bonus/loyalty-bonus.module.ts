import { Module } from '@nestjs/common'
import { PrismaService } from 'prisma/prisma.service'
import { LoyaltyBonusService } from './loyalty-bonus.service'

@Module({
  providers: [LoyaltyBonusService, PrismaService],
  exports: [LoyaltyBonusService],
})
export class LoyaltyBonusModule {}
