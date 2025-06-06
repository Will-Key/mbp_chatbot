import { Injectable } from '@nestjs/common'
import { CreateCarInfoDto } from './dto/create-car-info.dto'
import { UpdateCarInfoDto } from './dto/update-car-info.dto'
import { PrismaService } from 'prisma/prisma.service'

@Injectable()
export class CarInfoService {
  constructor(private readonly prismaService: PrismaService) { }

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
    return this.prismaService.carInfo.findUnique({
      where: { driverPhoneNumber }
    })
  }

  findCarInfoByYangoCarId(yangoCarId: string) {
    return this.prismaService.carInfo.findUnique({
      where: { yangoCarId }
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
}
