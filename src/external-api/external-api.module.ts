import { Module } from '@nestjs/common'
import { WhapiService } from './whapi.service'
import { HttpModule } from '@nestjs/axios'
import { RequestLogModule } from '../request-log/request-log.module'

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    RequestLogModule,
  ],
  providers: [WhapiService],
  exports: [WhapiService],
})
export class ExternalApiModule {}
