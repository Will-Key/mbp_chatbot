import { ClientProviderOptions, Transport } from '@nestjs/microservices'

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
