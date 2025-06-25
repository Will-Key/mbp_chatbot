import { IsNotEmpty, IsString } from 'class-validator'

export class VerifyOtpVerificationDto {
  @IsNotEmpty()
  @IsString()
  phoneNumber: string

  @IsNotEmpty()
  @IsString()
  otpCode: string
}
