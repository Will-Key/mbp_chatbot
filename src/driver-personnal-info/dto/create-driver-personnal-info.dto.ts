import { CollectMethod } from '@prisma/client'
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator'

export class CreateDriverPersonalInfoDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  lastName: string

  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  firstName: string

  @IsNotEmpty()
  @IsString()
  @MinLength(13)
  phoneNumber: string

  @IsNotEmpty()
  @IsString()
  @MinLength(11)
  whaPhoneNumber: string

  @IsOptional()
  @IsString()
  address?: string

  @IsNotEmpty()
  @IsEnum(CollectMethod)
  collectMethod: CollectMethod

  @IsNotEmpty()
  @IsString()
  licenseNumber: string

  @IsOptional()
  @IsString()
  yangoProfileId?: string
}
