export class SendMessageDto {
  to: string
  body: string
  typing_time: number
}

export class SendImageMessageDto {
  to: string
  caption?: string
  media: string
  typing_time: number
}
