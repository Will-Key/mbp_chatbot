import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { queueConfig } from './rabbitmq/constants'
import { MicroserviceOptions } from '@nestjs/microservices'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.connectMicroservice<MicroserviceOptions>({
    ...queueConfig('whapi-queue'),
  })
  await app.listen(3000)
}
bootstrap()
