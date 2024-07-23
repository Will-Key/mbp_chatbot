import { IsNotEmpty, IsNumber } from 'class-validator'

export class CreateDriverCarDto {
  @IsNotEmpty()
  @IsNumber()
  idDriver: number

  @IsNotEmpty()
  @IsNumber()
  idCar: number
}
