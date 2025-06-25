import { NestFactory } from '@nestjs/core'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { AppModule } from './app.module'
import {
  CREATE_YANGO_CAR_SENT_QUEUE_NAME,
  CREATE_YANGO_PROFILE_SENT_QUEUE_NAME,
  OCR_RECEIVED_QUEUE_NAME,
  OCR_SENT_QUEUE_NAME,
  UPDATE_YANGO_DRIVER_INFO_SENT_QUEUE_NAME,
  WHAPI_RECEIVED_QUEUE_NAME,
  WHAPI_SENT_QUEUE_NAME,
} from './rabbitmq/constants'
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
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [`amqp://${baseUrl}:${rabbitmqPort}`],
      queue: CREATE_YANGO_PROFILE_SENT_QUEUE_NAME,
    },
  })
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [`amqp://${baseUrl}:${rabbitmqPort}`],
      queue: CREATE_YANGO_CAR_SENT_QUEUE_NAME,
    },
  })
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [`amqp://${baseUrl}:${rabbitmqPort}`],
      queue: UPDATE_YANGO_DRIVER_INFO_SENT_QUEUE_NAME,
    },
  })
  await app.startAllMicroservices()
  await app.listen(3001)
}
bootstrap()
