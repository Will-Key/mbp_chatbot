import { Injectable } from '@nestjs/common'
import { Step } from '@prisma/client'
import { PrismaService } from 'prisma/prisma.service'
import { CreateStepDto } from './dto/create-step.dto'
import { UpdateStepDto } from './dto/update-step.dto'

@Injectable()
export class StepService {
  constructor(private readonly prismaService: PrismaService) {}

  create(createStepDto: CreateStepDto) {
    return this.prismaService.step.create({
      data: createStepDto,
    })
  }

  createWithBadResponseMessage({
    badResponseMessage,
    ...createStepDto
  }: CreateStepDto) {
    return this.prismaService.step.create({
      data: {
        ...createStepDto,
        stepBadResponseMessage: {
          create: badResponseMessage,
        },
      },
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

  findOneBylevelAndidFlow(
    level: number,
    idFlow: string,
  ): Promise<Step | null> {
    return this.prismaService.step.findFirst({
      where: {
        level,
        idFlow,
      },
      include: {
        stepBadResponseMessage: true,
      },
    })
  }

  update(id: number, data: UpdateStepDto) {
    return this.prismaService.step.update({
      data,
      where: { id },
    })
  }

  // Dans step.service.ts
  async updateStep(id: number, updateData: CreateStepDto) {
    const { badResponseMessage, ...stepData } = updateData

    return this.prismaService.step.update({
      where: { id },
      data: {
        ...stepData,
        stepBadResponseMessage: {
          deleteMany: {}, // Supprime les anciens messages
          create: badResponseMessage || [], // Crée les nouveaux
        },
      },
    })
  }

  remove(id: number) {
    return this.prismaService.step.delete({ where: { id } })
  }
}
