import { Injectable } from '@nestjs/common'
import { CreateDocumentFileDto } from './dto/create-document-file.dto'
import { UpdateDocumentFileDto } from './dto/update-document-file.dto'
import { PrismaService } from 'prisma/prisma.service'

@Injectable()
export class DocumentFileService {
  constructor(private readonly prismaService: PrismaService) {}

  create(createDocumentFileDto: CreateDocumentFileDto) {
    return this.prismaService.documentFile.create({
      data: createDocumentFileDto,
    })
  }

  findAll() {
    return this.prismaService.documentFile.findMany()
  }

  findAllByWhaPhoneNumber(whaPhoneNumber: string) {
    return this.prismaService.documentFile.findMany({
      where: {
        whaPhoneNumber,
      },
    })
  }

  findOne(id: number) {
    return this.prismaService.documentFile.findUnique({ where: { id } })
  }

  update(id: number, updateDocumentFileDto: UpdateDocumentFileDto) {
    return this.prismaService.documentFile.update({
      data: updateDocumentFileDto,
      where: { id },
    })
  }

  remove(id: number) {
    return this.prismaService.documentFile.delete({ where: { id } })
  }
}
