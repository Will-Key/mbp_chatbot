import { PartialType } from '@nestjs/mapped-types'
import { CreateDriverCarDto } from './create-driver-car.dto'

export class UpdateDriverCarDto extends PartialType(CreateDriverCarDto) {
  endDate?: string
}
