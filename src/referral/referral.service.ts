import { Injectable } from '@nestjs/common'
import { ReferralStatus } from '@prisma/client'
import { PrismaService } from 'prisma/prisma.service'
import { CreateReferralDto } from './dto/create-referral.dto'

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
      include: { referredDriver: true },
      orderBy: { createdAt: 'desc' },
    })
  }

  findRegistered() {
    return this.prismaService.referral.findMany({
      where: { status: ReferralStatus.REGISTERED },
    })
  }

  countCreditedBySponsorSince(sponsorDriverId: number, since: Date) {
    return this.prismaService.referral.count({
      where: {
        sponsorDriverId,
        status: ReferralStatus.CREDITED,
        creditedAt: { gte: since },
      },
    })
  }

  updateStatus(
    id: number,
    status: ReferralStatus,
    extra?: {
      yangoTransactionId?: string
      failureReason?: string
      creditedAt?: Date
      bonusAmount?: number
      campaignId?: number
    },
  ) {
    return this.prismaService.referral.update({
      where: { id },
      data: { status, ...extra },
    })
  }

  /** The campaign a referral credited now would belong to, if any. */
  findActiveCampaign(at: Date = new Date()) {
    return this.prismaService.referralCampaign.findFirst({
      where: {
        active: true,
        startDate: { lte: at },
        OR: [{ endDate: null }, { endDate: { gte: at } }],
      },
      orderBy: { startDate: 'desc' },
    })
  }

  countCampaigns() {
    return this.prismaService.referralCampaign.count()
  }

  createCampaign(data: {
    name: string
    startDate: Date
    endDate?: Date
    bonusAmount: number
  }) {
    return this.prismaService.referralCampaign.create({ data })
  }
}
