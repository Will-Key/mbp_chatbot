import { DriverOrderStatus } from '@prisma/client'

export class CreateDriverOrderDto {
  yangoOrderId: string
  shortId?: number
  status: DriverOrderStatus
  orderCreatedAt: Date
  bookedAt: Date
  endedAt?: Date
  provider?: string
  category?: string
  addressFrom?: string
  latFrom?: number
  lonFrom?: number
  addressTo?: string
  latTo?: number
  lonTo?: number
  paymentMethod?: string
  price?: string
  driverProfileId?: string
  driverName?: string
  carId?: string
  carBrandModel?: string
  carLicenseNumber?: string
  cancellationDescription?: string
}
