import { ClientProviderOptions, Transport } from '@nestjs/microservices'

export const WHAPI_RECEIVED_QUEUE_NAME = 'whapi-receive-queue'
export const WHAPI_SENT_QUEUE_NAME = 'whapi-sent-queue'
export const OCR_SENT_QUEUE_NAME = 'ocr-sent-queue'
export const OCR_RECEIVED_QUEUE_NAME = 'ocr-received-queue'

export const queueConfig = (
  queueName: string,
  url = 'amqp://0.0.0.0:5672',
): ClientProviderOptions => ({
  name: queueName,
  transport: Transport.RMQ,
  options: {
    urls: [url],
    queue: queueName,
    queueOptions: {
      durable: true,
    },
  },
})
