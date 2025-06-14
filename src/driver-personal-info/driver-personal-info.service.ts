import { Injectable } from '@nestjs/common'
import { CreateDriverPersonalInfoDto } from './dto/create-driver-personal-info.dto'
import { UpdateDriverPersonalInfoDto } from './dto/update-driver-personal-info.dto'
import { PrismaService } from 'prisma/prisma.service'

@Injectable()
export class DriverPersonalInfoService {
  constructor(private readonly prismaService: PrismaService) { }

  create(createDriverPersonalInfoDto: CreateDriverPersonalInfoDto) {
    return this.prismaService.driverPersonnalInfo.create({
      data: createDriverPersonalInfoDto,
    })
  }

  findAll() {
    return this.prismaService.driverPersonnalInfo.findMany()
  }

  findOne(id: number) {
    return this.prismaService.driverPersonnalInfo.findUnique({ where: { id } })
  }

  findDriverPersonalInfoByPhoneNumber(phoneNumber: string) {
    return this.prismaService.driverPersonnalInfo.findUnique({
      where: { phoneNumber },
    })
  }

  findDriverPersonnalInfoByYangoProfileID(yangoProfileId: string) {
    return this.prismaService.driverPersonnalInfo.findUnique({
      where: {
        yangoProfileId
      }
    })
  }

  update(
    id: number,
    updateDriverPersonalInfoDto: UpdateDriverPersonalInfoDto,
  ) {
    return this.prismaService.driverPersonnalInfo.update({
      data: updateDriverPersonalInfoDto,
      where: { id },
    })
  }

  deleteByWhaPhoneNumber(whaPhoneNumber: string) {
    return this.prismaService.driverPersonnalInfo.delete({
      where: { whaPhoneNumber }
    })
  }

  remove(id: number) {
    return this.prismaService.driverPersonnalInfo.delete({ where: { id } })
  }
}
