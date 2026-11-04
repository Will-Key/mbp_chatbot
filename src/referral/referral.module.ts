import { Module } from '@nestjs/common'
import { PrismaService } from 'prisma/prisma.service'
import { ReferralService } from './referral.service'

@Module({
  providers: [ReferralService, PrismaService],
  exports: [ReferralService],
})
export class ReferralModule {}
