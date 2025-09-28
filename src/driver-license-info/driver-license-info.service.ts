import { Injectable } from '@nestjs/common'
import { subMinutes } from 'date-fns'
import { PrismaService } from 'prisma/prisma.service'
import { CreateDriverLicenseInfoDto } from './dto/create-driver-license-info.dto'
import { UpdateDriverLicenseInfoDto } from './dto/update-driver-license-info.dto'

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

  findLicenseInfoByPhoneNumber(phoneNumber: string) {
    return this.prismaService.driverLicenseInfo.findUnique({
      where: { driverPhoneNumber: phoneNumber },
    })
  }

  update(id: number, updateDriverLicenseInfoDto: UpdateDriverLicenseInfoDto) {
    return this.prismaService.driverLicenseInfo.update({
      data: updateDriverLicenseInfoDto,
      where: { id },
    })
  }

  updatePhoneNumber(previousPhoneNumber: string, currentPhoneNumber: string) {
    return this.prismaService.driverLicenseInfo.update({
      data: {
        driverPhoneNumber: currentPhoneNumber,
      },
      where: { driverPhoneNumber: previousPhoneNumber },
    })
  }

  remove(id: number) {
    return this.prismaService.driverLicenseInfo.delete({
      where: { id },
    })
  }

  deleteByDriverId(idDriver: number) {
    return this.prismaService.driverLicenseInfo.deleteMany({
      where: { idDriverPersInfo: idDriver },
    })
  }

  deleteByPhoneNumber(driverPhoneNumber: string) {
    return this.prismaService.driverLicenseInfo.delete({
      where: {
        driverPhoneNumber,
        createdAt: {
          gt: subMinutes(new Date(), 5),
        },
      },
    })
  }
}
