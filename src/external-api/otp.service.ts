import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { randomInt } from 'crypto'
import { addMinutes, isAfter } from 'date-fns'
import { catchError, lastValueFrom, map } from 'rxjs'
import { OtpVerificationService } from '../otp-verification/otp-verification.service'
import { RequestLogService } from '../request-log/request-log.service'

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name)
  private readonly smsApiKey: string
  private readonly smsApiUrl: string
  private readonly smsApiSender: string

  constructor(
    private readonly httpService: HttpService,
    private readonly otpVerificationService: OtpVerificationService,
    private readonly requestLogService: RequestLogService,
  ) {
    this.smsApiKey = process.env.SMS_API_KEY
    this.smsApiUrl = process.env.SMS_API_URL
    this.smsApiSender = process.env.SMS_API_SENDER
  }

  async generateAndSendOtp(phoneNumber: string): Promise<string> {
    const otp = randomInt(100000, 999999).toString()

    await this.otpVerificationService.create({
      phoneNumber,
      otpCode: otp,
      expiresAt: addMinutes(new Date(), 2),
    })

    try {
      await this.sendSms(
        phoneNumber,
        `Votre code de verification MbpGroup est: ${otp}. Il expire dans 2 minutes.`,
      )
      return 'OTP envoyé avec succès'
    } catch (error) {
      this.logger.error(`Erreur lors de l'envoi du SMS: ${error.message}`)
      throw new Error("Impossible d'envoyer le SMS")
    }
  }

  async verifyOtp(phoneNumber: string, _otpCode: string): Promise<string> {
    const otpRecord = await this.otpVerificationService.findLast({
      phoneNumber,
    })
    if (!otpRecord) {
      return 'OTP_NOT_FOUND'
    }

    if (otpRecord.otpCode !== _otpCode) return 'OTP_INVALID'

    if (this.isExpired(otpRecord.expiresAt)) return 'OTP_EXPIRED'

    await this.otpVerificationService.setOtpToUsed(otpRecord.id)

    return 'OTP_FOUND'
  }

  private async sendSms(phoneNumber: string, content: string): Promise<void> {
    try {
      await lastValueFrom(
        this.httpService
          .get(this.smsApiUrl, {
            params: {
              token: this.smsApiKey,
              from: this.smsApiSender,
              to: phoneNumber,
              content: content,
            },
          })
          .pipe(
            map(async (response) => {
              await this.requestLogService.create({
                direction: 'OUT',
                status: 'SUCCESS',
                initiator: 'OTP',
                data: JSON.stringify({ phoneNumber, content }),
                response: JSON.stringify(response),
              })
            }),
            catchError(async (error) => {
              await this.requestLogService.create({
                direction: 'OUT',
                status: 'FAIL',
                initiator: 'OTP',
                data: JSON.stringify({ phoneNumber, content }),
                response: JSON.stringify(error),
              })
              throw error
            }),
          ),
      )
    } catch (error) {
      console.log(error)
      this.logger.error(`Erreur lors de l'envoi du SMS: ${error.message}`)
      throw error
    }
  }

  private isExpired(expiresAt: Date) {
    return isAfter(new Date(), expiresAt)
  }
}
