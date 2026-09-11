import { Injectable } from '@nestjs/common'
import { LoyaltyBonusStatus } from '@prisma/client'
import { PrismaService } from 'prisma/prisma.service'
import { CreateLoyaltyBonusDto } from './dto/create-loyalty-bonus.dto'

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

  findHistoryByDriver(driverPersonnalInfoId: number) {
    return this.prismaService.loyaltyBonus.findMany({
      where: { driverPersonnalInfoId },
      orderBy: { periodFrom: 'desc' },
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
}
