import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from 'prisma/prisma.service'
import { CreateConversationDto } from './dto/create-conversation.dto'
import { UpdateConversationDto } from './dto/update-conversation.dto'

@Injectable()
export class ConversationService {
  logger = new Logger()
  constructor(private readonly prismaService: PrismaService) {}

  create(createConversationDto: CreateConversationDto) {
    return this.prismaService.conversation.create({
      data: createConversationDto,
    })
  }

  findAll() {
    return this.prismaService.conversation.findMany()
  }

  findOne(id: number) {
    return this.prismaService.conversation.findUnique({ where: { id: id } })
  }

  findOneByStepIdAndWhaPhoneNumber(stepId: number, whaPhoneNumber: string) {
    return this.prismaService.conversation.findFirst({
      where: {
        stepId,
        whaPhoneNumber,
      },
    })
  }

  findOneByStepLevelAndWhaPhoneNumber(
    level: number,
    flowId: number,
    whaPhoneNumber: string,
  ) {
    return this.prismaService.conversation.findFirst({
      where: {
        step: {
          level,
          flowId,
        },
        whaPhoneNumber,
      },
    })
  }

  findManyByWhaPhoneNumber(whaPhoneNumber: string) {
    return this.prismaService.conversation.findMany({
      where: { whaPhoneNumber },
      orderBy: { id: 'desc' },
      include: {
        step: {
          select: {
            id: true,
            createdAt: true,
            updatedAt: true,
            level: true,
            message: true,
            expectedResponse: true,
            expectedResponseType: true,
            timeDelay: true,
            flowId: true,
            flow: true,
            stepBadResponseMessage: true,
          },
        },
      },
    })
  }

  update(id: number, updateConversationDto: UpdateConversationDto) {
    return this.prismaService.conversation.update({
      data: updateConversationDto,
      where: { id },
    })
  }

  remove(id: number) {
    return this.prismaService.conversation.delete({ where: { id } })
  }

  removeAllByPhoneNumber(whaPhoneNumber: string) {
    return this.prismaService.conversation.deleteMany({
      where: { whaPhoneNumber },
    })
  }

  getPhoneNumbers() {
    return this.prismaService.conversation.findMany({
      select: {
        whaPhoneNumber: true,
      },
      distinct: ['whaPhoneNumber'],
    })
  }

  findPhoneNumberLastConversation(whaPhoneNumber: string) {
    return this.prismaService.conversation.findFirst({
      where: { whaPhoneNumber },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }
}
