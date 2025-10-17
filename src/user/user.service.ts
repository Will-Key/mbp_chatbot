import { Injectable } from '@nestjs/common'
import { PrismaService } from 'prisma/prisma.service'
import { CreateUserDto } from './create-user.dto'

@Injectable()
export class UserService {
  constructor(private prismaService: PrismaService) {}

  create(data: CreateUserDto) {
    return this.prismaService.user.create({ data })
  }

  find(whaPhoneNumber: string) {
    return this.prismaService.user.findUnique({ where: { whaPhoneNumber } })
  }
}
