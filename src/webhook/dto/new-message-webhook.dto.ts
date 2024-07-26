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

enum MessageType {
  text = 'text',
  image = 'image',
}

enum MessageStatus {
  failed = 'failed',
  pending = 'pending',
  sent = 'sent',
  delivered = 'delivered',
  read = 'read',
  played = 'played',
  deleted = 'deleted',
}

class MessageTextDto {
  @IsNotEmpty()
  @IsString()
  body: string
}

class MessageImageDto {
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
  messageType: MessageType

  @IsNotEmpty()
  @IsString()
  chat_id: string

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
