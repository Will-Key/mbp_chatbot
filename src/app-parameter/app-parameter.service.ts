import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from 'prisma/prisma.service'
import {
  APP_PARAMETER_KEYS,
  WHATSAPP_PROVIDERS,
  WhatsappProvider,
} from './app-parameter.constants'

@Injectable()
export class AppParameterService {
  private readonly logger = new Logger(AppParameterService.name)

  constructor(private readonly prismaService: PrismaService) {}

  findAll() {
    return this.prismaService.appParameter.findMany({ orderBy: { key: 'asc' } })
  }

  async findValue(key: string): Promise<string | null> {
    const parameter = await this.prismaService.appParameter.findUnique({
      where: { key },
    })
    return parameter?.value ?? null
  }

  upsert(key: string, value: string, description?: string) {
    return this.prismaService.appParameter.upsert({
      where: { key },
      create: { key, value, description },
      update: { value },
    })
  }

  async getWhatsappProvider(): Promise<WhatsappProvider> {
    const raw = await this.findValue(APP_PARAMETER_KEYS.whatsappProvider)
    if (raw === WHATSAPP_PROVIDERS.meta) return WHATSAPP_PROVIDERS.meta
    if (raw !== WHATSAPP_PROVIDERS.whapi) {
      this.logger.warn(
        `Unknown WhatsApp provider "${raw}". Using ${WHATSAPP_PROVIDERS.whapi}.`,
      )
    }
    return WHATSAPP_PROVIDERS.whapi
  }

  async isMetaWhatsappProvider(): Promise<boolean> {
    return (await this.getWhatsappProvider()) === WHATSAPP_PROVIDERS.meta
  }
}
