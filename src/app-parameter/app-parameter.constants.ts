export const APP_PARAMETER_KEYS = {
  whatsappProvider: 'WHATSAPP_PROVIDER',
} as const

export const WHATSAPP_PROVIDERS = {
  whapi: 'WHAPI',
  meta: 'META',
} as const

export type WhatsappProvider =
  (typeof WHATSAPP_PROVIDERS)[keyof typeof WHATSAPP_PROVIDERS]

export const INITIAL_APP_PARAMETERS: {
  key: string
  value: string
  description: string
}[] = [
  {
    key: APP_PARAMETER_KEYS.whatsappProvider,
    value: WHATSAPP_PROVIDERS.whapi,
    description: `Fournisseur WhatsApp sortant : ${WHATSAPP_PROVIDERS.whapi} ou ${WHATSAPP_PROVIDERS.meta} (API Cloud officielle). Bascule tous les envois, OTP compris.`,
  },
]
