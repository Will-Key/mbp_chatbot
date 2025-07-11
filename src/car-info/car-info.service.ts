import { Injectable } from '@nestjs/common'
import { subMinutes } from 'date-fns'
import { PrismaService } from 'prisma/prisma.service'
import { CreateCarInfoDto } from './dto/create-car-info.dto'
import { UpdateCarInfoDto } from './dto/update-car-info.dto'

@Injectable()
export class CarInfoService {
  constructor(private readonly prismaService: PrismaService) {}

  create(createCarInfoDto: CreateCarInfoDto) {
    return this.prismaService.carInfo.create({
      data: createCarInfoDto,
    })
  }

  findAll() {
    return this.prismaService.carInfo.findMany()
  }

  findOne(id: number) {
    return this.prismaService.carInfo.findUnique({ where: { id } })
  }

  findCarInfoByDriverPhoneNumber(driverPhoneNumber: string) {
    return this.prismaService.carInfo.findFirst({
      where: { driverPhoneNumber },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  findCarInfoByYangoCarId(yangoCarId: string) {
    return this.prismaService.carInfo.findUnique({
      where: { yangoCarId },
    })
  }

  update(id: number, updateCarInfoDto: UpdateCarInfoDto) {
    return this.prismaService.carInfo.update({
      data: updateCarInfoDto,
      where: { id },
    })
  }

  remove(id: number) {
    return this.prismaService.carInfo.delete({ where: { id } })
  }

  findRecentByPhoneNumver(driverPhoneNumber: string) {
    return this.prismaService.carInfo.findFirst({
      where: {
        driverPhoneNumber,
        createdAt: {
          gt: subMinutes(new Date(), 5),
        },
      },
    })
  }

  findByPlateNumberAndPhoneNumber(plateNumber: string, phoneNumber: string) {
    return this.prismaService.carInfo.findFirst({
      where: {
        plateNumber,
        driverPhoneNumber: phoneNumber,
      },
    })
  }

  findByPlateNumber(plateNumber: string) {
    return this.prismaService.carInfo.findFirst({
      where: { plateNumber },
    })
  }

  // deleteByPhoneNumber(driverPhoneNumber: string) {
  //   return this.prismaService.carInfo.delete({
  //     where: {
  //       driverPhoneNumber,
  //       createdAt: {
  //         gt: subMinutes(new Date(), 5)
  //       }
  //     }
  //   })
  // }
}
