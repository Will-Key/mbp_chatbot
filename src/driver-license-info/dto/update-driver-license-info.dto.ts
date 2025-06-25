import { PartialType } from '@nestjs/mapped-types'
import { CreateDriverLicenseInfoDto } from './create-driver-license-info.dto'

export class UpdateDriverLicenseInfoDto extends PartialType(
  CreateDriverLicenseInfoDto,
) {}
