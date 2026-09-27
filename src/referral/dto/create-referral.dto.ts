import { ReferralStatus } from '@prisma/client'

export class CreateReferralDto {
  sponsorDriverId: number
  referredDriverId: number
  bonusAmount: number
  status?: ReferralStatus
}
