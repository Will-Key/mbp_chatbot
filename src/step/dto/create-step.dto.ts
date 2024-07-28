import { StepExpectedResponseType } from '@prisma/client'
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator'

export class CreateStepDto {
  @IsNotEmpty()
  @IsNumber()
  level: number

  @IsNotEmpty()
  @IsString()
  message: string

  @IsNotEmpty()
  @IsString()
  expectedResponse: string

  @IsOptional()
  @IsEnum(StepExpectedResponseType)
  expectedResponseType?: StepExpectedResponseType

  @IsNotEmpty()
  @IsString()
  expectedResponseLength: number

  @IsOptional()
  @IsNumber()
  flowId?: number | null
}
