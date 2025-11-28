import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { catchError, lastValueFrom, map } from 'rxjs'
import { RequestLogService } from '../request-log/request-log.service'
import { SendImageMessageDto, SendMessageDto } from './dto/send-message.dto'

@Injectable()
export class WhapiService {
  private readonly logger = new Logger(WhapiService.name)

  constructor(
    private readonly httpService: HttpService,
    private readonly requestLogService: RequestLogService,
  ) {}

  async sendMessage(message: SendMessageDto) {
    await lastValueFrom(
      this.httpService
        .post(process.env.WHAPI_URL, message, {
          headers: {
            Authorization: `Bearer ${process.env.WHAPI_TOKEN}`,
            accept: 'application/json',
            'content-type': 'application/json',
          },
          timeout: 15000,
        })
        .pipe(
          map(async (response) => {
            this.logger.log(`whapi response: ${response}`)
            await this.requestLogService.create({
              direction: 'OUT',
              status: 'SUCCESS',
              initiator: 'MBP',
              data: JSON.stringify(message),
              response: response.statusText,
            })
          }),
          catchError(async (err) => {
            this.logger.log(`whapi error: ${err}`)
            await this.requestLogService.create({
              direction: 'OUT',
              status: 'FAIL',
              initiator: 'MBP',
              data: JSON.stringify(message),
              response: JSON.stringify(err),
            })
          }),
        ),
    )
  }

  async sendImageMessage(message: SendImageMessageDto) {
    await lastValueFrom(
      this.httpService
        .post(process.env.WHAPI_IMAGE_URL, message, {
          headers: {
            Authorization: `Bearer ${process.env.WHAPI_TOKEN}`,
            accept: 'application/json',
            'content-type': 'application/json',
          },
          timeout: 15000,
        })
        .pipe(
          map(async (response) => {
            this.logger.log(`whapi response: ${response}`)
            await this.requestLogService.create({
              direction: 'OUT',
              status: 'SUCCESS',
              initiator: 'MBP',
              data: JSON.stringify(message),
              response: response.statusText,
            })
          }),
          catchError(async (err) => {
            this.logger.log(`whapi error: ${err}`)
            await this.requestLogService.create({
              direction: 'OUT',
              status: 'FAIL',
              initiator: 'MBP',
              data: JSON.stringify(message),
              response: JSON.stringify(err),
            })
          }),
        ),
    )
  }
}
