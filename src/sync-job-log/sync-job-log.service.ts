import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from 'prisma/prisma.service'

@Injectable()
export class SyncJobLogService {
  constructor(private readonly prismaService: PrismaService) {}

  findAll(limit = 50) {
    return this.prismaService.syncJobLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  create(data: Prisma.SyncJobLogUncheckedCreateInput) {
    return this.prismaService.syncJobLog.create({ data })
  }

  update(id: number, data: Prisma.SyncJobLogUncheckedUpdateInput) {
    return this.prismaService.syncJobLog.update({
      where: { id },
      data,
    })
  }
}