import { DocumentSide, DocumentType } from '@prisma/client'
import {
  IsDataURI,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator'

export class CreateDocumentFileDto {
  @IsNotEmpty()
  @IsDataURI()
  dataImageUrl: string

  @IsNotEmpty()
  @IsEnum(DocumentSide)
  documentSide: DocumentSide

  @IsNotEmpty()
  @IsEnum(DocumentType)
  documentType: DocumentType

  @IsNotEmpty()
  @IsString()
  @MinLength(11)
  whaPhoneNumber: string
}
