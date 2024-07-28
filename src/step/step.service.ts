import { Injectable } from '@nestjs/common'
import { CreateStepDto } from './dto/create-step.dto'
import { UpdateStepDto } from './dto/update-step.dto'
import { PrismaService } from '../../prisma/prisma.service'
import { Step } from '@prisma/client'

@Injectable()
export class StepService {
  constructor(private readonly prismaService: PrismaService) {}

  create(createStepDto: CreateStepDto) {
    return this.prismaService.step.create({
      data: createStepDto,
    })
  }

  findAll() {
    return this.prismaService.step.findMany()
  }

  findOne(id: number) {
    return this.prismaService.step.findUnique({ where: { id } })
  }

  findOneByLevel(level: number) {
    return this.prismaService.step.findFirst({
      where: { level },
    })
  }

  findOneBylevelAndFlowId(level: number, flowId: number): Promise<Step | null> {
    return this.prismaService.step.findFirst({
      where: {
        AND: [
          {
            level,
          },
          { flowId },
        ],
      },
    })
  }

  update(id: number, data: UpdateStepDto) {
    return this.prismaService.step.update({
      data,
      where: { id },
    })
  }

  remove(id: number) {
    return this.prismaService.step.delete({ where: { id } })
  }
}
