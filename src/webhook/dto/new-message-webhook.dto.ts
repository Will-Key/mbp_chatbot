import { Type } from 'class-transformer'
import {
  IsArray,
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

export class MessageBodyDto {
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
  preview: string

  @IsNotEmpty()
  @IsString()
  mime_type: string

  @IsNotEmpty()
  @IsNumber()
  file_size: number
}

export class MessageTextDto {
  @IsNotEmpty()
  @IsString()
  id: string

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
  @IsEnum(MessageType)
  type: MessageType

  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => MessageImageDto)
  image: MessageImageDto

  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => MessageBodyDto)
  text: MessageBodyDto
}

export class NewMessageWebhookDto {
  @IsNotEmpty()
  @IsEnum(MessageStatus)
  status: MessageStatus

  @IsDefined()
  @IsArray()
  messages: MessageTextDto[]
}
