import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  RawBodyRequest,
} from '@nestjs/common'
import { createHmac, timingSafeEqual } from 'crypto'
import { Request } from 'express'
import { AppParameterService } from '../app-parameter/app-parameter.service'
import { isMetaWebhook } from './dto/meta-webhook.dto'

const SIGNATURE_HEADER = 'x-hub-signature-256'

/**
 * Meta signs every webhook delivery with the app secret. Without this check
 * anyone who knows the public callback URL could inject fake inbound messages
 * and drive registrations.
 *
 * Enforced as soon as the payload looks like Meta's, and for every payload
 * once Meta is the active provider — otherwise a forged Whapi-shaped body
 * would sidestep the check entirely.
 */
@Injectable()
export class MetaSignatureGuard implements CanActivate {
  private readonly logger = new Logger(MetaSignatureGuard.name)

  constructor(private readonly appParameterService: AppParameterService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RawBodyRequest<Request>>()

    const signatureRequired =
      isMetaWebhook(request.body) ||
      (await this.appParameterService.isMetaWhatsappProvider())
    if (!signatureRequired) return true

    const secret = process.env.META_APP_SECRET
    if (!secret) {
      // Fail closed: accepting unverified Meta traffic is the very thing
      // this guard exists to prevent.
      this.logger.error(
        'META_APP_SECRET is not set; refusing the webhook delivery',
      )
      throw new ForbiddenException()
    }

    const received = this.readSignature(request)
    if (!received || !request.rawBody?.length) {
      this.logger.warn('Webhook delivery without a usable signature')
      throw new ForbiddenException()
    }

    const expected =
      'sha256=' +
      createHmac('sha256', secret).update(request.rawBody).digest('hex')

    if (!this.matches(received, expected)) {
      this.logger.warn('Webhook delivery with an invalid signature')
      throw new ForbiddenException()
    }

    return true
  }

  private readSignature(request: Request): string | null {
    const header = request.headers[SIGNATURE_HEADER]
    if (Array.isArray(header)) return header[0] ?? null
    return header ?? null
  }

  private matches(received: string, expected: string): boolean {
    const receivedBuffer = Buffer.from(received)
    const expectedBuffer = Buffer.from(expected)
    // timingSafeEqual throws on a length mismatch.
    if (receivedBuffer.length !== expectedBuffer.length) return false
    return timingSafeEqual(receivedBuffer, expectedBuffer)
  }
}
