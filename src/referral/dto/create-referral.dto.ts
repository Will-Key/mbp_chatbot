import { ReferralStatus } from '@prisma/client'

export class CreateReferralDto {
  referralCodeId: number
  referredPhoneNumber: string
  referredDriverId?: number
  status?: ReferralStatus
}
