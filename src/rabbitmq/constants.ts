import { ClientProviderOptions, Transport } from '@nestjs/microservices'

export const WHAPI_RECEIVED_QUEUE_NAME = 'whapi-receiveid-queue'
export const WHAPI_SENT_QUEUE_NAME = 'whapi-sent-queue'

export const queueConfig = (
  queueName: string,
  url = 'amqp://localhost:5672',
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
