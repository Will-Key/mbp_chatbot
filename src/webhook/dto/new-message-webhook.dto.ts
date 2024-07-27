import { Type } from 'class-transformer'
import {
  IsBoolean,
  IsDefined,
  IsEnum,
  IsNotEmpty,
  IsNotEmptyObject,
  IsNumber,
  IsObject,
  IsString,
  ValidateNested,
} from 'class-validator'

export enum MessageType {
  text = 'text',
  image = 'image',
}

export enum MessageStatus {
  failed = 'failed',
  pending = 'pending',
  sent = 'sent',
  delivered = 'delivered',
  read = 'read',
  played = 'played',
  deleted = 'deleted',
}

export class MessageTextDto {
  @IsNotEmpty()
  @IsString()
  body: string
}

export class MessageImageDto {
  @IsNotEmpty()
  @IsString()
  id: string

  @IsNotEmpty()
  @IsString()
  link: string

  @IsNotEmpty()
  @IsString()
  mime_type: string

  @IsNotEmpty()
  @IsNumber()
  file_size: number
}

export class NewMessageWebhookDto {
  @IsNotEmpty()
  @IsString()
  id: string

  @IsNotEmpty()
  @IsEnum(MessageType)
  type: MessageType

  @IsNotEmpty()
  @IsString()
  chat_id: string

  @IsNotEmpty()
  @IsString()
  from: string

  @IsNotEmpty()
  @IsBoolean()
  from_me: boolean

  @IsNotEmpty()
  @IsEnum(MessageStatus)
  status: MessageStatus

  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => MessageTextDto)
  text: MessageTextDto

  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => MessageImageDto)
  image: MessageImageDto
}
