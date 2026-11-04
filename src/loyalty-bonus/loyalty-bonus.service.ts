import { Injectable } from '@nestjs/common'
import { LoyaltyBonusStatus } from '@prisma/client'
import { PrismaService } from 'prisma/prisma.service'
import { CreateLoyaltyBonusDto } from './dto/create-loyalty-bonus.dto'

export type LoyaltyBonusTierRow = { minRides: number; bonusAmount: number }

@Injectable()
export class LoyaltyBonusService {
  constructor(private readonly prismaService: PrismaService) {}

  create(createLoyaltyBonusDto: CreateLoyaltyBonusDto) {
    return this.prismaService.loyaltyBonus.create({
      data: createLoyaltyBonusDto,
    })
  }

  findByDriverAndPeriod(
    driverPersonnalInfoId: number,
    periodFrom: Date,
    periodTo: Date,
  ) {
    return this.prismaService.loyaltyBonus.findUnique({
      where: {
        driverPersonnalInfoId_periodFrom_periodTo: {
          driverPersonnalInfoId,
          periodFrom,
          periodTo,
        },
      },
    })
  }

  findHistoryByDriver(driverPersonnalInfoId: number, take?: number) {
    return this.prismaService.loyaltyBonus.findMany({
      where: { driverPersonnalInfoId },
      orderBy: { periodFrom: 'desc' },
      take,
    })
  }

  updateStatus(
    id: number,
    status: LoyaltyBonusStatus,
    extra?: { yangoTransactionId?: string; failureReason?: string },
  ) {
    return this.prismaService.loyaltyBonus.update({
      where: { id },
      data: { status, ...extra },
    })
  }

  /** Active tiers, lowest threshold first. */
  findActiveTiers(): Promise<LoyaltyBonusTierRow[]> {
    return this.prismaService.loyaltyBonusTier.findMany({
      where: { active: true },
      orderBy: { minRides: 'asc' },
      select: { minRides: true, bonusAmount: true },
    })
  }

  countTiers() {
    return this.prismaService.loyaltyBonusTier.count()
  }

  createTier(data: { minRides: number; bonusAmount: number }) {
    return this.prismaService.loyaltyBonusTier.create({ data })
  }
}

/** The bonus owed for a ride count: the highest tier the driver reached. */
export function resolveLoyaltyBonusAmount(
  ridesCount: number,
  tiers: LoyaltyBonusTierRow[],
): number {
  return tiers
    .filter((tier) => ridesCount >= tier.minRides)
    .reduce((amount, tier) => Math.max(amount, tier.bonusAmount), 0)
}

/** The next tier the driver has not reached yet, if any. */
export function findNextLoyaltyBonusTier(
  ridesCount: number,
  tiers: LoyaltyBonusTierRow[],
): LoyaltyBonusTierRow | null {
  return tiers.find((tier) => ridesCount < tier.minRides) ?? null
}
