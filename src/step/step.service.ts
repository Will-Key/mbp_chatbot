import { Injectable } from '@nestjs/common'
import { CreateStepDto } from './dto/create-step.dto'
import { UpdateStepDto } from './dto/update-step.dto'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class StepService {
  constructor(private readonly prismaService: PrismaService) {}

  create(createStepDto: CreateStepDto) {
    return this.prismaService.step.create({ data: createStepDto })
  }

  findAll() {
    return this.prismaService.step.findMany()
  }

  findOne(id: number) {
    return this.prismaService.step.findUnique({ where: { id } })
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
