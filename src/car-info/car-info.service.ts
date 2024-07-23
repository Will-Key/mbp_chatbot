import { Injectable } from '@nestjs/common';
import { CreateCarInfoDto } from './dto/create-car-info.dto';
import { UpdateCarInfoDto } from './dto/update-car-info.dto';

@Injectable()
export class CarInfoService {
  create(createCarInfoDto: CreateCarInfoDto) {
    return 'This action adds a new carInfo';
  }

  findAll() {
    return `This action returns all carInfo`;
  }

  findOne(id: number) {
    return `This action returns a #${id} carInfo`;
  }

  update(id: number, updateCarInfoDto: UpdateCarInfoDto) {
    return `This action updates a #${id} carInfo`;
  }

  remove(id: number) {
    return `This action removes a #${id} carInfo`;
  }
}
