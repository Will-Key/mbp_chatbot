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
  private readonly whapiUrl: string
  private readonly whapiOtpToken: string

  constructor(
    private readonly httpService: HttpService,
    private readonly otpVerificationService: OtpVerificationService,
    private readonly requestLogService: RequestLogService,
  ) {
    this.smsApiKey = process.env.SMS_API_KEY
    this.smsApiUrl = process.env.SMS_API_URL
    this.smsApiSender = process.env.SMS_API_SENDER
    this.whapiUrl = process.env.WHAPI_URL
    this.whapiOtpToken = process.env.WHAPI_OTP_TOKEN
  }

  async generateAndSendOtp(phoneNumber: string): Promise<string> {
    const otp = randomInt(100000, 999999).toString()

    await this.otpVerificationService.create({
      phoneNumber,
      otpCode: otp,
      expiresAt: addMinutes(new Date(), 3),
    })

    const content = `Votre code de verification MbpGroup est: ${otp}. Il expire dans 2 minutes.`

    const [smsResult, whatsappResult] = await Promise.allSettled([
      this.sendSms(phoneNumber, content),
      this.sendWhatsAppMessage(phoneNumber, content),
    ])

    if (smsResult.status === 'rejected')
      this.logger.error(
        `Erreur lors de l'envoi du SMS: ${smsResult.reason?.message}`,
      )

    if (whatsappResult.status === 'rejected')
      this.logger.error(
        `Erreur lors de l'envoi du message WhatsApp: ${whatsappResult.reason?.message}`,
      )

    if (smsResult.status === 'rejected' && whatsappResult.status === 'rejected')
      throw new Error("Impossible d'envoyer le code OTP")

    return 'OTP envoyé avec succès'
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
            timeout: 50000,
          })
          .pipe(
            map(async (response) => {
              await this.requestLogService.create({
                direction: 'OUT',
                status: 'SUCCESS',
                initiator: 'OTP',
                data: JSON.stringify({ phoneNumber, content }),
                response: `${response}`,
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

  private async sendWhatsAppMessage(
    phoneNumber: string,
    content: string,
  ): Promise<void> {
    const whaPhoneNumber = phoneNumber.slice(0, 3) + phoneNumber.slice(5)
    const message = {
      to: `${whaPhoneNumber}@s.whatsapp.net`,
      body: content,
      typing_time: 0,
    }

    try {
      await lastValueFrom(
        this.httpService
          .post(this.whapiUrl, message, {
            headers: {
              Authorization: `Bearer ${this.whapiOtpToken}`,
              accept: 'application/json',
              'content-type': 'application/json',
            },
            timeout: 15000,
          })
          .pipe(
            map(async (response) => {
              await this.requestLogService.create({
                direction: 'OUT',
                status: 'SUCCESS',
                initiator: 'OTP',
                data: JSON.stringify(message),
                response: response.statusText,
              })
            }),
            catchError(async (error) => {
              await this.requestLogService.create({
                direction: 'OUT',
                status: 'FAIL',
                initiator: 'OTP',
                data: JSON.stringify(message),
                response: JSON.stringify(error),
              })
              throw error
            }),
          ),
      )
    } catch (error) {
      this.logger.error(
        `Erreur lors de l'envoi du message WhatsApp: ${error.message}`,
      )
      throw error
    }
  }

  private isExpired(expiresAt: Date) {
    return isAfter(new Date(), expiresAt)
  }
}
