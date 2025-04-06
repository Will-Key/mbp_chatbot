import { PartialType } from '@nestjs/mapped-types';
import { CreateDriverPersonalInfoDto } from './create-driver-Personal-info.dto';

export class UpdateDriverPersonalInfoDto extends PartialType(CreateDriverPersonalInfoDto) {}
