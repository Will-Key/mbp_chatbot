import { Module } from '@nestjs/common'
import { DocumentFileService } from './document-file.service'
//import { DocumentFileController } from './document-file.controller'
import { PrismaService } from '../../prisma/prisma.service'

@Module({
  //controllers: [DocumentFileController],
  providers: [DocumentFileService, PrismaService],
})
export class DocumentFileModule {}
