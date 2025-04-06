import { Injectable } from '@nestjs/common'
import { CreateDriverPersonalInfoDto } from './dto/create-driver-Personal-info.dto'
import { UpdateDriverPersonalInfoDto } from './dto/update-driver-Personal-info.dto'
import { PrismaService } from 'prisma/prisma.service'

@Injectable()
export class DriverPersonalInfoService {
  constructor(private readonly prismaService: PrismaService) { }

  create(createDriverPersonalInfoDto: CreateDriverPersonalInfoDto) {
    return this.prismaService.driverPersonalInfo.create({
      data: createDriverPersonalInfoDto,
    })
  }

  findAll() {
    return this.prismaService.driverPersonalInfo.findMany()
  }

  findOne(id: number) {
    return this.prismaService.driverPersonalInfo.findUnique({ where: { id } })
  }

  findDriverPersonalInfoByPhoneNumber(phoneNumber: string) {
    return this.prismaService.driverPersonalInfo.findUnique({
      where: { phoneNumber },
    })
  }

  update(
    id: number,
    updateDriverPersonalInfoDto: UpdateDriverPersonalInfoDto,
  ) {
    return this.prismaService.driverPersonalInfo.update({
      data: updateDriverPersonalInfoDto,
      where: { id },
    })
  }

  deleteByWhaPhoneNumber(whaPhoneNumber: string) {
    return this.prismaService.driverPersonalInfo.delete({
      where: { whaPhoneNumber }
    })
  }

  remove(id: number) {
    return this.prismaService.driverPersonalInfo.delete({ where: { id } })
  }
}
