import { LoyaltyBonusStatus } from '@prisma/client'

export class CreateLoyaltyBonusDto {
  driverPersonnalInfoId: number
  periodFrom: Date
  periodTo: Date
  ridesCount: number
  bonusAmount: number
  status?: LoyaltyBonusStatus
  yangoTransactionId?: string
  failureReason?: string
}
