import { Injectable } from '@nestjs/common'
import { CreateDriverPersonnalInfoDto } from './dto/create-driver-personnal-info.dto'
import { UpdateDriverPersonnalInfoDto } from './dto/update-driver-personnal-info.dto'
import { PrismaService } from 'prisma/prisma.service'

@Injectable()
export class DriverPersonnalInfoService {
  constructor(private readonly prismaService: PrismaService) { }

  create(createDriverPersonnalInfoDto: CreateDriverPersonnalInfoDto) {
    return this.prismaService.driverPersonnalInfo.create({
      data: createDriverPersonnalInfoDto,
    })
  }

  findAll() {
    return this.prismaService.driverPersonnalInfo.findMany()
  }

  findOne(id: number) {
    return this.prismaService.driverPersonnalInfo.findUnique({ where: { id } })
  }

  findDriverPersonnalInfoByPhoneNumber(phoneNumber: string) {
    return this.prismaService.driverPersonnalInfo.findUnique({
      where: { phoneNumber },
    })
  }

  update(
    id: number,
    updateDriverPersonnalInfoDto: UpdateDriverPersonnalInfoDto,
  ) {
    return this.prismaService.driverPersonnalInfo.update({
      data: updateDriverPersonnalInfoDto,
      where: { id },
    })
  }

  remove(id: number) {
    return this.prismaService.driverPersonnalInfo.delete({ where: { id } })
  }
}
