import { Injectable, Logger } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { randomBytes } from 'crypto'
import { PrismaService } from 'prisma/prisma.service'

const PRISMA_UNIQUE_CONSTRAINT_ERROR = 'P2002'

@Injectable()
export class ReferralService {
  private readonly logger = new Logger(ReferralService.name)

  constructor(private readonly prismaService: PrismaService) {}

  async getOrCreateCodeForDriver(driverPersonnalInfoId: number) {
    const existing = await this.prismaService.referralCode.findUnique({
      where: { driverPersonnalInfoId },
    })
    if (existing) return existing

    for (let attempt = 0; attempt < 5; attempt++) {
      const code = randomBytes(4).toString('hex').toUpperCase()
      try {
        return await this.prismaService.referralCode.create({
          data: { code, driverPersonnalInfoId },
        })
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === PRISMA_UNIQUE_CONSTRAINT_ERROR
        ) {
          continue
        }
        throw error
      }
    }
    throw new Error('Impossible de générer un code de parrainage unique')
  }

  findCodeByCode(code: string) {
    return this.prismaService.referralCode.findUnique({ where: { code } })
  }

  async registerReferralAttempt(code: string, referredPhoneNumber: string) {
    const referralCode = await this.findCodeByCode(code)
    if (!referralCode) return null

    try {
      return await this.prismaService.referral.create({
        data: {
          referralCodeId: referralCode.id,
          referredPhoneNumber,
        },
      })
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === PRISMA_UNIQUE_CONSTRAINT_ERROR
      ) {
        this.logger.warn(
          `Referral already exists for phone number ${referredPhoneNumber}`,
        )
        return null
      }
      throw error
    }
  }

  async markRegistered(referredPhoneNumber: string, driverId: number) {
    const referral = await this.prismaService.referral.findUnique({
      where: { referredPhoneNumber },
    })
    if (!referral || referral.status !== 'PENDING_REGISTRATION') return null

    return this.prismaService.referral.update({
      where: { id: referral.id },
      data: { status: 'REGISTERED', referredDriverId: driverId },
    })
  }

  async markActivated(driverId: number) {
    const referral = await this.prismaService.referral.findUnique({
      where: { referredDriverId: driverId },
    })
    if (!referral || referral.status !== 'REGISTERED') return null

    // TODO: once MBP defines the referral bonus rule (amount + eligibility
    // condition), this is where to evaluate it and trigger a Yango
    // transaction (yangoService.createTransaction with kind: 'referal').
    return this.prismaService.referral.update({
      where: { id: referral.id },
      data: { status: 'ACTIVATED' },
    })
  }

  findHistoryByDriver(driverPersonnalInfoId: number) {
    return this.prismaService.referral.findMany({
      where: { referralCode: { driverPersonnalInfoId } },
      orderBy: { createdAt: 'desc' },
    })
  }
}
