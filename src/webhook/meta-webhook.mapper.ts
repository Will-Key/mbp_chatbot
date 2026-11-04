import {
  MessageStatus,
  MessageType,
  NewMessageWebhookDto,
} from './dto/new-message-webhook.dto'
import { MetaWebhookDto } from './dto/meta-webhook.dto'

/**
 * Normalises a Meta Cloud API payload into the internal message shape the
 * chatbot already speaks, so the conversation engine stays provider-agnostic.
 *
 * Returns null for everything that is not an inbound message (delivery
 * receipts, template status updates, account events).
 *
 * Note on images: Meta only sends a media id. There is no public link, no
 * base64 preview and no file size in the webhook — those are resolved later
 * from the id, with the access token.
 */
export function mapMetaWebhook(
  payload: MetaWebhookDto,
): NewMessageWebhookDto | null {
  const value = payload?.entry?.[0]?.changes?.[0]?.value
  const metaMessage = value?.messages?.[0]
  if (!metaMessage) return null

  return {
    status: MessageStatus.delivered,
    messages: [
      {
        id: metaMessage.id,
        // Meta has no conversation id: the sender's wa_id identifies the chat.
        chat_id: metaMessage.from,
        from: metaMessage.from,
        // Meta never echoes messages sent by the business.
        from_me: false,
        type: metaMessage.type as MessageType,
        text: {
          body: metaMessage.text?.body ?? metaMessage.image?.caption ?? '',
        },
        image: metaMessage.image
          ? {
              id: metaMessage.image.id,
              link: '',
              preview: '',
              mime_type: metaMessage.image.mime_type ?? '',
              file_size: 0,
            }
          : undefined,
      },
    ],
  }
}
