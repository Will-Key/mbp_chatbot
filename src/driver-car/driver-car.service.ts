import { Injectable } from '@nestjs/common'
import { PrismaService } from 'prisma/prisma.service'
import { CreateDriverCarDto } from './dto/create-driver-car.dto'
import { UpdateDriverCarDto } from './dto/update-driver-car.dto'

@Injectable()
export class DriverCarService {
  constructor(private readonly prismaService: PrismaService) {}

  create(createDriverCarDto: CreateDriverCarDto) {
    return this.prismaService.driverCar.create({
      data: createDriverCarDto,
    })
  }

  findAll() {
    return this.prismaService.driverCar.findMany()
  }

  findOne(id: number) {
    return this.prismaService.driverCar.findUnique({ where: { id } })
  }

  findOneByDriverId(idDriver: number) {
    return this.prismaService.driverCar.findFirst({
      where: { idDriver },
    })
  }

  update(idDriver: number, updateDriverCarDto: UpdateDriverCarDto) {
    return this.prismaService.driverCar.update({
      data: updateDriverCarDto,
      where: { idDriver },
    })
  }

  remove(id: number) {
    return this.prismaService.driverCar.delete({ where: { id } })
  }

  deleteByDriverId(idDriver: number) {
    return this.prismaService.driverCar.delete({ where: { idDriver } })
  }
}
