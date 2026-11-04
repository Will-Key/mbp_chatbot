import { Module } from '@nestjs/common'
import { PrismaService } from 'prisma/prisma.service'
import { AppParameterService } from './app-parameter.service'

@Module({
  providers: [AppParameterService, PrismaService],
  exports: [AppParameterService],
})
export class AppParameterModule {}
