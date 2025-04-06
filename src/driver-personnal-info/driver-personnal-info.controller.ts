import {
  //Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common'
import { DriverPersonalInfoService } from './driver-Personal-info.service'
import { CreateDriverPersonalInfoDto } from './dto/create-driver-Personal-info.dto'
import { UpdateDriverPersonalInfoDto } from './dto/update-driver-Personal-info.dto'

//@Controller('driver-Personal-info')
export class DriverPersonalInfoController {
  constructor(
    private readonly driverPersonalInfoService: DriverPersonalInfoService,
  ) {}

  @Post()
  create(@Body() createDriverPersonalInfoDto: CreateDriverPersonalInfoDto) {
    return this.driverPersonalInfoService.create(createDriverPersonalInfoDto)
  }

  @Get()
  findAll() {
    return this.driverPersonalInfoService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.driverPersonalInfoService.findOne(+id)
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDriverPersonalInfoDto: UpdateDriverPersonalInfoDto,
  ) {
    return this.driverPersonalInfoService.update(
      +id,
      updateDriverPersonalInfoDto,
    )
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.driverPersonalInfoService.remove(+id)
  }
}
