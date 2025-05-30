import { StepExpectedResponseType } from '@prisma/client'
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'
import { StepBadResponseMessageDto } from '../../step-bad-response-message/dto/step-bad-response-message.dto'

export class CreateStepDto {
  @IsNotEmpty()
  @IsNumber()
  level: number

  @IsNotEmpty()
  @IsString()
  message: string

  @IsOptional()
  @IsString()
  expectedResponse?: string

  @IsOptional()
  @IsEnum(StepExpectedResponseType)
  expectedResponseType?: StepExpectedResponseType

  @IsArray()
  @ValidateNested({ each: true })
  badResponseMessage?: StepBadResponseMessageDto[]

  @IsOptional()
  @IsNumber()
  flowId?: number | null
}
