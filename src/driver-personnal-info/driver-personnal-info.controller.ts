import {
  //Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common'
import { DriverPersonnalInfoService } from './driver-personnal-info.service'
import { CreateDriverPersonnalInfoDto } from './dto/create-driver-personnal-info.dto'
import { UpdateDriverPersonnalInfoDto } from './dto/update-driver-personnal-info.dto'

//@Controller('driver-personnal-info')
export class DriverPersonnalInfoController {
  constructor(
    private readonly driverPersonnalInfoService: DriverPersonnalInfoService,
  ) {}

  @Post()
  create(@Body() createDriverPersonnalInfoDto: CreateDriverPersonnalInfoDto) {
    return this.driverPersonnalInfoService.create(createDriverPersonnalInfoDto)
  }

  @Get()
  findAll() {
    return this.driverPersonnalInfoService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.driverPersonnalInfoService.findOne(+id)
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDriverPersonnalInfoDto: UpdateDriverPersonnalInfoDto,
  ) {
    return this.driverPersonnalInfoService.update(
      +id,
      updateDriverPersonnalInfoDto,
    )
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.driverPersonnalInfoService.remove(+id)
  }
}
