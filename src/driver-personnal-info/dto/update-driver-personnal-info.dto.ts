import { PartialType } from '@nestjs/mapped-types';
import { CreateDriverPersonnalInfoDto } from './create-driver-personnal-info.dto';

export class UpdateDriverPersonnalInfoDto extends PartialType(CreateDriverPersonnalInfoDto) {}
