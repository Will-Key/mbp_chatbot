import { PartialType } from '@nestjs/mapped-types'
import { CreateRequestLogDto } from './create-request-log.dto'

export class UpdateRequestLogDto extends PartialType(CreateRequestLogDto) {}
