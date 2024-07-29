import { HttpService } from '@nestjs/axios'
import { Injectable } from '@nestjs/common'
import { catchError, lastValueFrom, map } from 'rxjs'
import { SendMessageDto } from '../rabbitmq/dto/send-message.dto'
import { RequestLogService } from '../request-log/request-log.service'
import { CreateRequestLogDto } from 'src/request-log/dto/create-request-log.dto'

@Injectable()
export class WhapiService {
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
        })
        .pipe(
          map((response) =>
            this.logRequest({
              direction: 'OUT',
              status: 'SUCCESS',
              initiator: 'MBP',
              data: JSON.stringify(message),
              response: JSON.stringify(response),
            }),
          ),
          catchError((err) =>
            this.logRequest({
              direction: 'OUT',
              status: 'SUCCESS',
              initiator: 'MBP',
              data: JSON.stringify(message),
              response: JSON.stringify(err),
            }),
          ),
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
    this.requestLogService.create(log)
  }
}
