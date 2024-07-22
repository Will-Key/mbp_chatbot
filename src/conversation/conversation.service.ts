import { Injectable } from '@nestjs/common'
import { CreateConversationDto } from './dto/create-conversation.dto'
import { UpdateConversationDto } from './dto/update-conversation.dto'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class ConversationService {
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

  update(id: number, updateConversationDto: UpdateConversationDto) {
    return this.prismaService.conversation.update({
      data: updateConversationDto,
      where: { id },
    })
  }

  remove(id: number) {
    return this.prismaService.conversation.delete({ where: { id } })
  }
}
