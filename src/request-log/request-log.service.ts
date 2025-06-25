import { Injectable } from '@nestjs/common'
import { CreateRequestLogDto } from './dto/create-request-log.dto'
import { UpdateRequestLogDto } from './dto/update-request-log.dto'
import { PrismaService } from 'prisma/prisma.service'

@Injectable()
export class RequestLogService {
  constructor(private readonly prismaService: PrismaService) {}

  create(createRequestLogDto: CreateRequestLogDto) {
    return this.prismaService.requestLog.create({ data: createRequestLogDto })
  }

  findAll() {
    return this.prismaService.requestLog.findMany()
  }

  findOne(id: number) {
    return this.prismaService.requestLog.findUnique({ where: { id } })
  }

  update(id: number, updateRequestLogDto: UpdateRequestLogDto) {
    return this.prismaService.requestLog.update({
      data: updateRequestLogDto,
      where: { id },
    })
  }

  remove(id: number) {
    return this.prismaService.requestLog.delete({ where: { id } })
  }
}
