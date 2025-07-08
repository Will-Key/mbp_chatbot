import { IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class VerifyOtpVerificationDto {
  @IsNotEmpty()
  @IsString()
  phoneNumber: string

  @IsOptional()
  @IsString()
  otpCode?: string
}
