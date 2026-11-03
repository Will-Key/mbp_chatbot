/**
 * Shape of the Meta WhatsApp Cloud API webhook. Only the parts the chatbot
 * consumes are typed; Meta sends much more (pricing, conversation, errors...).
 */
export type MetaMessage = {
  id: string
  from: string
  timestamp?: string
  type: string
  text?: { body: string }
  image?: {
    id: string
    mime_type?: string
    sha256?: string
    caption?: string
  }
}

export type MetaChangeValue = {
  messaging_product?: string
  metadata?: { display_phone_number?: string; phone_number_id?: string }
  contacts?: { profile?: { name?: string }; wa_id: string }[]
  messages?: MetaMessage[]
  // Delivery receipts: no `messages`, so these events are ignored.
  statuses?: {
    id: string
    status: string
    timestamp: string
    recipient_id: string
  }[]
}

export type MetaWebhookDto = {
  object?: string
  entry?: {
    id?: string
    changes?: { field?: string; value?: MetaChangeValue }[]
  }[]
}

export const META_WEBHOOK_OBJECT = 'whatsapp_business_account'

export function isMetaWebhook(payload: unknown): payload is MetaWebhookDto {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    (payload as MetaWebhookDto).object === META_WEBHOOK_OBJECT
  )
}
