import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { RequestLogService } from "src/request-log/request-log.service";
import { CreateYangoProfileDto } from "./dto/create-yango-profile.dto";
import { lastValueFrom } from "rxjs";

@Injectable()
export class YangoService {
    PROFILE_CREATION_PATH = "contractors/driver-profile"
    CAR_CREATION_PATH = "vehicles/car"

    constructor(
        private readonly httpService: HttpService,
        private readonly requestLogService: RequestLogService,
    ) { }

    async createProfile(payload: CreateYangoProfileDto) {
        return 1
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
        return 1
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