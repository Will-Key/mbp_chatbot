import { CarStatus } from '@prisma/client'
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class CreateCarInfoDto {
  @IsNotEmpty()
  @IsString()
  brand: string

  @IsNotEmpty()
  @IsString()
  color: string

  @IsNotEmpty()
  @IsString()
  year: string

  @IsNotEmpty()
  @IsString()
  plateNumber: string

  @IsNotEmpty()
  @IsEnum(CarStatus)
  status: CarStatus

  @IsNotEmpty()
  @IsString()
  code: string

  @IsNotEmpty()
  @IsString()
  model: string

  @IsOptional()
  @IsString()
  driverPhoneNumber?: string

  @IsString()
  yangoCarId?: string
}
