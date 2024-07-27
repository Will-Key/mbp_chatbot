import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator'

export class CreateConversationDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(11)
  whaPhoneNumber: string

  @IsNotEmpty()
  @IsString()
  message: string

  @IsNotEmpty()
  @IsNumber()
  stepId: number

  @IsOptional()
  @IsNumber()
  badResponseCount?: number
}
