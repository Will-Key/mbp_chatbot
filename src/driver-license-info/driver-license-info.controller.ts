import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common'
import { DriverLicenseInfoService } from './driver-license-info.service'
import { CreateDriverLicenseInfoDto } from './dto/create-driver-license-info.dto'
import { UpdateDriverLicenseInfoDto } from './dto/update-driver-license-info.dto'

@Controller('driver-license-info')
export class DriverLicenseInfoController {
  constructor(
    private readonly driverLicenseInfoService: DriverLicenseInfoService,
  ) {}

  @Post()
  create(@Body() createDriverLicenseInfoDto: CreateDriverLicenseInfoDto) {
    return this.driverLicenseInfoService.create(createDriverLicenseInfoDto)
  }

  @Get()
  findAll() {
    return this.driverLicenseInfoService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.driverLicenseInfoService.findOne(+id)
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDriverLicenseInfoDto: UpdateDriverLicenseInfoDto,
  ) {
    return this.driverLicenseInfoService.update(+id, updateDriverLicenseInfoDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.driverLicenseInfoService.remove(+id)
  }
}
