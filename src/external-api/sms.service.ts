import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { RequestStatus } from '@prisma/client'
import { lastValueFrom } from 'rxjs'
import { RequestLogService } from '../request-log/request-log.service'

// Kept separate from OtpService on purpose: that service is being reworked on
// the OTP branch, and sharing its private sender would collide on merge.
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name)

  constructor(
    private readonly httpService: HttpService,
    private readonly requestLogService: RequestLogService,
  ) {}

  async send(phoneNumber: string, content: string): Promise<void> {
    try {
      const response = await lastValueFrom(
        this.httpService.get(process.env.SMS_API_URL, {
          params: {
            token: process.env.SMS_API_KEY,
            from: process.env.SMS_API_SENDER,
            to: phoneNumber,
            content,
          },
          timeout: 50000,
        }),
      )
      await this.requestLogService.create({
        direction: 'OUT',
        status: RequestStatus.SUCCESS,
        initiator: 'MBP',
        data: JSON.stringify({ phoneNumber, content }),
        response: response.statusText,
      })
    } catch (error) {
      this.logger.error(`Erreur lors de l'envoi du SMS: ${error.message}`)
      await this.requestLogService.create({
        direction: 'OUT',
        status: RequestStatus.FAIL,
        initiator: 'MBP',
        data: JSON.stringify({ phoneNumber, content }),
        response: JSON.stringify(error?.message ?? error),
      })
      throw error
    }
  }
}
