import { Injectable } from '@nestjs/common'
import { PrismaService } from 'prisma/prisma.service'
import { CreateDriverOrderDto } from './dto/create-driver-order.dto'

@Injectable()
export class DriverOrderService {
  constructor(private readonly prismaService: PrismaService) {}

  create(createDriverOrderDto: CreateDriverOrderDto) {
    return this.prismaService.driverOrder.create({
      data: createDriverOrderDto,
    })
  }

  findAll() {
    return this.prismaService.driverOrder.findMany()
  }

  findOne(id: number) {
    return this.prismaService.driverOrder.findUnique({ where: { id } })
  }

  findByYangoOrderId(yangoOrderId: string) {
    return this.prismaService.driverOrder.findUnique({
      where: { yangoOrderId },
    })
  }

  upsertByYangoOrderId(createDriverOrderDto: CreateDriverOrderDto) {
    return this.prismaService.driverOrder.upsert({
      where: { yangoOrderId: createDriverOrderDto.yangoOrderId },
      create: createDriverOrderDto,
      update: createDriverOrderDto,
    })
  }
}
