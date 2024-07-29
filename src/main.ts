import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { queueConfig, WHAPI_QUEUE_NAME } from './rabbitmq/constants'
import { MicroserviceOptions } from '@nestjs/microservices'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.connectMicroservice<MicroserviceOptions>({
    ...queueConfig(WHAPI_QUEUE_NAME),
  })
  await app.listen(3000)
}
bootstrap()
