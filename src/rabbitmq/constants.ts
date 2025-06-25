import { ClientProviderOptions, Transport } from '@nestjs/microservices'

export const WHAPI_RECEIVED_QUEUE_NAME = 'whapi-receive-queue'
export const WHAPI_SENT_QUEUE_NAME = 'whapi-sent-queue'
export const OCR_SENT_QUEUE_NAME = 'ocr-sent-queue'
export const OCR_RECEIVED_QUEUE_NAME = 'ocr-received-queue'
export const CREATE_YANGO_PROFILE_SENT_QUEUE_NAME =
  'create-yango-profile-sent-queue'
export const CREATE_YANGO_CAR_SENT_QUEUE_NAME = 'create-yango-car-sent-queue'
export const UPDATE_YANGO_DRIVER_INFO_SENT_QUEUE_NAME =
  'update-yango-driver-info-sent-queue'

export const queueConfig = (
  queueName: string,
  url = 'amqp://rabbitmq:5672',
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
