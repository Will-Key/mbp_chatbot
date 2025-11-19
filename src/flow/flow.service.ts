import { Injectable } from '@nestjs/common'
import { PrismaService } from 'prisma/prisma.service'
import { CreateFlowDto } from './dto/create-flow.dto'
import { UpdateFlowDto } from './dto/update-flow.dto'

@Injectable()
export class FlowService {
  constructor(private readonly prismaService: PrismaService) {}

  create(createFlowDto: CreateFlowDto) {
    return this.prismaService.flow.create({ data: createFlowDto })
  }

  findAll() {
    return this.prismaService.flow.findMany()
  }

  findOne(id: number) {
    return this.prismaService.flow.findUnique({ where: { id } })
  }

  findByName(idFlow: string) {
    return this.prismaService.flow.findFirst({ where: { idFlow } })
  }

  update(id: number, updateFlowDto: UpdateFlowDto) {
    return this.prismaService.flow.update({
      data: updateFlowDto,
      where: { id },
    })
  }

  remove(id: number) {
    return this.prismaService.flow.delete({ where: { id } })
  }
}
