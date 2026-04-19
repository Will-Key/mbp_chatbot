import { Module } from '@nestjs/common'
import { PrismaService } from 'prisma/prisma.service'
import { DriverOrderService } from './driver-order.service'

@Module({
  providers: [DriverOrderService, PrismaService],
  exports: [DriverOrderService],
})
export class DriverOrderModule {}
