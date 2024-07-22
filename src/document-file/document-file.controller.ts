import {
  //Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common'
import { DocumentFileService } from './document-file.service'
import { CreateDocumentFileDto } from './dto/create-document-file.dto'
import { UpdateDocumentFileDto } from './dto/update-document-file.dto'

//@Controller('document-file')
export class DocumentFileController {
  constructor(private readonly documentFileService: DocumentFileService) {}

  @Post()
  create(@Body() createDocumentFileDto: CreateDocumentFileDto) {
    return this.documentFileService.create(createDocumentFileDto)
  }

  @Get()
  findAll() {
    return this.documentFileService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.documentFileService.findOne(+id)
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDocumentFileDto: UpdateDocumentFileDto,
  ) {
    return this.documentFileService.update(+id, updateDocumentFileDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.documentFileService.remove(+id)
  }
}
