import { StepBadResponseMessageErrorType } from '@prisma/client'
import { IsEnum, IsNotEmpty, IsString } from 'class-validator'

export class StepBadResponseMessageDto {
  @IsNotEmpty()
  @IsString()
  message: string

  @IsNotEmpty()
  @IsEnum(StepBadResponseMessageErrorType)
  errorType: StepBadResponseMessageErrorType
}
