import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { RequestLogService } from "src/request-log/request-log.service";
import { CreateYangoProfileDto } from "./dto/create-yango-profile.dto";
import { lastValueFrom } from "rxjs";
import { v4 as uuidv4 } from "uuid"
import { DriverPersonalInfoService } from "../driver-personal-info/driver-personal-info.service";
import { CarInfoService } from "../car-info/car-info.service";

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

    async createProfile(payload: CreateYangoProfileDto) {
        const profileId = uuidv4()
        const driver = this.driverPersonnalInforService.findDriverPersonnalInfoByYangoProfileID(profileId)
        if (driver) {
            return {
                status: 400,
                message: "Conducteur existe"
            }
        }
        return {
            status: 200,
            message: "Profil créé"
        }
        return await lastValueFrom(
            this.httpService
                .post(`${process.env.YANGO_API_URL}/${this.PROFILE_CREATION_PATH}`, payload, {
                    headers: {
                        Authorization: `Bearer ${process.env.WHAPI_TOKEN}`,
                        accept: 'application/json',
                        'content-type': 'application/json',
                    },
                    timeout: 15000,
                })
        )
    }

    async createCar(payload: unknown) {
        const carId = uuidv4()
        const car = this.carInfoService.findCarInfoByYangoCarId(carId)
        if (car) {
            return {
                status: 400,
                message: "Car existe"
            }
        }
        return {
            status: 200,
            message: "Car créé"
        }
        return await lastValueFrom(
            this.httpService
                .post(`${process.env.YANGO_API_URL}/${this.PROFILE_CREATION_PATH}`, payload, {
                    headers: {
                        Authorization: `Bearer ${process.env.WHAPI_TOKEN}`,
                        accept: 'application/json',
                        'content-type': 'application/json',
                    },
                    timeout: 15000,
                })
        )
    }
}