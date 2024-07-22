import {
  RequestDirection,
  RequestStatus,
  RequestInitiator,
} from '@prisma/client'
import { IsEnum, IsNotEmpty, IsString } from 'class-validator'

export class CreateRequestLogDto {
  @IsNotEmpty()
  @IsEnum(RequestDirection)
  direction: RequestDirection

  @IsNotEmpty()
  @IsEnum(RequestStatus)
  status: RequestStatus

  @IsNotEmpty()
  @IsEnum(RequestInitiator)
  initiator: RequestInitiator

  @IsNotEmpty()
  @IsString()
  data: string

  @IsNotEmpty()
  @IsString()
  response: string
}
