import { HttpService } from "@nestjs/axios";
import { Injectable, Logger } from "@nestjs/common";
import { randomInt } from "crypto";
import { lastValueFrom } from "rxjs";
import { OtpVerificationService } from "../otp-verification/otp-verification.service";
import { addMinutes, isAfter } from "date-fns";

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name)
  private readonly smsApiKey: string;
  private readonly smsApiUrl: string;
  private readonly smsApiSender: string;
  
  constructor(
    private readonly httpService: HttpService,
    private readonly otpVerificationService: OtpVerificationService
  ) {
    this.smsApiKey = process.env.SMS_API_KEY
    this.smsApiUrl = process.env.SMS_API_URL
    this.smsApiSender = process.env.SMS_API_SENDER
  }

  async generateAndSendOtp(phoneNumber: string): Promise<string> {
    const otp = randomInt(100000, 999999).toString();
    
    await this.otpVerificationService.create({
        phoneNumber,
        otpCode: otp,
        expiresAt: addMinutes(new Date(), 10)
    });
    
    try {
      await this.sendSms(phoneNumber, `Votre code de verification MbpGroup est: ${otp}. Il expire dans 10 minutes.`);
      return 'OTP envoyé avec succès';
    } catch (error) {
      this.logger.error(`Erreur lors de l'envoi du SMS: ${error.message}`);
      throw new Error('Impossible d\'envoyer le SMS');
    }
  }

  async verifyOtp(phoneNumber: string, otpCode: string): Promise<boolean> {
    const otpRecord = await this.otpVerificationService.findFirst({
      phoneNumber,
      otpCode,
    });

    if (!otpRecord) {
      return false;
    }

    if(isAfter(new Date(), otpRecord.expiresAt)) return false

    await this.otpVerificationService.update(
      otpRecord.id,
      true
    );

    return true;
  }

  private async sendSms(phoneNumber: string, content: string): Promise<void> {
    try {
      await lastValueFrom(
        this.httpService.get(this.smsApiUrl, {
          params: {
            token: this.smsApiKey,
            from: this.smsApiSender,
            to: `225${phoneNumber}`,
            content: content,
          },
        })
      );
    } catch (error) {
      console.log(error)
      this.logger.error(`Erreur lors de l'envoi du SMS: ${error.message}`);
      throw error;
    }
  }
  
}