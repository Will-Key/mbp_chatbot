import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { catchError, lastValueFrom, map } from 'rxjs'
import { SendMessageDto } from './dto/send-message.dto'
import { FileDto, GetMediaResponseDto } from './dto/get-media-response.dto'
import { RequestLogService } from '../request-log/request-log.service'

@Injectable()
export class WhapiService {
  private readonly logger = new Logger(WhapiService.name)

  constructor(
    private readonly httpService: HttpService,
    private readonly requestLogService: RequestLogService,
  ) { }

  async sendMessage(message: SendMessageDto) {
    await lastValueFrom(
      this.httpService
        .post(`${process.env.WHAPI_URL}/${process.env.WHAPI_SEND_MESSAGE_PATH}`, message, {
          headers: this.getHeaders,
          timeout: 15000,
        })
        .pipe(
          map(async (response) => {
            this.logger.log(`whapi response: `)
            await this.requestLogService.create({
              direction: 'OUT',
              status: 'SUCCESS',
              initiator: 'MBP',
              data: JSON.stringify(message),
              response: response.statusText,
            })
          }),
          catchError(async (err) => {
            this.logger.log(`whapi error:`, JSON.stringify(err))
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

  async getMedias(): Promise<FileDto[]> {
    return await lastValueFrom(
      this.httpService
        .get<GetMediaResponseDto>(`${process.env.WHAPI_URL}/${process.env.WHAPI_GET_IMAGE_PATH}`, {
          headers: this.getHeaders,
          timeout: 15000,
        })
        .pipe(
          map(async (response) => {
            this.logger.log(`whapi gey response: ${response}`)
            await this.requestLogService.create({
              direction: 'OUT',
              status: 'SUCCESS',
              initiator: 'MBP',
              data: '',
              response: response.statusText,
            })
            return response.data.files
          }),
          catchError(async (err) => {
            this.logger.log(`whapi get error: ${err}`)
            await this.requestLogService.create({
              direction: 'OUT',
              status: 'FAIL',
              initiator: 'MBP',
              data: '',
              response: JSON.stringify(err),
            })
            return []
          }),
        ),
    )
  }

  async deleteMessage(id: string) {
    await lastValueFrom(
      this.httpService
        .delete(`${process.env.WHAPI_URL}/messages/${id}`, {
          headers: this.getHeaders,
          timeout: 15000,
        })
        .pipe(
          map(async (response) => {
            this.logger.log(`whapi delete response: ${response}`)
            await this.requestLogService.create({
              direction: 'OUT',
              status: 'SUCCESS',
              initiator: 'MBP',
              data: '',
              response: response.statusText,
            })
          }),
          catchError(async (err) => {
            this.logger.log(`whapi get error: ${err}`)
            await this.requestLogService.create({
              direction: 'OUT',
              status: 'FAIL',
              initiator: 'MBP',
              data: '',
              response: JSON.stringify(err),
            })
          }),
        ),
    )
  }

  private get getHeaders() {
    return {
      Authorization: `Bearer ${process.env.WHAPI_TOKEN}`,
      accept: 'application/json',
      'content-type': 'application/json',
    }
  }
}
