import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { RequestStatus } from '@prisma/client'
import { lastValueFrom } from 'rxjs'
import { RequestLogService } from '../request-log/request-log.service'
import { SendImageMessageDto, SendMessageDto } from './dto/send-message.dto'

type MetaMediaMetadata = {
  url: string
  mime_type: string
  file_size: number
}

@Injectable()
export class MetaWhatsappService {
  private readonly logger = new Logger(MetaWhatsappService.name)

  constructor(
    private readonly httpService: HttpService,
    private readonly requestLogService: RequestLogService,
  ) {}

  private get authHeaders() {
    return { Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}` }
  }

  private get messagesUrl() {
    return `${process.env.META_API_URL}/${process.env.META_PHONE_NUMBER_ID}/messages`
  }

  async sendMessage(message: SendMessageDto) {
    await this.post({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: message.to,
      type: 'text',
      text: { preview_url: false, body: message.body },
    })
  }

  async sendImageMessage(message: SendImageMessageDto) {
    await this.post({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: message.to,
      type: 'image',
      image: { link: message.media, caption: message.caption },
    })
  }

  private async post(payload: Record<string, unknown>) {
    try {
      const response = await lastValueFrom(
        this.httpService.post(this.messagesUrl, payload, {
          headers: {
            ...this.authHeaders,
            accept: 'application/json',
            'content-type': 'application/json',
          },
          timeout: 15000,
        }),
      )
      await this.requestLogService.create({
        direction: 'OUT',
        status: RequestStatus.SUCCESS,
        initiator: 'MBP',
        data: JSON.stringify(payload),
        response: JSON.stringify(response.data),
      })
    } catch (error) {
      // Outside the 24h customer service window Meta only accepts approved
      // templates, and rejects free-form text with error code 131047.
      this.logger.error(
        `Meta send failed: ${JSON.stringify(error?.response?.data ?? error?.message)}`,
      )
      await this.requestLogService.create({
        direction: 'OUT',
        status: RequestStatus.FAIL,
        initiator: 'MBP',
        data: JSON.stringify(payload),
        response: JSON.stringify(error?.response?.data ?? error?.message),
      })
      throw error
    }
  }

  /** Resolves a media id to its metadata. The returned url expires quickly. */
  async getMediaMetadata(mediaId: string): Promise<MetaMediaMetadata> {
    const response = await lastValueFrom(
      this.httpService.get(`${process.env.META_API_URL}/${mediaId}`, {
        headers: this.authHeaders,
        timeout: 15000,
      }),
    )
    return response.data
  }

  /**
   * Meta media can only be fetched with the access token, and the download url
   * expires within minutes, so the id is resolved and downloaded on demand.
   * Returns a data URI, which OCR.space accepts directly.
   */
  async downloadMediaAsDataUri(mediaId: string): Promise<string> {
    const metadata = await this.getMediaMetadata(mediaId)
    const response = await lastValueFrom(
      this.httpService.get(metadata.url, {
        headers: this.authHeaders,
        responseType: 'arraybuffer',
        timeout: 30000,
      }),
    )
    const base64 = Buffer.from(response.data).toString('base64')
    return `data:${metadata.mime_type};base64,${base64}`
  }
}
