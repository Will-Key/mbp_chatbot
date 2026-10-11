import { ReferralStatus } from '@prisma/client'

export class CreateReferralDto {
  sponsorDriverId: number
  referredDriverId: number
  bonusAmount: number
  campaignId?: number
  status?: ReferralStatus
}
