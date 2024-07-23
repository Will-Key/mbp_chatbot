import { Injectable } from '@nestjs/common';
import { CreateDriverLicenseInfoDto } from './dto/create-driver-license-info.dto';
import { UpdateDriverLicenseInfoDto } from './dto/update-driver-license-info.dto';

@Injectable()
export class DriverLicenseInfoService {
  create(createDriverLicenseInfoDto: CreateDriverLicenseInfoDto) {
    return 'This action adds a new driverLicenseInfo';
  }

  findAll() {
    return `This action returns all driverLicenseInfo`;
  }

  findOne(id: number) {
    return `This action returns a #${id} driverLicenseInfo`;
  }

  update(id: number, updateDriverLicenseInfoDto: UpdateDriverLicenseInfoDto) {
    return `This action updates a #${id} driverLicenseInfo`;
  }

  remove(id: number) {
    return `This action removes a #${id} driverLicenseInfo`;
  }
}
