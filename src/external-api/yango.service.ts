import { Injectable } from '@nestjs/common'
import { v4 as uuidv4 } from 'uuid'
import { CarInfoService } from '../car-info/car-info.service'
import { DriverPersonalInfoService } from '../driver-personal-info/driver-personal-info.service'
import { CreateYangoCarDto } from './dto/create-yango-car.dto'
import { CreateYangoProfileDto } from './dto/create-yango-profile.dto'

@Injectable()
export class YangoService {

  constructor(
    private readonly driverPersonnalInforService: DriverPersonalInfoService,
    private readonly carInfoService: CarInfoService,
  ) {}

  async createProfile(
    _payload: CreateYangoProfileDto,
  ): Promise<{ status: number; contractor_profile_id: string }> {
    const profileId = uuidv4()
    const driver =
      await this.driverPersonnalInforService.findDriverPersonnalInfoByYangoProfileID(
        profileId,
      )
    if (driver) {
      return {
        status: 400,
        contractor_profile_id: null,
      }
    }
    return {
      status: 200,
      contractor_profile_id: profileId,
    }
    // return await lastValueFrom(
    //     this.httpService
    //         .post(`${process.env.YANGO_API_URL}/${this.PROFILE_CREATION_PATH}`, payload, {
    //             headers: {
    //                 Authorization: `Bearer ${process.env.WHAPI_TOKEN}`,
    //                 accept: 'application/json',
    //                 'content-type': 'application/json',
    //             },
    //             timeout: 15000,
    //         })
    // )
  }

  async createCar(
    _payload: CreateYangoCarDto,
  ): Promise<{ status: number; vehicle_id: string }> {
    const carId = uuidv4()
    const car = await this.carInfoService.findCarInfoByYangoCarId(carId)
    if (car) {
      return {
        status: 400,
        vehicle_id: null,
      }
    }
    return {
      status: 200,
      vehicle_id: carId,
    }
    // return await lastValueFrom(
    //     this.httpService
    //         .post(`${process.env.YANGO_API_URL}/${this.PROFILE_CREATION_PATH}`, payload, {
    //             headers: {
    //                 Authorization: `Bearer ${process.env.WHAPI_TOKEN}`,
    //                 accept: 'application/json',
    //                 'content-type': 'application/json',
    //             },
    //             timeout: 15000,
    //         })
    // )
  }

  async getDriverProfile(contractor_profile_id: string) {
    console.log(contractor_profile_id)
    return 200
    // return await lastValueFrom(
    //   this.httpService.post(
    //     `${process.env.YANGO_API_URL}/${this.GET_DRIVER_PROFILE}/${contractor_profile_id}`,
    //     {
    //       headers: {
    //         Authorization: `Bearer ${process.env.WHAPI_TOKEN}`,
    //         accept: 'application/json',
    //         'content-type': 'application/json',
    //       },
    //       timeout: 15000,
    //     },
    //   ),
    // )
  }

  async updateDriverPhone() {
    return 200
  }
}
