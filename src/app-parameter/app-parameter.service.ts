import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from 'prisma/prisma.service'
import {
  APP_PARAMETER_KEYS,
  NOTIFICATION_CHANNELS,
  NotificationChannel,
  REFERRAL_TRIGGERS,
  ReferralTrigger,
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

  private async findNumber(key: string, fallback: number): Promise<number> {
    const raw = await this.findValue(key)
    const parsed = Number(raw)
    if (raw === null || raw.trim() === '' || !Number.isFinite(parsed)) {
      this.logger.warn(`Parameter ${key} is not a number. Using ${fallback}.`)
      return fallback
    }
    return parsed
  }

  async getReferralBonusAmount(): Promise<number> {
    return this.findNumber(APP_PARAMETER_KEYS.referralBonusAmount, 1000)
  }

  async getReferralTrigger(): Promise<ReferralTrigger> {
    const raw = await this.findValue(APP_PARAMETER_KEYS.referralTrigger)
    if (raw === REFERRAL_TRIGGERS.onFilleulRides) {
      return REFERRAL_TRIGGERS.onFilleulRides
    }
    if (raw !== REFERRAL_TRIGGERS.onRegistration) {
      this.logger.warn(
        `Unknown referral trigger "${raw}". Using ${REFERRAL_TRIGGERS.onRegistration}.`,
      )
    }
    return REFERRAL_TRIGGERS.onRegistration
  }

  async getReferralFilleulRidesThreshold(): Promise<number> {
    return this.findNumber(APP_PARAMETER_KEYS.referralFilleulRidesThreshold, 75)
  }

  /** null when no cap is configured. */
  async getReferralMonthlyCapPerSponsor(): Promise<number | null> {
    const raw = await this.findValue(
      APP_PARAMETER_KEYS.referralMonthlyCapPerSponsor,
    )
    if (raw === null || raw.trim() === '') return null

    const parsed = Number(raw)
    if (!Number.isInteger(parsed) || parsed < 0) {
      this.logger.warn(
        `Parameter ${APP_PARAMETER_KEYS.referralMonthlyCapPerSponsor} is not a positive integer. Ignoring the cap.`,
      )
      return null
    }
    return parsed
  }

  async isLoyaltyBonusAutoCreditEnabled(): Promise<boolean> {
    return (
      (await this.findValue(APP_PARAMETER_KEYS.loyaltyBonusAutoCredit)) ===
      'true'
    )
  }

  async getLoyaltyPeriodCutoffDays(): Promise<number[]> {
    const raw = await this.findValue(APP_PARAMETER_KEYS.loyaltyPeriodCutoffDays)
    const days = (raw ?? '')
      .split(',')
      .map((day) => Number(day.trim()))
      .filter((day) => Number.isInteger(day) && day >= 1 && day <= 28)

    if (!days.length) {
      this.logger.warn(
        `Parameter ${APP_PARAMETER_KEYS.loyaltyPeriodCutoffDays} holds no usable day. Using 1,16.`,
      )
      return [1, 16]
    }
    return [...new Set(days)].sort((a, b) => a - b)
  }

  async getNotificationChannel(): Promise<NotificationChannel> {
    const raw = await this.findValue(APP_PARAMETER_KEYS.notificationChannel)
    if (
      raw === NOTIFICATION_CHANNELS.whatsapp ||
      raw === NOTIFICATION_CHANNELS.sms ||
      raw === NOTIFICATION_CHANNELS.both
    ) {
      return raw
    }
    this.logger.warn(
      `Unknown notification channel "${raw}". Using ${NOTIFICATION_CHANNELS.both}.`,
    )
    return NOTIFICATION_CHANNELS.both
  }

  async getLoyaltyBonusMinDriverAgeDays(): Promise<number> {
    return this.findNumber(APP_PARAMETER_KEYS.loyaltyBonusMinDriverAgeDays, 0)
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
