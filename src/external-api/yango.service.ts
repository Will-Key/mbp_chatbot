import { HttpService } from "@nestjs/axios"
import { Injectable } from "@nestjs/common"
import { RequestLogService } from "src/request-log/request-log.service"
import { v4 as uuidv4 } from "uuid"
import { CarInfoService } from "../car-info/car-info.service"
import { DriverPersonalInfoService } from "../driver-personal-info/driver-personal-info.service"
import { CreateYangoCarDto } from "./dto/create-yango-car.dto"
import { CreateYangoProfileDto } from "./dto/create-yango-profile.dto"

@Injectable()
export class YangoService {
    PROFILE_CREATION_PATH = "contractors/driver-profile"
    CAR_CREATION_PATH = "vehicles/car"

    constructor(
        private readonly httpService: HttpService,
        private readonly requestLogService: RequestLogService,
        private readonly driverPersonnalInforService: DriverPersonalInfoService,
        private readonly carInfoService: CarInfoService
    ) { }

    async createProfile(_payload: CreateYangoProfileDto): Promise<{ status: number, contractor_profile_id: string }> {
        const profileId = uuidv4()
        const driver = await this.driverPersonnalInforService.findDriverPersonnalInfoByYangoProfileID(profileId)
        if (driver) {
            return {
                status: 400,
                contractor_profile_id: null
            }
        }
        return {
            status: 200,
            contractor_profile_id: profileId
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

    async createCar(_payload: CreateYangoCarDto): Promise<{ status: number, vehicle_id: string; }> {
        const carId = uuidv4()
        const car = await this.carInfoService.findCarInfoByYangoCarId(carId)
        if (car) {
            return {
                status: 400,
                vehicle_id: null
            }
        }
        return {
            status: 200,
            vehicle_id: carId
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
}