import { Module } from '@nestjs/common';
import { DocumentFileService } from './document-file.service';
import { DocumentFileController } from './document-file.controller';

@Module({
  controllers: [DocumentFileController],
  providers: [DocumentFileService],
})
export class DocumentFileModule {}
