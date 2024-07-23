import {
  //Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common'
import { CarInfoService } from './car-info.service'
import { CreateCarInfoDto } from './dto/create-car-info.dto'
import { UpdateCarInfoDto } from './dto/update-car-info.dto'

//@Controller('car-info')
export class CarInfoController {
  constructor(private readonly carInfoService: CarInfoService) {}

  @Post()
  create(@Body() createCarInfoDto: CreateCarInfoDto) {
    return this.carInfoService.create(createCarInfoDto)
  }

  @Get()
  findAll() {
    return this.carInfoService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.carInfoService.findOne(+id)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCarInfoDto: UpdateCarInfoDto) {
    return this.carInfoService.update(+id, updateCarInfoDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.carInfoService.remove(+id)
  }
}
