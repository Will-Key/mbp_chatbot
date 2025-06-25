import { IsDateString, IsNotEmpty, IsString } from 'class-validator'

export class CreateOtpVerification {
  @IsNotEmpty()
  @IsString()
  phoneNumber: string

  @IsNotEmpty()
  @IsString()
  otpCode: string

  @IsNotEmpty()
  @IsDateString()
  expiresAt: Date
}
