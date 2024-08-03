import {
  RequestDirection,
  RequestStatus,
  RequestInitiator,
} from '@prisma/client'
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator'

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

  @IsOptional()
  @IsString()
  response?: string
}
