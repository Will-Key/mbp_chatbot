import { PartialType } from '@nestjs/mapped-types';
import { CreateDriverPersonalInfoDto } from './create-driver-personal-info.dto';

export class UpdateDriverPersonalInfoDto extends PartialType(CreateDriverPersonalInfoDto) {}
