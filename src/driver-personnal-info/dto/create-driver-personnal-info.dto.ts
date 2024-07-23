import { CollectMethod } from '@prisma/client'
import { IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator'

export class CreateDriverPersonnalInfoDto {
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

  @IsNotEmpty()
  @IsString()
  address: string

  @IsNotEmpty()
  @IsEnum(CollectMethod)
  collectMethod: CollectMethod

  @IsString()
  yangoProfileId: string
}
