import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import {
  OCR_RECEIVED_QUEUE_NAME,
  OCR_SENT_QUEUE_NAME,
  WHAPI_RECEIVED_QUEUE_NAME,
  WHAPI_SENT_QUEUE_NAME,
} from './rabbitmq/constants'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { baseUrl, rabbitmqPort } from './shared/constants'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [`amqp://${baseUrl}:${rabbitmqPort}`],
      queue: WHAPI_RECEIVED_QUEUE_NAME,
    },
  })
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [`amqp://${baseUrl}:${rabbitmqPort}`],
      queue: WHAPI_SENT_QUEUE_NAME,
    },
  })
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [`amqp://${baseUrl}:${rabbitmqPort}`],
      queue: OCR_SENT_QUEUE_NAME,
    },
  })
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [`amqp://${baseUrl}:${rabbitmqPort}`],
      queue: OCR_RECEIVED_QUEUE_NAME,
    },
  })
  await app.startAllMicroservices()
  await app.listen(3001)
}
bootstrap()
