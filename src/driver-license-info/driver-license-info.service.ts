import { Injectable } from '@nestjs/common'
import { CreateDriverLicenseInfoDto } from './dto/create-driver-license-info.dto'
import { UpdateDriverLicenseInfoDto } from './dto/update-driver-license-info.dto'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class DriverLicenseInfoService {
  constructor(private readonly prismaService: PrismaService) {}

  create(createDriverLicenseInfoDto: CreateDriverLicenseInfoDto) {
    return this.prismaService.driverLicenseInfo.create({
      data: createDriverLicenseInfoDto,
    })
  }

  findAll() {
    return this.prismaService.driverLicenseInfo.findMany()
  }

  findOne(id: number) {
    return this.prismaService.driverLicenseInfo.findUnique({ where: { id } })
  }

  update(id: number, updateDriverLicenseInfoDto: UpdateDriverLicenseInfoDto) {
    return this.prismaService.driverLicenseInfo.update({
      data: updateDriverLicenseInfoDto,
      where: { id },
    })
  }

  remove(id: number) {
    return this.prismaService.driverLicenseInfo.delete({
      where: { id },
    })
  }
}
