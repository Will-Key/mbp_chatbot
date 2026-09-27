import { Injectable } from '@nestjs/common'
import { ReferralStatus } from '@prisma/client'
import { PrismaService } from 'prisma/prisma.service'
import { CreateReferralDto } from './dto/create-referral.dto'

export const REFERRAL_BONUS_AMOUNT = 1000

@Injectable()
export class ReferralService {
  constructor(private readonly prismaService: PrismaService) {}

  create(createReferralDto: CreateReferralDto) {
    return this.prismaService.referral.create({ data: createReferralDto })
  }

  findByReferredDriver(referredDriverId: number) {
    return this.prismaService.referral.findUnique({
      where: { referredDriverId },
    })
  }

  findHistoryBySponsor(sponsorDriverId: number) {
    return this.prismaService.referral.findMany({
      where: { sponsorDriverId },
      orderBy: { createdAt: 'desc' },
    })
  }

  updateStatus(
    id: number,
    status: ReferralStatus,
    extra?: { yangoTransactionId?: string; failureReason?: string },
  ) {
    return this.prismaService.referral.update({
      where: { id },
      data: { status, ...extra },
    })
  }
}
