import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator'

export class CreateDriverLicenseInfoDto {
  @IsNotEmpty()
  @IsString()
  number: string

  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(3)
  countryCode: string

  @IsNotEmpty()
  @IsDateString()
  expiryDate: string

  @IsNotEmpty()
  @IsDateString()
  deliveryDate: string

  @IsNotEmpty()
  @IsNumber()
  idDriverPersInfo: number
}
