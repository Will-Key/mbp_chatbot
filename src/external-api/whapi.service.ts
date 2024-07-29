import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { catchError, lastValueFrom, map } from 'rxjs'
import { SendMessageDto } from '../rabbitmq/dto/send-message.dto'
import { RequestLogService } from '../request-log/request-log.service'
import { CreateRequestLogDto } from 'src/request-log/dto/create-request-log.dto'

@Injectable()
export class WhapiService {
  private readonly logger = new Logger(WhapiService.name)

  constructor(
    private readonly httpService: HttpService,
    private readonly requestLogService: RequestLogService,
  ) {}

  async sendMessage(message: SendMessageDto) {
    this.logger.log(`sent message to whapiService: ${JSON.stringify(message)}`)
    this.logger.log(`whapi url: ${process.env.WHAPI_URL}`)
    this.logger.log(`whapi token: ${process.env.WHAPI_TOKEN}`)
    await lastValueFrom(
      this.httpService
        .post(process.env.WHAPI_URL, message, {
          headers: {
            Authorization: `Bearer ${process.env.WHAPI_TOKEN}`,
            accept: 'application/json',
            'content-type': 'application/json',
          },
        })
        .pipe(
          map(async (response) => {
            this.logger.log(`whapi response: ${response}`)
            await this.logRequest({
              direction: 'OUT',
              status: 'SUCCESS',
              initiator: 'MBP',
              data: JSON.stringify(message),
              response: JSON.stringify(response),
            })
          }),
          catchError(async (err) => {
            this.logger.log(`whapi error: ${err}`)
            await this.logRequest({
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

  private async logRequest(dto: CreateRequestLogDto) {
    const log: CreateRequestLogDto = {
      direction: dto.direction,
      status: dto.status,
      initiator: dto.initiator,
      data: dto.data,
      response: dto.response,
    }
    await this.requestLogService.create(log)
  }
}