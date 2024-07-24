import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator'

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

  @IsNotEmpty()
  @IsString()
  expectedResponseLength: number

  @IsOptional()
  @IsNumber()
  flowId?: number
}
