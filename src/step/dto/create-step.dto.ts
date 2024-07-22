import { IsNotEmpty, IsNumber, IsString } from 'class-validator'

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

  @IsNotEmpty()
  @IsNumber()
  flowId: number
}
